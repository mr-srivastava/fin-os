/** Builds, persists, and serves the scheme catalogue. TigZig is the catalogue of record; FinAPI is never a gate here. */
import * as v from "valibot";
import { EQUITY_CATEGORIES, type EquityCategory } from "../fund/fundCategories";
import { finapiService, type FundSnapshot } from "../providers/finapi.service";
import { tigzigService } from "../providers/tigzig.service";
import { ensureIndexes, getDb } from "../providers/mongo";
import type { RelatedFund, Scheme } from "../fund/fund.schema";
import {
  CATALOGUE_META_COLLECTION,
  CatalogueEntrySchema,
  CatalogueMetaSchema,
  SCHEMES_COLLECTION,
  type CatalogueEntry,
  type CatalogueMeta,
} from "./fundCatalog.types";

export interface CatalogueRefreshSummary {
  version: string;
  generatedAt: string;
  totalSchemes: number;
  byCategory: Record<string, number>;
  removedPriorVersionDocs: number;
}

export interface CatalogueRefreshOptions {
  /** Called with progress lines as the refresh runs. Defaults to no-op (silent). */
  log?: (message: string) => void;
}

const silentLog = () => {};

/**
 * True when `entry` already carries a complete, same-day snapshot: taken today (a `YYYY-MM-DD`
 * prefix of an ISO timestamp) AND written by a version of this code that populated every
 * current `financials` field. A snapshot written before a field like `oneYearReturn` existed
 * has that key `undefined` even though `financials` itself is non-null - checking `snapshotAt`
 * alone would treat it as "done for today" and skip re-fetching, leaving the new field
 * permanently blank until the next calendar day. Checking every field's presence makes a
 * refresh self-healing across schema changes, not just date changes.
 */
function hasSnapshotFromDay(entry: CatalogueEntry | undefined, today: string): boolean {
  const financials = entry?.financials;
  return (
    financials !== null &&
    financials?.snapshotAt.slice(0, 10) === today &&
    financials?.nav !== undefined &&
    financials?.aum !== undefined &&
    financials?.riskLabel !== undefined &&
    financials?.oneYearReturn !== undefined &&
    financials?.threeYearReturn !== undefined
  );
}

async function buildCatalogueEntries(log: (message: string) => void): Promise<{
  entries: CatalogueEntry[];
  generatedAt: string;
  version: string;
  byCategory: Map<string, number>;
}> {
  const generatedAt = new Date().toISOString();
  const version = generatedAt;
  const today = generatedAt.slice(0, 10);

  log("Fetching TigZig catalogue (all equity categories)...");
  const rows = await tigzigService.fetchCatalogue(log);
  log(`TigZig catalogue: ${rows.length} eligible schemes total`);
  if (rows.length === 0) {
    throw new Error("TigZig returned zero eligible schemes across all categories - aborting.");
  }

  const byCategory = new Map<string, number>();
  for (const category of EQUITY_CATEGORIES) byCategory.set(category, 0);
  for (const row of rows) byCategory.set(row.category, (byCategory.get(row.category) ?? 0) + 1);
  const emptyCategories = [...byCategory]
    .filter(([, count]) => count === 0)
    .map(([category]) => category);
  if (emptyCategories.length > 0) {
    throw new Error(`TigZig returned zero schemes for: ${emptyCategories.join(", ")} - aborting.`);
  }

  // Reuse any snapshot already taken today (e.g. from an earlier run this same day) instead of
  // re-fetching it, so re-running the refresh converges rather than re-paying the full NAV/facts
  // fetch cost every time. A scheme's financials only go stale - and get re-fetched - once its
  // last snapshot is no longer from today.
  const existingByCode = new Map(
    (await getCurrentEntries()).map((entry) => [entry.schemeCode, entry] as const),
  );
  const codesNeedingSnapshot = rows
    .map((row) => row.schemeCode)
    .filter((schemeCode) => !hasSnapshotFromDay(existingByCode.get(schemeCode), today));
  log(
    `${rows.length - codesNeedingSnapshot.length}/${rows.length} schemes already have a snapshot from today (${today}) - reusing those, fetching ${codesNeedingSnapshot.length}...`,
  );

  const snapshots = await fetchSnapshotsInChunks(codesNeedingSnapshot, log);
  log(
    `Snapshots fetched: ${snapshots.size}/${codesNeedingSnapshot.length} newly-requested schemes`,
  );

  const entries: CatalogueEntry[] = rows.map((row) => {
    const existing = existingByCode.get(row.schemeCode);
    if (hasSnapshotFromDay(existing, today)) {
      return {
        ...row,
        finapiCrossCheck: null,
        financials: existing!.financials,
        sourceLastSeenAt: generatedAt,
        catalogueVersion: version,
      };
    }
    const snapshot = snapshots.get(row.schemeCode);
    return {
      ...row,
      finapiCrossCheck: null,
      // A fetch that failed today falls back to the last snapshot we do have (even if stale)
      // rather than blanking out card data that was previously showing; its `snapshotAt` stays
      // in the past, so the next run will retry it rather than treating it as done for today.
      financials: snapshot
        ? {
            nav: snapshot.nav,
            aum: snapshot.aum,
            riskLabel: snapshot.riskLabel,
            oneYearReturn: snapshot.oneYearReturn,
            threeYearReturn: snapshot.threeYearReturn,
            snapshotAt: generatedAt,
          }
        : (existing?.financials ?? null),
      sourceLastSeenAt: generatedAt,
      catalogueVersion: version,
    };
  });

  return { entries, generatedAt, version, byCategory };
}

