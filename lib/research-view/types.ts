import type { PerformanceRange } from "@/lib/analytics";
import type { RelatedFund, Scheme } from "@/lib/fund-types";

export type Section<T> = { status: "ready"; data: T } | { status: "unavailable"; message: string };
export type Tone = "gain" | "loss" | "neutral";

export interface PerformanceRangeView {
  label: string;
  series: readonly { name: string; points: readonly { date: string; value: number }[] }[];
  outcomes: readonly {
    name: string;
    returnPercent: number | null;
    endingValue: number | null;
    tone: Tone;
  }[];
}

export interface FundResearchView {
  scheme: Scheme;
  currentNav: { nav: number; date: string } | null;
  benchmark: { name: string; returnBasis: "total_return" } | null;
  performance: Section<Record<PerformanceRange, PerformanceRangeView>>;
  metricGroups: readonly {
    id: "returns" | "risk";
    metrics: readonly { id: string; value: number | null; tone: Tone }[];
  }[];
  returnConsistency: {
    timeframe: string;
    averageReturn: number;
    medianReturn: number;
    minReturn: number;
    maxReturn: number;
    positiveRatio: number;
    negativeRatio: number;
    consistencyScore: number | null;
  } | null;
  relatedFunds: {
    peers: readonly RelatedFund[];
    fromAmc: readonly RelatedFund[];
  };
  facts: {
    aum: number | null;
    expenseRatio: number | null;
    portfolioTurnover: number | null;
    benchmark: string | null;
    riskLabel: string | null;
    managers: readonly string[];
  };
  portfolio: Section<{
    asOf: string | null;
    sectors: readonly {
      name: string;
      weight: number;
      holdings: readonly { name: string; weight: number }[];
    }[];
    assetAllocation: readonly { name: string; weight: number }[];
    marketCapAllocation: readonly { name: string; weight: number }[];
    topTenConcentration: number | null;
  }>;
}

export interface ComparisonView {
  selections: readonly (
    | { status: "ready"; scheme: Scheme; currentNav: { nav: number; date: string } | null }
    | { status: "unavailable"; schemeCode: string; message: string }
  )[];
  comparison: Section<{
    fundNames: readonly [string, string];
    performance: Section<Record<PerformanceRange, PerformanceRangeView>>;
    metrics: Section<
      readonly { id: string; values: readonly { value: number | null; tone: Tone }[] }[]
    >;
    facts: readonly { id: string; values: readonly (number | string | null)[] }[];
    portfolio: Section<{
      reportDates: readonly (string | null)[];
      sectorAllocation: readonly {
        name: string;
        weights: readonly [number | null, number | null];
      }[];
      assetAllocation: readonly {
        name: string;
        weights: readonly [number | null, number | null];
      }[];
      marketCapAllocation: readonly {
        name: string;
        weights: readonly [number | null, number | null];
      }[];
      concentration: readonly [number | null, number | null];
    }>;
  }>;
}
