import type { PerformanceRange } from "@/lib/shared/analytics";
import type { AsyncView, ChartSeriesDisplay, MetricDisplay, OutcomeDisplay } from "./display.types";

export interface ComparisonSelectionDisplay {
  schemeCode: string | null;
  title: string;
  subtitle: string | null;
  navText: string;
  status: "empty" | "loading" | "error" | "ready";
}

export interface ComparisonAllocationItem {
  name: string;
  color: string;
  leftWeight: number | null;
  rightWeight: number | null;
  leftText: string;
  rightText: string;
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
    assetAllocation: readonly ComparisonAllocationItem[];
    marketCapAllocation: readonly ComparisonAllocationItem[];
    concentration: readonly [string | null, string | null];
  }>;
}

export interface ComparisonScreenModel {
  selections: readonly [ComparisonSelectionDisplay, ComparisonSelectionDisplay];
  requestError: string | null;
  comparison: AsyncView<ComparisonReadyDisplay>;
}
