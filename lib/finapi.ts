import { sampleSeries } from "./analytics.ts";
import type {
  AllocationItem,
  FundFacts,
  FundResearch,
  NavPoint,
  PortfolioItem,
  PortfolioSnapshot,
  Scheme,
  ReturnConsistency,
} from "./fund-types.ts";
import { ProviderError, toNav } from "./provider.ts";
import { metricsFor, unavailableMetrics } from "./fund-metrics.ts";
import { isSchemeCode } from "./fund-input.ts";
import {
  providerIsoDate,
  providerList,
  providerNumber,
  providerRecord,
  providerText,
  type ProviderRecord,
} from "./provider-input.ts";
import { resolveBenchmark } from "./benchmark-catalog.ts";
import { getFinapiTri } from "./finapi-index.ts";
import { getTigzigNav } from "./tigzig-nav.ts";
import type { EquityCategory } from "./fund-categories.ts";

export { ProviderError, toNav } from "./provider.ts";

const BASE_URL = "https://finapi.upvaly.com/api/mf";
const EQUITY_CATEGORIES = [
  "flexi cap",
  "large cap",
  "large & mid cap",
  "mid cap",
  "small cap",
  "focused",
  "value",
  "contra",
];
const REQUEST_TIMEOUT_MS = 10_000;

function valueAt(source: ProviderRecord, keys: string[]) {
  for (const key of keys) if (key in source) return source[key];
  return undefined;
}

function toScheme(source: ProviderRecord): Scheme | null {
  const schemeCode = providerText(valueAt(source, ["schemeCode", "scheme_code"]));
  const schemeName = providerText(valueAt(source, ["schemeName", "scheme_name"]));
  if (!schemeCode || !isSchemeCode(schemeCode) || !schemeName) return null;
  return {
    schemeCode,
    schemeName,
    amc: providerText(valueAt(source, ["fundHouse", "companyName", "amc"])) ?? "AMC not supplied",
    category:
      providerText(
        valueAt(source, ["schemeCategory", "schemeSubCategory", "schemeCategoryLabel", "category"]),
      ) ?? "Equity scheme",
    plan: providerText(valueAt(source, ["planName", "plan"])) ?? "",
    option: providerText(valueAt(source, ["optionName", "option"])) ?? "",
  };
}

function toRelatedScheme(source: ProviderRecord, fallback: Scheme): Scheme | null {
  const schemeCode = providerText(valueAt(source, ["schemeCode", "scheme_code"]));
  const schemeName = providerText(valueAt(source, ["schemeName", "scheme_name"]));
  if (!schemeCode || !isSchemeCode(schemeCode) || !schemeName) return null;
  const lowerName = schemeName.toLowerCase();
  if (!lowerName.includes("direct") || !lowerName.includes("growth")) return null;
  return {
    schemeCode,
    schemeName,
    amc: providerText(valueAt(source, ["fundHouse", "companyName", "amc"])) ?? fallback.amc,
    category: providerText(valueAt(source, ["schemeCategory", "category"])) ?? fallback.category,
    plan: providerText(valueAt(source, ["planName", "plan"])) ?? "Direct",
    option: providerText(valueAt(source, ["optionName", "option"])) ?? "Growth",
  };
}

function isEligible(source: ProviderRecord, scheme: Scheme) {
  const category = scheme.category.toLowerCase();
  const plan = scheme.plan.toLowerCase();
  const option = scheme.option.toLowerCase();
  const active = valueAt(source, ["isActive", "is_active", "active"]);
  return (
    active !== false &&
    active !== "false" &&
    plan.includes("direct") &&
    option.includes("growth") &&
    EQUITY_CATEGORIES.some((value) => category.includes(value))
  );
}

function normalizeRelatedFunds(source: ProviderRecord, scheme: Scheme) {
  const related = (value: unknown, requireCategory: boolean) =>
    (providerList(value) ?? [])
      .flatMap((item) => {
        const candidate = providerRecord(item);
        const relatedScheme = candidate && toRelatedScheme(candidate, scheme);
        return relatedScheme &&
          (!requireCategory || providerText(valueAt(candidate!, ["schemeCategory", "category"]))) &&
          isEligible(candidate!, relatedScheme)
          ? [relatedScheme]
          : [];
      })
      .filter(
        (candidate, index, items) =>
          candidate.schemeCode !== scheme.schemeCode &&
          items.findIndex((item) => item.schemeCode === candidate.schemeCode) === index,
      )
      .slice(0, 6);
  const fromAmc = providerRecord(source.moreFundsFromAmc);
  return { peers: related(source.peers, false), fromAmc: related(fromAmc?.schemeList, true) };
}

