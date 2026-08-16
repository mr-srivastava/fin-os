import {
  filterSeriesByRange,
  investmentOutcome,
  relativeReturnSeries,
  type PerformanceRange,
} from "@/lib/analytics";
import type { FundPair, FundResearch } from "@/lib/fund-types";
import { formatFullDate, formatPercent, formatRupees, formatSignedPercent } from "@/lib/utils";
import { financialStatus, toFundFactsDisplay, toMetricDisplay } from "./fund-research";
import type { ChartSeriesDisplay, MetricDisplay, OutcomeDisplay } from "./types";

export function toComparisonPerformanceDisplay(
  funds: FundPair<FundResearch>,
  range: PerformanceRange,
) {
  const series: ChartSeriesDisplay[] = funds.map((fund, index) => ({
    name: fund.scheme.schemeName,
    color: index === 0 ? "foreground" : "chart-3",
    points: relativeReturnSeries(filterSeriesByRange(fund.nav, range)),
  }));
  const outcomes: OutcomeDisplay[] = funds.map((fund, index) => {
    const outcome = investmentOutcome(filterSeriesByRange(fund.nav, range));
    return {
      name: fund.scheme.schemeName,
      color: index === 0 ? "comparison-a" : "comparison-b",
      returnText: outcome ? formatSignedPercent(outcome.returnPercent) : "—",
      valueText: outcome ? formatRupees(outcome.value) : "—",
      status: financialStatus(outcome?.returnPercent ?? null),
    };
  });
  return { series, outcomes };
}

export function toComparisonMetricDisplay(
  funds: FundPair<FundResearch>,
): readonly { label: string; values: readonly MetricDisplay[] }[] {
  const rows = [
    ["1Y volatility", "volatility"],
    ["Max drawdown", "maxDrawdown"],
  ] as const;
  return rows.map(([label, key]) => ({
    label,
    values: funds.map((fund) => {
      const metric = toMetricDisplay(fund, key, label);
      return {
        label: fund.scheme.schemeName,
        valueText: metric.valueText,
        status: metric.status,
      };
    }),
  }));
}

export function toComparisonFactsDisplay(funds: FundPair<FundResearch>) {
  const labels = ["AUM", "Expense ratio", "Portfolio turnover", "Risk"] as const;
  const factsByFund = funds.map(
    (fund) => new Map(toFundFactsDisplay(fund).map((fact) => [fact.label, fact.valueText])),
  );
  return labels.map((label) => ({
    label,
    values: factsByFund.map((facts) => facts.get(label) ?? "—"),
  }));
}

export function toComparisonAllocationDisplay(
  left: readonly { name: string; weight: number }[],
  right: readonly { name: string; weight: number }[],
) {
  const leftByName = new Map(left.map((item) => [item.name, item.weight]));
  const rightByName = new Map(right.map((item) => [item.name, item.weight]));
  return [...new Set([...leftByName.keys(), ...rightByName.keys()])].map((name) => ({
    name,
    leftText: formatPercent(leftByName.get(name) ?? null),
    rightText: formatPercent(rightByName.get(name) ?? null),
  }));
}

export function toComparisonPortfolioReportDate(funds: FundPair<FundResearch>): string {
  const [left, right] = funds;
  return left.portfolio?.asOf && right.portfolio?.asOf
    ? `Reported as of ${formatFullDate(left.portfolio.asOf)} and ${formatFullDate(right.portfolio.asOf)}.`
    : "Portfolio report date unavailable for one or both funds.";
}
