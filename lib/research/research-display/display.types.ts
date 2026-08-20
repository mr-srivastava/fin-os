export type DisplayStatus = "gain" | "loss" | "neutral";
export type AsyncView<T> =
  | { status: "loading" }
  | { status: "unavailable"; message: string }
  | { status: "ready"; data: T };

export interface MetricDisplay {
  label: string;
  valueText: string;
  status: DisplayStatus;
  /** Optional descriptive comparison to the fund's own history, e.g. "above its own 3-year average". */
  context?: string;
}

export interface OutcomeDisplay {
  name: string;
  color: "fund" | "benchmark" | "comparison-a" | "comparison-b";
  returnPercent: number | null;
  returnText: string;
  valueText: string;
  status: DisplayStatus;
}

export interface ChartSeriesDisplay {
  name: string;
  color: "chart-1" | "chart-3";
  points: readonly { date: string; value: number }[];
}
