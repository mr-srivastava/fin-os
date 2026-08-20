import type { RelatedFund, Scheme } from "@/lib/fund/fund.schema";

/** A dated NAV value. `nav` is a positive currency value. */
export interface NavPoint {
  date: string;
  nav: number;
}

export interface BenchmarkSeries {
  name: string;
  returnBasis: BenchmarkReturnBasis;
  nav: NavPoint[];
}

export interface ReturnConsistency {
  timeframe: string;
  averageReturn: number;
  medianReturn: number;
  minReturn: number;
  maxReturn: number;
  positiveRatio: number;
  negativeRatio: number;
  consistencyScore: number | null;
}

export type BenchmarkReturnBasis = "total_return";

export interface Metric {
  value: number | null;
  label: string;
}

export type MetricKey = "oneYear" | "threeYear" | "fiveYear" | "volatility" | "maxDrawdown";

export const METRIC_KEYS = [
  "oneYear",
  "threeYear",
  "fiveYear",
  "volatility",
  "maxDrawdown",
] as const satisfies readonly MetricKey[];

export type DataAvailability = { available: true } | { available: false; reason: string };

export type NavHistoryAvailability =
  | { available: true; source: "TigZig" }
  | { available: false; source: null; reason: string };

export interface FundFacts {
  /** Assets under management, in INR crore. */
  aum: number | null;
  /** Percentage points. */
  expenseRatio: number | null;
  /** Percentage points. */
  portfolioTurnover: number | null;
  benchmark: string | null;
  riskLabel: string | null;
  managers: string[];
}

export interface WeightedItem {
  name: string;
  /** Decimal allocation, where 1 represents 100%. */
  weight: number;
}

export interface PortfolioItem extends WeightedItem {
  sector: string | null;
}

export interface AllocationItem extends WeightedItem {}

export interface PortfolioSnapshot {
  asOf: string | null;
  holdings: PortfolioItem[];
  sectors: AllocationItem[];
  assetAllocation: AllocationItem[];
  marketCapAllocation: AllocationItem[];
  /** Percentage points. */
  topTenConcentration: number | null;
}

export interface FundAvailability {
  navHistory: NavHistoryAvailability;
  facts: DataAvailability;
  portfolio: DataAvailability;
}

export type FundMetrics = Record<MetricKey, Metric>;

export interface FundResearch {
  scheme: Scheme;
  nav: NavPoint[];
  benchmark: BenchmarkSeries | null;
  currentNav: NavPoint | null;
  facts: FundFacts;
  portfolio: PortfolioSnapshot | null;
  availability: FundAvailability;
  metrics: FundMetrics;
  returnConsistency: ReturnConsistency | null;
  relatedFunds: {
    peers: RelatedFund[];
    fromAmc: RelatedFund[];
  };
}

export type FundPair<T> = readonly [T, T];

export function isFundPair<T>(items: readonly T[]): items is FundPair<T> {
  return items.length === 2;
}
