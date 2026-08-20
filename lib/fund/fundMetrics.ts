import {
  annualizedReturn,
  annualizedVolatility,
  captureRatios,
  excessReturn,
  informationRatio,
  maxDrawdown,
  rollingHitRate,
  trackingError,
} from "../shared/analytics";
import {
  BENCHMARK_METRIC_KEYS,
  METRIC_KEYS,
  type BenchmarkMetricKey,
  type BenchmarkMetrics,
  type FundMetrics,
  type MetricKey,
  type NavPoint,
  type RollingBenchmarkComparison,
} from "./fund.types";

const METRIC_LABELS = {
  oneYear: "1 year annualized",
  threeYear: "3 year annualized",
  fiveYear: "5 year annualized",
  volatility: "1 year annualized",
  maxDrawdown: "5 year maximum",
} as const satisfies Record<MetricKey, string>;

export function metricsFor(nav: NavPoint[]): FundMetrics {
  return {
    oneYear: { label: METRIC_LABELS.oneYear, value: annualizedReturn(nav, 1) },
    threeYear: { label: METRIC_LABELS.threeYear, value: annualizedReturn(nav, 3) },
    fiveYear: { label: METRIC_LABELS.fiveYear, value: annualizedReturn(nav, 5) },
    volatility: { label: METRIC_LABELS.volatility, value: annualizedVolatility(nav) },
    maxDrawdown: { label: METRIC_LABELS.maxDrawdown, value: maxDrawdown(nav) },
  };
}

export function unavailableMetrics(): FundMetrics {
  return Object.fromEntries(
    METRIC_KEYS.map((key) => [key, { label: METRIC_LABELS[key], value: null }]),
  ) as FundMetrics;
}

const BENCHMARK_METRIC_LABELS = {
  excessReturnOneYear: "1 year excess return vs benchmark",
  excessReturnThreeYear: "3 year excess return vs benchmark",
  excessReturnFiveYear: "5 year excess return vs benchmark",
  trackingError: "1 year tracking error",
  informationRatio: "1 year information ratio",
  upsideCapture: "Upside capture vs benchmark",
  downsideCapture: "Downside capture vs benchmark",
} as const satisfies Record<BenchmarkMetricKey, string>;

export function benchmarkMetricsFor(nav: NavPoint[], benchmarkNav: NavPoint[]): BenchmarkMetrics {
  const capture = captureRatios(nav, benchmarkNav);
  return {
    excessReturnOneYear: {
      label: BENCHMARK_METRIC_LABELS.excessReturnOneYear,
      value: excessReturn(nav, benchmarkNav, 1),
    },
    excessReturnThreeYear: {
      label: BENCHMARK_METRIC_LABELS.excessReturnThreeYear,
      value: excessReturn(nav, benchmarkNav, 3),
    },
    excessReturnFiveYear: {
      label: BENCHMARK_METRIC_LABELS.excessReturnFiveYear,
      value: excessReturn(nav, benchmarkNav, 5),
    },
    trackingError: {
      label: BENCHMARK_METRIC_LABELS.trackingError,
      value: trackingError(nav, benchmarkNav),
    },
    informationRatio: {
      label: BENCHMARK_METRIC_LABELS.informationRatio,
      value: informationRatio(nav, benchmarkNav),
    },
    upsideCapture: { label: BENCHMARK_METRIC_LABELS.upsideCapture, value: capture.upside },
    downsideCapture: { label: BENCHMARK_METRIC_LABELS.downsideCapture, value: capture.downside },
  };
}

export function unavailableBenchmarkMetrics(): BenchmarkMetrics {
  return Object.fromEntries(
    BENCHMARK_METRIC_KEYS.map((key) => [key, { label: BENCHMARK_METRIC_LABELS[key], value: null }]),
  ) as BenchmarkMetrics;
}

export function rollingBenchmarkComparisonFor(
  nav: NavPoint[],
  benchmarkNav: NavPoint[],
  timeframeYears = 3,
): RollingBenchmarkComparison | null {
  const result = rollingHitRate(nav, benchmarkNav, timeframeYears);
  if (!result) return null;
  return { timeframeYears, hitRate: result.hitRate, windowCount: result.windowCount };
}
