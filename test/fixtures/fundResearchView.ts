import type { Scheme } from "@/lib/fund/fund.schema";
import type { FundResearch } from "@/lib/fund/fund.types";

type FundResearchOverrides = {
  [K in keyof FundResearch]?: FundResearch[K] extends readonly unknown[]
    ? FundResearch[K]
    : FundResearch[K] extends object
      ? Partial<FundResearch[K]>
      : FundResearch[K];
};

const baseFundResearch: FundResearch = {
  scheme: {
    schemeCode: "122639",
    schemeName: "Fund",
    amc: "AMC",
    category: "Equity",
    plan: "Direct",
    option: "Growth",
  },
  nav: [],
  benchmark: null,
  currentNav: null,
  facts: {
    aum: null,
    expenseRatio: null,
    portfolioTurnover: null,
    benchmark: null,
    riskLabel: null,
    managers: [],
  },
  portfolio: null,
  availability: {
    navHistory: { available: false, source: null, reason: "not available" },
    facts: { available: true },
    portfolio: { available: false, reason: "not available" },
  },
  metrics: {
    oneYear: { value: null, label: "1Y" },
    threeYear: { value: null, label: "3Y" },
    fiveYear: { value: null, label: "5Y" },
    volatility: { value: null, label: "Volatility" },
    maxDrawdown: { value: null, label: "Max drawdown" },
  },
  returnConsistency: null,
  relatedFunds: { peers: [], fromAmc: [] },
};

/** Full, schema-valid `FundResearch` fixture; pass overrides for the fields a test cares about. */
export function fundResearchFixture(overrides: FundResearchOverrides = {}): FundResearch {
  return {
    ...baseFundResearch,
    ...overrides,
    scheme: { ...baseFundResearch.scheme, ...overrides.scheme },
    facts: { ...baseFundResearch.facts, ...overrides.facts },
    availability: { ...baseFundResearch.availability, ...overrides.availability },
    metrics: { ...baseFundResearch.metrics, ...overrides.metrics },
    relatedFunds: { ...baseFundResearch.relatedFunds, ...overrides.relatedFunds },
  };
}

/** Minimal, schema-valid `FundResearchView` payload for `/api/funds/:schemeCode` e2e mocks. */
export function fundResearchViewFixture(scheme: Scheme) {
  return {
    scheme,
    currentNav: { date: "2026-08-19", nav: 82.5 },
    benchmark: { name: "Nifty 500 TRI", returnBasis: "total_return" },
    performance: { status: "unavailable", message: "Performance data is not available right now." },
    metricGroups: [],
    returnConsistency: null,
    relatedFunds: { peers: [], fromAmc: [] },
    facts: {
      aum: 45000,
      expenseRatio: 0.62,
      portfolioTurnover: 12,
      benchmark: "Nifty 500 TRI",
      riskLabel: "Very High",
      managers: ["Rajeev Thakkar"],
    },
    portfolio: { status: "unavailable", message: "Portfolio data is not available right now." },
  };
}
