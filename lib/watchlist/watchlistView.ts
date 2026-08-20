/** Turns a resolved `FundResearch` into the compact, card-displayable shape watchlist detail
 * pages render. Reuses `fundService.getFundResearchBatch` rather than issuing one fetch per
 * scheme code. */
import type { FundResearch } from "../fund/fund.types";
import type { WatchlistItemSummary } from "./watchlist.schema";

export function toWatchlistItemSummary(fund: FundResearch): WatchlistItemSummary {
  return {
    schemeCode: fund.scheme.schemeCode,
    schemeName: fund.scheme.schemeName,
    amc: fund.scheme.amc,
    category: fund.scheme.category,
    riskLabel: fund.facts.riskLabel,
    aum: fund.facts.aum,
    // FundMetrics values are fractions (0.123); FundCard's formatPercent expects a percentage
    // (12.3), matching RelatedFund's oneYearReturn/threeYearReturn convention.
    oneYearReturn: fund.metrics.oneYear.value === null ? null : fund.metrics.oneYear.value * 100,
    threeYearReturn:
      fund.metrics.threeYear.value === null ? null : fund.metrics.threeYear.value * 100,
    currentNav: fund.currentNav?.nav ?? null,
  };
}

export interface WatchlistUnresolvedItem {
  schemeCode: string;
}
