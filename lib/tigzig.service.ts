/** Wraps every TigZig endpoint this app uses: NAV history, market/TRI series, and the scheme catalogue. */
import type { NavPoint } from "./fund.types.ts";
import { isoDateYearsAgo } from "./date.ts";
import { EQUITY_CATEGORIES, isEquityCategory, type EquityCategory } from "./fundCategories.ts";
import { isSchemeCode } from "./fundInput.ts";
import {
  providerBoolean,
  providerIsoDate,
  providerList,
  providerNumber,
  providerRecord,
  providerText,
  type JsonValue,
} from "./providerInput.ts";
import { ProviderError, toNav } from "./provider.ts";
import type { CatalogueEntry } from "./fundCatalog.types.ts";

const BASE_URL = "https://api.tigzig.com/mf/v1";
const MARKET_BASE_URL = "https://api.tigzig.com/v1";
const REQUEST_TIMEOUT_MS = 10_000;
const CATALOGUE_PAGE_LIMIT = 100;

// ---- NAV history ----

export function normalizeTigzigNavPayload(payload: JsonValue): NavPoint[] | null {
  const envelope = providerRecord(payload);
  if (!envelope || !("data" in envelope)) return null;
  return toNav(envelope.data);
}

export async function getTigzigNav(schemeCode: string): Promise<NavPoint[]> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  let response: Response;
  try {
    response = await fetch(
      `${BASE_URL}/nav?scheme=${encodeURIComponent(schemeCode)}&since=${navStartDate()}`,
      {
        next: { revalidate: 300 },
        signal: controller.signal,
      },
    );
  } catch {
    throw new ProviderError("NAV data is unavailable. Try again shortly.", 503);
  } finally {
    clearTimeout(timeout);
  }
  if (!response.ok) {
    if (response.status === 429)
      throw new ProviderError("NAV data is busy. Try again in a moment.", 429);
    throw new ProviderError("We could not retrieve NAV data right now.", 502);
  }
  let payload: JsonValue;
  try {
    payload = await response.json();
  } catch {
    throw new ProviderError("NAV data could not be read right now.", 502);
  }
  const nav = normalizeTigzigNavPayload(payload);
  if (nav === null) throw new ProviderError("NAV data could not be read right now.", 502);
  return nav;
}

// ---- Market / TRI series ----

export function normalizeTigzigMarketSeriesPayload(
  payload: JsonValue,
  indicatorId: string,
): NavPoint[] | null {
  const envelope = providerRecord(payload);
  const rows = envelope && providerList(envelope.data);
  if (!rows) return null;
  return rows.flatMap((row) => {
    const point = providerRecord(row);
    const date = point && providerIsoDate(point.date);
    const nav = point && providerNumber(point[indicatorId]);
    return date && nav !== null && nav > 0 ? [{ date, nav }] : [];
  });
}

export async function getTigzigMarketSeries(indicatorId: string): Promise<NavPoint[]> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  let response: Response;
  try {
    response = await fetch(
      `${MARKET_BASE_URL}/series?ids=${encodeURIComponent(indicatorId)}&from=${navStartDate()}&format=json`,
      { next: { revalidate: 300 }, signal: controller.signal },
    );
  } catch {
    throw new ProviderError("Benchmark data is unavailable. Try again shortly.", 503);
  } finally {
    clearTimeout(timeout);
  }
  if (!response.ok) {
    if (response.status === 429)
      throw new ProviderError("Benchmark data is busy. Try again in a moment.", 429);
    throw new ProviderError("We could not retrieve benchmark data right now.", 502);
  }
  let payload: JsonValue;
  try {
    payload = await response.json();
  } catch {
    throw new ProviderError("Benchmark data could not be read right now.", 502);
  }
  const nav = normalizeTigzigMarketSeriesPayload(payload, indicatorId);
  if (nav === null) throw new ProviderError("Benchmark data could not be read right now.", 502);
  return nav;
}

function navStartDate() {
  return isoDateYearsAgo(5);
}

// ---- Scheme catalogue ----

/** A catalogue entry without the fields a refresh run assigns at write time. */
export type TigzigCatalogueRow = Omit<
  CatalogueEntry,
  "catalogueVersion" | "sourceLastSeenAt" | "finapiCrossCheck" | "financials"
>;

function categorySubFor(category: EquityCategory): string {
  return `${category} Fund`;
}

function categoryForSub(categorySub: string): EquityCategory | null {
  const candidate = categorySub.replace(/ Fund$/, "");
  return isEquityCategory(candidate) ? candidate : null;
}