function normalizeReturnConsistency(value: unknown, timeframe = "3Y"): ReturnConsistency | null {
  const rows = providerList(value) ?? [];
  const row = rows
    .map(providerRecord)
    .find((item) => providerText(item?.timeframe)?.toUpperCase() === timeframe);
  if (!row) return null;
  const averageReturn = providerNumber(row.averageReturn);
  const medianReturn = providerNumber(row.medianReturn);
  const minReturn = providerNumber(row.minReturn);
  const maxReturn = providerNumber(row.maxReturn);
  const positiveRatio = providerNumber(row.positiveRatio);
  const negativeRatio = providerNumber(row.negativeRatio);
  if (
    averageReturn === null ||
    medianReturn === null ||
    minReturn === null ||
    maxReturn === null ||
    positiveRatio === null ||
    negativeRatio === null
  )
    return null;
  return {
    timeframe: providerText(row.timeframe) ?? timeframe,
    averageReturn,
    medianReturn,
    minReturn,
    maxReturn,
    positiveRatio,
    negativeRatio,
    consistencyScore: providerNumber(row.consistencyScore),
  };
}

function toAllocation(value: unknown): AllocationItem[] {
  const object = providerRecord(value);
  if (object) {
    return Object.entries(object).flatMap(([name, rawWeight]) => {
      const weight = providerNumber(rawWeight);
      return weight !== null ? [{ name: allocationLabel(name), weight: weight / 100 }] : [];
    });
  }
  return (providerList(value) ?? []).flatMap((item) => {
    const source = providerRecord(item);
    const name =
      source &&
      providerText(
        valueAt(source, ["sector", "name", "label", "category", "assetClass", "marketCap"]),
      );
    const weight =
      source && providerNumber(valueAt(source, ["weightage", "weight", "weightPct", "percentage"]));
    return name && weight !== null ? [{ name, weight: weight / 100 }] : [];
  });
}

function allocationLabel(name: string) {
  return name
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/Allocation$/i, "")
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
    .trim();
}

function toHoldings(value: unknown): PortfolioItem[] {
  return (providerList(value) ?? []).flatMap((item) => {
    const source = providerRecord(item);
    const name = source && providerText(source.name);
    const weight = source && providerNumber(valueAt(source, ["weightage", "weight", "weightPct"]));
    return name && weight !== null && weight > 0
      ? [{ name, weight: weight / 100, sector: providerText(source.sector) }]
      : [];
  });
}

function portfolioAsOf(source: ProviderRecord) {
  return providerIsoDate(
    valueAt(source, [
      "portfolioAsOf",
      "portfolioAsOfDate",
      "portfolioDate",
      "holdingsAsOf",
      "holdingsAsOfDate",
      "asOfDate",
    ]),
  );
}

