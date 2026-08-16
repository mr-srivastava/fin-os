import type { PerformanceRange } from "@/lib/analytics";

export type DisplayStatus = "gain" | "loss" | "neutral";
export type AsyncView<T> =
  | { status: "loading" }
  | { status: "unavailable"; message: string }
  | { status: "ready"; data: T };

export interface MetricDisplay {
  label: string;
  valueText: string;
  status: DisplayStatus;
}

export interface OutcomeDisplay {
  name: string;
  color: "fund" | "benchmark" | "comparison-a" | "comparison-b";
  returnText: string;
  valueText: string;
  status: DisplayStatus;
}

export interface ChartSeriesDisplay {
  name: string;
  color: "foreground" | "chart-1" | "chart-3";
  points: readonly { date: string; value: number }[];
}

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

export interface FundResearchReadyModel {
  schemeCode: string;
  header: FundHeaderDisplay;
  currentNav: CurrentNavDisplay;
  benchmark: { name: string; returnBasis: "total_return" } | null;
  performance: AsyncView<PerformanceDisplay>;
  metricGroups: readonly MetricGroupDisplay[];
  facts: readonly FactDisplay[];
  portfolio: AsyncView<PortfolioDisplay>;
}

export type FundResearchScreenModel =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; data: FundResearchReadyModel };

export interface ComparisonSelectionDisplay {
  schemeCode: string | null;
  title: string;
  subtitle: string | null;
  navText: string;
  status: "empty" | "loading" | "error" | "ready";
}

export interface ComparisonReadyDisplay {
  fundNames: readonly [string, string];
  performance: AsyncView<{
    range: PerformanceRange;
    outcomes: readonly OutcomeDisplay[];
    series: readonly ChartSeriesDisplay[];
  }>;
  characteristics: AsyncView<readonly { label: string; values: readonly MetricDisplay[] }[]>;
  facts: readonly { label: string; values: readonly string[] }[];
  portfolio: AsyncView<{
    reportDateText: string;
    sectorAllocation: readonly { name: string; leftText: string; rightText: string }[];
    assetAllocation: readonly { name: string; leftText: string; rightText: string }[];
    marketCapAllocation: readonly { name: string; leftText: string; rightText: string }[];
    concentration: readonly [string | null, string | null];
  }>;
}

export interface ComparisonScreenModel {
  selections: readonly [ComparisonSelectionDisplay, ComparisonSelectionDisplay];
  requestError: string | null;
  comparison: AsyncView<ComparisonReadyDisplay>;
}