const SNAPSHOT_CHUNK_SIZE = 25;
const SNAPSHOT_CHUNK_DELAY_MS = 300;
/** Exponential backoff before each retry of a chunk that resolved nothing (likely rate-limited). */
const SNAPSHOT_RETRY_BACKOFF_MS = [5_000, 15_000, 45_000];

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Fetches NAV/facts snapshots for the whole catalogue in bounded-size chunks so one refresh
 * run doesn't fire thousands of concurrent FinAPI+TigZig requests at once. A short delay
 * between chunks, plus up to three backoff-and-retry attempts on a chunk that resolves
 * nothing (a strong signal of rate-limiting rather than genuinely bad schemes - a single
 * short retry wasn't enough against what looks like a window-based limit), keep one
 * rate-limit streak from silently dropping an entire category's worth of schemes. A chunk
 * that still resolves nothing after every retry is skipped - those schemes simply keep
 * `financials: null` until the next refresh; per-scheme failures are already absorbed inside
 * `getFundSnapshots`.
 */
async function fetchSnapshotsInChunks(
  schemeCodes: readonly string[],
  log: (message: string) => void,
) {
  const snapshots = new Map<string, FundSnapshot>();
  const totalChunks = Math.ceil(schemeCodes.length / SNAPSHOT_CHUNK_SIZE);
  log(
    `Fetching NAV/facts snapshots for ${schemeCodes.length} schemes in ${totalChunks} chunks of ${SNAPSHOT_CHUNK_SIZE}...`,
  );
  for (let index = 0; index < schemeCodes.length; index += SNAPSHOT_CHUNK_SIZE) {
    const chunk = schemeCodes.slice(index, index + SNAPSHOT_CHUNK_SIZE);
    const chunkNumber = index / SNAPSHOT_CHUNK_SIZE + 1;
    if (index > 0) await sleep(SNAPSHOT_CHUNK_DELAY_MS);

    let chunkSnapshots = await fetchChunkSnapshots(chunk);
    for (const backoffMs of SNAPSHOT_RETRY_BACKOFF_MS) {
      if (chunkSnapshots.size > 0 || chunk.length === 0) break;
      log(
        `  snapshot chunk ${chunkNumber}/${totalChunks}: 0/${chunk.length} resolved, retrying in ${backoffMs / 1000}s...`,
      );
      await sleep(backoffMs);
      chunkSnapshots = await fetchChunkSnapshots(chunk);
    }
    for (const [schemeCode, snapshot] of chunkSnapshots) snapshots.set(schemeCode, snapshot);
    log(
      `  snapshot chunk ${chunkNumber}/${totalChunks}: ${chunkSnapshots.size}/${chunk.length} resolved`,
    );
  }
  return snapshots;
}

async function fetchChunkSnapshots(chunk: readonly string[]): Promise<Map<string, FundSnapshot>> {
  try {
    return await finapiService.getFundSnapshots(chunk);
  } catch {
    // A whole chunk throwing is unexpected (per-scheme failures are already absorbed inside
    // getFundSnapshots); treat it the same as an all-empty chunk so the retry logic covers it.
    return new Map();
  }
}

/**
 * Fetches the current catalogue from TigZig and writes it to Mongo. Writes are
 * additive-then-swap: new documents land under a fresh `catalogueVersion`, the
 * `catalogue_meta` pointer is flipped to it in one update, and only then are
 * older-version documents removed - so a reader querying by the current version never
 * sees a half-written catalogue.
 */
export async function refreshCatalogue(
  options: CatalogueRefreshOptions = {},
): Promise<CatalogueRefreshSummary> {
  const log = options.log ?? silentLog;
  const { entries, generatedAt, version, byCategory } = await buildCatalogueEntries(log);

  log("Connecting to Mongo...");
  const db = await getDb();
  log("Ensuring indexes...");
  await ensureIndexes();
  log(`Writing ${entries.length} catalogue documents under version ${version}...`);
  await db.collection<CatalogueEntry>(SCHEMES_COLLECTION).insertMany(entries);

  const meta: CatalogueMeta = {
    _id: "current",
    version,
    generatedAt,
    totalSchemes: entries.length,
    tigzigSnapshot: { generatedAt: null, etag: null },
  };
  log("Flipping catalogue_meta pointer to the new version...");
  await db
    .collection<CatalogueMeta>(CATALOGUE_META_COLLECTION)
    .replaceOne({ _id: "current" }, meta, { upsert: true });

  log("Removing prior-version documents...");
  const { deletedCount } = await db
    .collection<CatalogueEntry>(SCHEMES_COLLECTION)
    .deleteMany({ catalogueVersion: { $ne: version } });
  log(`Removed ${deletedCount} prior-version document(s). Done.`);

  return {
    version,
    generatedAt,
    totalSchemes: entries.length,
    byCategory: Object.fromEntries(byCategory),
    removedPriorVersionDocs: deletedCount,
  };
}

function toScheme(entry: CatalogueEntry): Scheme {
  return {
    schemeCode: entry.schemeCode,
    schemeName: entry.schemeName,
    amc: entry.amc,
    category: entry.categorySub,
    plan: entry.plan,
    option: entry.option,
  };
}

/** Like {@link toScheme}, plus the catalogue's last-refresh NAV/facts snapshot for card display. */
function toCatalogueScheme(entry: CatalogueEntry): RelatedFund {
  return {
    ...toScheme(entry),
    nav: entry.financials?.nav ?? null,
    aum: entry.financials?.aum ?? null,
    riskLabel: entry.financials?.riskLabel ?? null,
    oneYearReturn: entry.financials?.oneYearReturn ?? null,
    threeYearReturn: entry.financials?.threeYearReturn ?? null,
  };
}

/** Reads every scheme in the currently-live catalogue version. Never closes the shared Mongo client. */
async function getCurrentEntries(): Promise<CatalogueEntry[]> {
  const db = await getDb();
  const metaDoc = await db.collection<CatalogueMeta>(CATALOGUE_META_COLLECTION).findOne({
    _id: "current",
  });
  if (!metaDoc) {
    console.error(
      "catalogService: no catalogue has been refreshed yet (catalogue_meta has no 'current' pointer). Run `pnpm catalog:refresh`.",
    );
    return [];
  }
  const meta = v.parse(CatalogueMetaSchema, metaDoc);
  const docs = await db
    .collection<CatalogueEntry>(SCHEMES_COLLECTION)
    .find({ catalogueVersion: meta.version })
    .toArray();
  return docs.map((doc) => v.parse(CatalogueEntrySchema, doc));
}

async function getCurrentVersion(): Promise<string | null> {
  const db = await getDb();
  const metaDoc = await db.collection<CatalogueMeta>(CATALOGUE_META_COLLECTION).findOne({
    _id: "current",
  });
  return metaDoc ? v.parse(CatalogueMetaSchema, metaDoc).version : null;
}

/** Searches the catalogue by scheme name or AMC for the browse search box, via the `schemeName_amc_text` index. */
export async function searchCatalogue(query: string): Promise<Scheme[]> {
  const version = await getCurrentVersion();
  if (!version) return [];
  const db = await getDb();
  const docs = await db
    .collection<CatalogueEntry>(SCHEMES_COLLECTION)
    .find({ catalogueVersion: version, $text: { $search: query } })
    .limit(12)
    .toArray();
  return docs.map((doc) => toScheme(v.parse(CatalogueEntrySchema, doc)));
}

/** Lists the catalogue's schemes in one supported equity category for the browse experience. */
export async function listCatalogueByCategory(category: EquityCategory): Promise<RelatedFund[]> {
  const version = await getCurrentVersion();
  if (!version) return [];
  const db = await getDb();
  const docs = await db
    .collection<CatalogueEntry>(SCHEMES_COLLECTION)
    .find({ catalogueVersion: version, category })
    .sort({ "financials.oneYearReturn": -1, "financials.threeYearReturn": -1, schemeName: 1 })
    .limit(24)
    .toArray();
  return docs.map((doc) => toCatalogueScheme(v.parse(CatalogueEntrySchema, doc)));
}

export const catalogService = {
  refresh: refreshCatalogue,
  search: searchCatalogue,
  listByCategory: listCatalogueByCategory,
};
