import type { Scheme } from "@/lib/fund.types";

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
