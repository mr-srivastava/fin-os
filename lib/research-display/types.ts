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
  latestNavText: string;
  latestNavDateText: string;
  outcomes: readonly OutcomeDisplay[];
  series: readonly ChartSeriesDisplay[];
}
