import type { PerformanceRange } from "@/lib/shared/analytics";
import type { NavPoint } from "@/lib/fund/fund.types";
import type { AsyncView, ChartSeriesDisplay, MetricDisplay, OutcomeDisplay } from "./display.types";

export interface FactDisplay {
  label: string;
  valueText: string;
  numeric?: boolean;
}
export interface AllocationDisplay {
  name: string;
  weightText: string;
  weight: number;
  color: string;
}
export interface FundHeaderDisplay {
  title: string;
  subtitle: string;
}

export interface PerformanceDisplay {
  range: PerformanceRange;
  periodLabel: string;
  outcomes: readonly OutcomeDisplay[];
  series: readonly ChartSeriesDisplay[];
}

export interface CurrentNavDisplay {
  valueText: string;
  dateText: string;
}

export interface MetricGroupDisplay {
  title: string;
  metrics: readonly MetricDisplay[];
}

export interface HoldingDisplay {
  name: string;
  weight: number;
  weightText: string;
}

export interface SectorDisplay {
  name: string;
  weightText: string;
  holdings: readonly HoldingDisplay[];
}

export interface PortfolioDisplay {
  reportDateText: string;
  sectors: readonly SectorDisplay[];
  assetAllocation: readonly AllocationDisplay[];
  marketCapAllocation: readonly AllocationDisplay[];
  concentrationText: string | null;
}

export interface RelatedFundDisplay {
  schemeCode: string;
  schemeName: string;
  amc: string;
  category: string;
  nav: NavPoint | null;
  aum: number | null;
  riskLabel: string | null;
  oneYearReturn: number | null;
  threeYearReturn: number | null;
}

export interface FundResearchReadyModel {
  schemeCode: string;
  header: FundHeaderDisplay;
  currentNav: CurrentNavDisplay;
  benchmark: { name: string; returnBasis: "total_return" } | null;
  performance: AsyncView<PerformanceDisplay>;
  metricGroups: readonly MetricGroupDisplay[];
  rollingBenchmarkComparison: {
    timeframeYears: number;
    hitRateText: string;
    windowCount: number;
  } | null;
  returnConsistency: {
    timeframe: string;
    averageReturn: number | null;
    medianReturn: number | null;
    minReturn: number | null;
    maxReturn: number | null;
    positiveRatio: number | null;
    negativeRatio: number | null;
    consistencyScore: number | null;
  } | null;
  relatedFunds: {
    peers: readonly RelatedFundDisplay[];
    fromAmc: readonly RelatedFundDisplay[];
  };
  facts: readonly FactDisplay[];
  portfolio: AsyncView<PortfolioDisplay>;
}

export type FundResearchScreenModel =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; data: FundResearchReadyModel };
