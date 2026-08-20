import { annualizedReturn, annualizedVolatility, maxDrawdown } from "../shared/analytics";
import { METRIC_KEYS, type FundMetrics, type MetricKey, type NavPoint } from "./fund.types";

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
