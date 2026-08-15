import {
  filterSeriesByRange,
  investmentOutcome,
  relativeReturnSeries,
  type PerformanceRange,
} from "@/lib/analytics";
import type { FundResearch, WeightedItem } from "@/lib/fund-types";
import { PERFORMANCE_RANGES } from "@/lib/research-route-state";
import {
  formatFullDate,
  formatNumber,
  formatPercent,
  formatRupees,
  formatSignedPercent,
} from "@/lib/utils";
import type {
  ChartSeriesDisplay,
  AllocationDisplay,
  DisplayStatus,
  FactDisplay,
  FundHeaderDisplay,
  OutcomeDisplay,
  PerformanceDisplay,
} from "./types";

export function financialStatus(value: number | null): DisplayStatus {
  if (value === null || value === 0) return "neutral";
  return value > 0 ? "gain" : "loss";
}

const allocationColors = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

export function toAllocationDisplay(items: readonly WeightedItem[]): readonly AllocationDisplay[] {
  return [...items]
    .sort((left, right) => right.weight - left.weight)
    .map((item, index) => ({
      name: item.name,
      weight: item.weight,
      weightText: formatSignedPercent(item.weight).replace("+", ""),
      color: allocationColors[index % allocationColors.length] ?? "var(--chart-1)",
    }));
}

export function toPercentagePointsText(value: number): string {
  return formatPercent(value / 100);
}

export function toFundHeaderDisplay(fund: FundResearch): FundHeaderDisplay {
  return {
    title: fund.scheme.schemeName,
    subtitle: `${fund.scheme.amc} · ${fund.scheme.category} · ${fund.scheme.plan} ${fund.scheme.option}`,
  };
}

function toOutcome(
  name: string,
  color: OutcomeDisplay["color"],
  points: FundResearch["nav"],
): OutcomeDisplay {
  const outcome = investmentOutcome(points);
  return {
    name,
    color,
    returnText: outcome ? formatSignedPercent(outcome.returnPercent) : "—",
    valueText: outcome ? formatRupees(outcome.value) : "—",
    status: financialStatus(outcome?.returnPercent ?? null),
  };
}

export function toPerformanceDisplay(
  fund: FundResearch,
  range: PerformanceRange,
  showBenchmark: boolean,
): PerformanceDisplay {
  const selectedFundPoints = filterSeriesByRange(fund.nav, range);
  const series: ChartSeriesDisplay[] = [
    { name: "This fund", color: "chart-1", points: relativeReturnSeries(selectedFundPoints) },
  ];
  const outcomes = [toOutcome("This fund", "fund", selectedFundPoints)];
  if (showBenchmark && fund.benchmark) {
    const points = filterSeriesByRange(fund.benchmark.nav, range);
    series.push({
      name: fund.benchmark.name,
      color: "chart-3",
      points: relativeReturnSeries(points),
    });
    outcomes.push(toOutcome(fund.benchmark.name, "benchmark", points));
  }
  return {
    range,
    periodLabel: PERFORMANCE_RANGES.find((item) => item.value === range)?.label ?? range,
    latestNavText: formatRupees(fund.currentNav?.nav ?? null),
    latestNavDateText: fund.currentNav?.date ? formatFullDate(fund.currentNav.date) : "—",
    outcomes,
    series,
  };
}

export function toFundFactsDisplay(fund: FundResearch): readonly FactDisplay[] {
  const facts = fund.facts;
  return [
    {
      label: "AUM",
      valueText: facts.aum === null ? "—" : `₹${formatNumber(facts.aum)} Cr`,
      numeric: true,
    },
    {
      label: "Expense ratio",
      valueText: facts.expenseRatio === null ? "—" : `${formatNumber(facts.expenseRatio)}%`,
      numeric: true,
    },
    {
      label: "Portfolio turnover",
      valueText:
        facts.portfolioTurnover === null ? "—" : `${formatNumber(facts.portfolioTurnover)}%`,
      numeric: true,
    },
    ...(facts.benchmark ? [{ label: "Benchmark", valueText: facts.benchmark }] : []),
    ...(facts.riskLabel ? [{ label: "Risk", valueText: facts.riskLabel }] : []),
    ...(facts.managers.length
      ? [{ label: "Fund managers", valueText: facts.managers.join(", ") }]
      : []),
  ];
}