export function normalizeFundPayload(payload: unknown): FundResearch | null {
  const envelope = providerRecord(payload);
  const data = envelope && providerRecord(envelope.data);
  if (!data) return null;
  const scheme = toScheme(data);
  if (!scheme || !isEligible(data, scheme)) return null;

  const nav = toNav(valueAt(data, ["navHistory", "nav", "navData", "historicalNav"]));
  const latestNav = providerNumber(valueAt(data, ["latestNav", "navValue"]));
  const latestNavDate = providerIsoDate(valueAt(data, ["latestNavDate", "navDate"]));
  const currentNav =
    latestNav !== null && latestNavDate
      ? { nav: latestNav, date: latestNavDate }
      : (nav.at(-1) ?? null);
  const facts: FundFacts = {
    aum: providerNumber(data.aum),
    expenseRatio: providerNumber(data.expenseRatio),
    portfolioTurnover: providerNumber(data.portfolioTurnover),
    benchmark: providerText(data.benchmarkIndex),
    riskLabel: providerText(data.schemeRisk),
    managers: (providerText(data.schemeFundManagers) ?? "")
      .split(",")
      .map((name) => name.trim())
      .filter(Boolean),
  };
  const portfolio = toPortfolio(data, portfolioAsOf(data));
  const hasPortfolioData =
    portfolio.holdings.length > 0 ||
    portfolio.sectors.length > 0 ||
    portfolio.assetAllocation.length > 0 ||
    portfolio.marketCapAllocation.length > 0 ||
    portfolio.topTenConcentration !== null;
  const portfolioReason =
    process.env.FINAPI_PORTFOLIO_ENABLED === "false"
      ? "Current portfolio research is temporarily unavailable."
      : hasPortfolioData
        ? undefined
        : "A reported portfolio is unavailable for this fund.";
  const hasFacts = Object.values(facts).some((value) =>
    Array.isArray(value) ? value.length > 0 : value !== null,
  );
  return {
    scheme,
    nav: sampleSeries(nav),
    benchmark: null,
    currentNav,
    facts,
    portfolio:
      process.env.FINAPI_PORTFOLIO_ENABLED === "false" || !hasPortfolioData ? null : portfolio,
    availability: {
      navHistory: {
        available: false,
        source: null,
        reason: "NAV history has not been loaded yet.",
      },
      facts: hasFacts
        ? { available: true }
        : {
            available: false,
            reason: "Fund details are unavailable for this fund.",
          },
      portfolio:
        hasPortfolioData && process.env.FINAPI_PORTFOLIO_ENABLED !== "false"
          ? { available: true }
          : {
              available: false,
              reason: portfolioReason ?? "Portfolio data is unavailable right now.",
            },
    },
    metrics: metricsFor(nav),
    returnConsistency: normalizeReturnConsistency(data.rollingReturns),
    relatedFunds: normalizeRelatedFunds(data, scheme),
  };
}

function toPortfolio(source: ProviderRecord, asOf: string | null): PortfolioSnapshot {
  const holdings = toHoldings(source.holdings);
  const portfolio = providerRecord(source.portfolio);
  const concentration = providerRecord(portfolio?.concentration ?? source.concentration);
  return {
    asOf,
    holdings,
    sectors: toAllocation(source.sectors),
    assetAllocation: toAllocation(portfolio?.assetAllocation ?? source.assetAllocation),
    marketCapAllocation: toAllocation(portfolio?.marketCapWeightage ?? source.marketCapWeightage),
    topTenConcentration: providerNumber(
      valueAt(concentration ?? source, [
        "topTen",
        "top10",
        "topTenConcentration",
        "top10StocksWeight",
      ]),
    ),
  };
}

async function request(path: string): Promise<ProviderRecord> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  let response: Response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      next: { revalidate: 300 },
      signal: controller.signal,
    });
  } catch {
    throw new ProviderError("The market-data service is unavailable. Try again shortly.", 503);
  } finally {
    clearTimeout(timeout);
  }
  if (!response.ok) {
    if (response.status === 429)
      throw new ProviderError("The data service is busy. Try again in a moment.", 429);
    throw new ProviderError("We could not retrieve live fund data right now.", 502);
  }
  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new ProviderError("The data service returned an invalid response.", 502);
  }
  const envelope = providerRecord(payload);
  if (!envelope) throw new ProviderError("The data service returned an unexpected response.", 502);
  return envelope;
}

async function getRollingSummary(
  schemeCode: string,
  timeframe: "1Y" | "3Y" | "5Y",
): Promise<ReturnConsistency | null> {
  const payload = await request(
    `/scheme-code/${schemeCode}/rolling-summary?period=${timeframe.toLowerCase()}`,
  );
  return normalizeReturnConsistency(payload.data, timeframe);
}

export async function resolveIsin(isin: string): Promise<string | null> {
  const payload = await request(`/isin/${encodeURIComponent(isin)}`);
  const rows = providerList(payload.data) ?? [payload.data];
  for (const row of rows) {
    const source = providerRecord(row);
    const scheme = source && toScheme(source);
    if (source && scheme && isEligible(source, scheme)) return scheme.schemeCode;
  }
  return null;
}

export async function searchSchemes(query: string) {
  const payload = await request(`/search?schemeName=${encodeURIComponent(query)}`);
  const results = providerList(payload.data) ?? [];
  return results
    .flatMap((item) => {
      const source = providerRecord(item);
      const scheme = source && toScheme(source);
      return source && scheme && isEligible(source, scheme) ? [scheme] : [];
    })
    .slice(0, 12);
}

