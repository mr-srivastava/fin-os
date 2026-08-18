/** Builds, persists, and serves the scheme catalogue. TigZig is the catalogue of record; FinAPI is never a gate here. */
import { EQUITY_CATEGORIES, type EquityCategory } from "./fund-categories.ts";
import { tigzigService } from "./tigzig-service.ts";
import { getDb, getMongoClient } from "./mongo.ts";
import type { Scheme } from "./fund-types.ts";
import {
  CATALOGUE_META_COLLECTION,
  SCHEMES_COLLECTION,
  type CatalogueEntry,
  type CatalogueMeta,
} from "./fund-catalog-types.ts";

export interface CatalogueRefreshSummary {
  version: string;
  generatedAt: string;
  totalSchemes: number;
  byCategory: Record<string, number>;
  removedPriorVersionDocs: number;
}

async function buildCatalogueEntries(): Promise<{
  entries: CatalogueEntry[];
  generatedAt: string;
  version: string;
  byCategory: Map<string, number>;
}> {
  const generatedAt = new Date().toISOString();
  const version = generatedAt;

  const rows = await tigzigService.fetchCatalogue();
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

  const entries: CatalogueEntry[] = rows.map((row) => ({
    ...row,
    finapiCrossCheck: null,
    sourceLastSeenAt: generatedAt,
    catalogueVersion: version,
  }));

  return { entries, generatedAt, version, byCategory };
}

/**
 * Fetches the current catalogue from TigZig and writes it to Mongo. Writes are
 * additive-then-swap: new documents land under a fresh `catalogueVersion`, the
 * `catalogue_meta` pointer is flipped to it in one update, and only then are
 * older-version documents removed - so a reader querying by the current version never
 * sees a half-written catalogue.
 */
export async function refreshCatalogue(): Promise<CatalogueRefreshSummary> {
  const { entries, generatedAt, version, byCategory } = await buildCatalogueEntries();

  const client = await getMongoClient();
  try {
    const db = await getDb();
    await db.collection<CatalogueEntry>(SCHEMES_COLLECTION).insertMany(entries);

    const meta: CatalogueMeta = {
      _id: "current",
      version,
      generatedAt,
      totalSchemes: entries.length,
      tigzigSnapshot: { generatedAt: null, etag: null },
    };
    await db
      .collection<CatalogueMeta>(CATALOGUE_META_COLLECTION)
      .replaceOne({ _id: "current" }, meta, { upsert: true });

    const { deletedCount } = await db
      .collection<CatalogueEntry>(SCHEMES_COLLECTION)
      .deleteMany({ catalogueVersion: { $ne: version } });

    return {
      version,
      generatedAt,
      totalSchemes: entries.length,
      byCategory: Object.fromEntries(byCategory),
      removedPriorVersionDocs: deletedCount,
    };
  } finally {
    await client.close();
  }
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

/** Reads every scheme in the currently-live catalogue version. Never closes the shared Mongo client. */
async function getCurrentEntries(): Promise<CatalogueEntry[]> {
  const db = await getDb();
  const meta = await db.collection<CatalogueMeta>(CATALOGUE_META_COLLECTION).findOne({
    _id: "current",
  });
  if (!meta) {
    console.error(
      "catalogService: no catalogue has been refreshed yet (catalogue_meta has no 'current' pointer). Run `pnpm catalog:refresh`.",
    );
    return [];
  }
  return db
    .collection<CatalogueEntry>(SCHEMES_COLLECTION)
    .find({ catalogueVersion: meta.version })
    .toArray();
}

/** Searches the catalogue by scheme name or AMC for the browse search box. */
export async function searchCatalogue(query: string): Promise<Scheme[]> {
  const needle = query.toLowerCase();
  const entries = await getCurrentEntries();
  return entries
    .filter(
      (entry) =>
        entry.schemeName.toLowerCase().includes(needle) || entry.amc.toLowerCase().includes(needle),
    )
    .slice(0, 12)
    .map(toScheme);
}

/** Lists the catalogue's schemes in one supported equity category for the browse experience. */
export async function listCatalogueByCategory(category: EquityCategory): Promise<Scheme[]> {
  const entries = await getCurrentEntries();
  return entries
    .filter((entry) => entry.category === category)
    .sort((left, right) => left.schemeName.localeCompare(right.schemeName))
    .slice(0, 24)
    .map(toScheme);
}

export const catalogService = {
  refresh: refreshCatalogue,
  search: searchCatalogue,
  listByCategory: listCatalogueByCategory,
};