export function normalizeTigzigCatalogueRow(
  row: JsonValue,
  expectedCategory: EquityCategory,
): TigzigCatalogueRow | null {
  const source = providerRecord(row);
  if (!source) return null;

  const schemeCode = providerText(source.scheme_code);
  const schemeName = providerText(source.scheme_name);
  const amc = providerText(source.amc);
  const categorySub = providerText(source.category_sub);
  const plan = providerText(source.plan);
  const option = providerText(source.option);
  const firstNavDate = providerIsoDate(source.first_date);
  const lastNavDate = providerIsoDate(source.last_date);
  const isActive = providerBoolean(source.is_active);
  const isStale = providerBoolean(source.is_stale);

  if (
    !schemeCode ||
    !isSchemeCode(schemeCode) ||
    !schemeName ||
    !amc ||
    !categorySub ||
    plan !== "Direct" ||
    option !== "Growth" ||
    !firstNavDate ||
    !lastNavDate ||
    isActive === null ||
    isStale === null
  )
    return null;

  const category = categoryForSub(categorySub);
  if (!category || category !== expectedCategory) return null;

  return {
    schemeCode,
    isin: providerText(source.isin),
    isin2: providerText(source.isin2),
    schemeName,
    amc,
    categorySub,
    category,
    plan: "Direct",
    option: "Growth",
    txicCode: providerText(source.txic_code),
    liveness: { isActive, isStale, firstNavDate, lastNavDate },
  };
}

async function requestCataloguePage(
  category: EquityCategory,
  offset: number,
): Promise<{ results: JsonValue[]; totalMatches: number }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  let response: Response;
  try {
    response = await fetch(
      `${BASE_URL}/search?category=${encodeURIComponent(categorySubFor(category))}` +
        `&plan=direct&option=growth&active=true&limit=${CATALOGUE_PAGE_LIMIT}&offset=${offset}`,
      { next: { revalidate: 300 }, signal: controller.signal },
    );
  } catch {
    throw new ProviderError("The scheme catalogue is unavailable. Try again shortly.", 503);
  } finally {
    clearTimeout(timeout);
  }
  if (!response.ok) {
    if (response.status === 429)
      throw new ProviderError("The scheme catalogue is busy. Try again in a moment.", 429);
    throw new ProviderError("We could not retrieve the scheme catalogue right now.", 502);
  }
  let payload: JsonValue;
  try {
    payload = await response.json();
  } catch {
    throw new ProviderError("The scheme catalogue returned an invalid response.", 502);
  }
  const envelope = providerRecord(payload);
  const results = envelope && providerList(envelope.results);
  if (!envelope || !results)
    throw new ProviderError("The scheme catalogue returned an unexpected response.", 502);
  const totalMatches = providerNumber(envelope.total_matches) ?? 0;
  return { results, totalMatches };
}

/** Fetches every Direct+Growth+active scheme TigZig reports for one supported equity category. */
export async function fetchTigzigCategoryEntries(
  category: EquityCategory,
  log: (message: string) => void = () => {},
): Promise<TigzigCatalogueRow[]> {
  const rows: TigzigCatalogueRow[] = [];
  let offset = 0;
  for (;;) {
    const page = await requestCataloguePage(category, offset);
    rows.push(
      ...page.results.flatMap((row) => {
        const entry = normalizeTigzigCatalogueRow(row, category);
        return entry ? [entry] : [];
      }),
    );
    offset += CATALOGUE_PAGE_LIMIT;
    log(
      `    ${category}: page at offset ${offset - CATALOGUE_PAGE_LIMIT} (${rows.length}/${page.totalMatches} so far)`,
    );
    if (offset >= page.totalMatches || page.results.length === 0) break;
  }
  return rows;
}

/** Fetches the full Direct+Growth+active catalogue across all supported equity categories. */
export async function fetchTigzigCatalogue(
  log: (message: string) => void = () => {},
): Promise<TigzigCatalogueRow[]> {
  const rows: TigzigCatalogueRow[] = [];
  const seen = new Set<string>();
  for (const category of EQUITY_CATEGORIES) {
    log(`  Fetching TigZig category "${category}"...`);
    const categoryRows = await fetchTigzigCategoryEntries(category, log);
    log(`  ${category}: ${categoryRows.length} eligible schemes`);
    for (const row of categoryRows) {
      if (seen.has(row.schemeCode)) continue;
      seen.add(row.schemeCode);
      rows.push(row);
    }
  }
  return rows;
}

export const tigzigService = {
  getNav: getTigzigNav,
  getMarketSeries: getTigzigMarketSeries,
  fetchCategoryEntries: fetchTigzigCategoryEntries,
  fetchCatalogue: fetchTigzigCatalogue,
};