/** Lists the supported eligible schemes in one category for the browse experience. */
export async function listSchemesByCategory(category: EquityCategory) {
  const payload = await request(`/search?schemeName=${encodeURIComponent(category)}`);
  const categoryName = category.toLowerCase();
  const results = providerList(payload.data) ?? [];
  return results
    .flatMap((item) => {
      const source = providerRecord(item);
      const scheme = source && toScheme(source);
      return source &&
        scheme &&
        isEligible(source, scheme) &&
        scheme.category.toLowerCase().includes(categoryName)
        ? [scheme]
        : [];
    })
    .filter(
      (scheme, index, schemes) =>
        schemes.findIndex((candidate) => candidate.schemeCode === scheme.schemeCode) === index,
    )
    .sort((left, right) => left.schemeName.localeCompare(right.schemeName))
    .slice(0, 24);
}

async function loadFundResearch(
  schemeCode: string,
  benchmarkRequests: Map<string, Promise<PromiseSettledResult<NavPoint[]>>>,
): Promise<FundResearch | null> {
  const [fundResult, navResult] = await Promise.allSettled([
    request(`/scheme-code/${schemeCode}`),
    getTigzigNav(schemeCode),
  ]);
  if (fundResult.status === "rejected") throw fundResult.reason;
  const normalized = normalizeFundPayload(fundResult.value);
  if (!normalized) return null;
  clearNavResearch(normalized);
  if (navResult.status === "rejected") {
    normalized.availability.navHistory = {
      available: false,
      source: null,
      reason:
        navResult.reason instanceof ProviderError
          ? navResult.reason.message
          : "NAV history is unavailable right now.",
    };
    return normalized;
  }
  applyNavHistory(normalized, navResult.value);
  const rollingResults = await Promise.allSettled(
    (["1Y", "3Y", "5Y"] as const).map((timeframe) => getRollingSummary(schemeCode, timeframe)),
  );
  const preferredRolling = rollingResults[1];
  if (preferredRolling?.status === "fulfilled" && preferredRolling.value)
    normalized.returnConsistency = preferredRolling.value;
  const definition = resolveBenchmark(normalized.facts.benchmark);
  if (!definition) return normalized;
  const benchmark =
    benchmarkRequests.get(definition.finapiIndexName) ??
    Promise.allSettled([getFinapiTri(definition.finapiIndexName)]).then(([result]) => result!);
  benchmarkRequests.set(definition.finapiIndexName, benchmark);
  const benchmarkResult = await benchmark;
  if (benchmarkResult.status === "fulfilled" && benchmarkResult.value.length > 1) {
    normalized.benchmark = {
      name: definition.displayName,
      returnBasis: definition.returnBasis,
      nav: sampleSeries(benchmarkResult.value),
    };
  }
  return normalized;
}

/** Loads one or more funds while sharing matching benchmark requests across the batch. */
export async function getFundResearchBatch(
  schemeCodes: readonly string[],
): Promise<PromiseSettledResult<FundResearch | null>[]> {
  const benchmarkRequests = new Map<string, Promise<PromiseSettledResult<NavPoint[]>>>();
  return Promise.allSettled(
    schemeCodes.map((schemeCode) => loadFundResearch(schemeCode, benchmarkRequests)),
  );
}

export async function getFundResearch(schemeCode: string): Promise<FundResearch | null> {
  const [result] = await getFundResearchBatch([schemeCode]);
  if (!result) throw new ProviderError("We could not load this fund right now.");
  if (result.status === "rejected") throw result.reason;
  return result.value;
}

function clearNavResearch(fund: FundResearch) {
  fund.nav = [];
  fund.benchmark = null;
  fund.currentNav = null;
  fund.metrics = unavailableMetrics();
  fund.availability.navHistory = {
    available: false,
    source: null,
    reason: "NAV history has not been loaded yet.",
  };
}

function applyNavHistory(fund: FundResearch, nav: NavPoint[]) {
  if (!nav.length) {
    fund.availability.navHistory = {
      available: false,
      source: null,
      reason: "NAV history is unavailable for this fund.",
    };
    return;
  }
  fund.nav = sampleSeries(nav);
  fund.currentNav = nav.at(-1) ?? null;
  fund.metrics = metricsFor(nav);
  fund.availability.navHistory = { available: true, source: "TigZig" };
}
