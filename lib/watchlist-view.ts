/** Turns a resolved `FundResearch` into the compact, card-displayable shape watchlist detail
 * pages render. Reuses `fundService.getFundResearchBatch` rather than issuing one fetch per
 * scheme code. */
import type { FundResearch } from "./fund-types.ts";

export interface WatchlistItemSummary {
  schemeCode: string;
  schemeName: string;
  amc: string;
  category: string;
  riskLabel: string | null;
  aum: number | null;
  oneYearReturn: number | null;
  threeYearReturn: number | null;
  currentNav: number | null;
}

export function toWatchlistItemSummary(fund: FundResearch): WatchlistItemSummary {
  return {
    schemeCode: fund.scheme.schemeCode,
    schemeName: fund.scheme.schemeName,
    amc: fund.scheme.amc,
    category: fund.scheme.category,
    riskLabel: fund.facts.riskLabel,
    aum: fund.facts.aum,
    oneYearReturn: fund.metrics.oneYear.value,
    threeYearReturn: fund.metrics.threeYear.value,
    currentNav: fund.currentNav?.nav ?? null,
  };
}

export interface WatchlistUnresolvedItem {
  schemeCode: string;
}
