import {
  drawdownVsHistory,
  volatilityVsHistory,
  type HistoricalComparison,
} from "@/lib/shared/analytics";
import type { FundResearch, MetricKey, WeightedItem } from "@/lib/fund/fund.types";
import {
  formatFullDate,
  formatNumber,
  formatPercent,
  formatRupees,
  formatSignedPercent,
} from "@/lib/shared/utils";
import type {
  AllocationDisplay,
  DisplayStatus,
  FactDisplay,
  CurrentNavDisplay,
  MetricGroupDisplay,
  PortfolioDisplay,
  SectorDisplay,
} from "./types";

export function financialStatus(value: number | null): DisplayStatus {
  if (value === null || value === 0) return "neutral";
  return value > 0 ? "gain" : "loss";
}

export const allocationColors = [
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

export function toCurrentNavDisplay(fund: FundResearch): CurrentNavDisplay {
  return {
    valueText: formatRupees(fund.currentNav?.nav ?? null),
    dateText: fund.currentNav?.date ? formatFullDate(fund.currentNav.date) : "—",
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

const metricDisplayOptions = {
  oneYear: { signed: true, status: "financial" },
  threeYear: { signed: true, status: "financial" },
  fiveYear: { signed: true, status: "financial" },
  volatility: { signed: false, status: "neutral" },
  maxDrawdown: { signed: true, status: "neutral" },
} satisfies Record<MetricKey, { signed: boolean; status: "financial" | "neutral" }>;

function historicalContextText(comparison: HistoricalComparison | null): string | undefined {
  if (!comparison) return undefined;
  switch (comparison.direction) {
    case "above":
      return "above this fund's own history";
    case "below":
      return "below this fund's own history";
    case "near":
      return "in line with this fund's own history";
  }
}

export function toMetricDisplay(
  fund: FundResearch,
  key: MetricKey,
  label: string,
): MetricGroupDisplay["metrics"][number] {
  const value = fund.metrics[key].value;
  const options = metricDisplayOptions[key];
  const context =
    key === "volatility"
      ? historicalContextText(volatilityVsHistory(fund.nav))
      : key === "maxDrawdown"
        ? historicalContextText(drawdownVsHistory(fund.nav))
        : undefined;
  const metric: MetricGroupDisplay["metrics"][number] = {
    label,
    valueText: options.signed ? formatSignedPercent(value) : formatPercent(value),
    status: options.status === "financial" ? financialStatus(value) : "neutral",
  };
  if (context) metric.context = context;
  return metric;
}

export function toFundMetricGroups(fund: FundResearch): readonly MetricGroupDisplay[] {
  return [
    {
      title: "Annualised returns",
      metrics: [
        toMetricDisplay(fund, "oneYear", "1Y return"),
        toMetricDisplay(fund, "threeYear", "3Y annualised"),
        toMetricDisplay(fund, "fiveYear", "5Y annualised"),
      ],
    },
    {
      title: "Risk",
      metrics: [
        toMetricDisplay(fund, "volatility", "Volatility"),
        toMetricDisplay(fund, "maxDrawdown", "Max drawdown"),
      ],
    },
  ];
}

export function toPortfolioDisplay(fund: FundResearch): PortfolioDisplay | null {
  const portfolio = fund.portfolio;
  if (!portfolio) return null;
  const holdingsBySector = new Map<string, typeof portfolio.holdings>();
  for (const holding of portfolio.holdings) {
    const name = holding.sector?.trim() || "Unclassified";
    holdingsBySector.set(name, [...(holdingsBySector.get(name) ?? []), holding]);
  }
  const known = new Set(portfolio.sectors.map((sector) => sector.name));
  const sectorWeights = [
    ...portfolio.sectors,
    ...[...holdingsBySector.entries()]
      .filter(([name]) => !known.has(name))
      .map(([name, holdings]) => ({
        name,
        weight: holdings.reduce((total, holding) => total + holding.weight, 0),
      })),
  ];
  const sectors: SectorDisplay[] = sectorWeights.map((sector) => ({
    name: sector.name,
    weightText: formatPercent(sector.weight),
    holdings: (holdingsBySector.get(sector.name) ?? []).map((holding) => ({
      name: holding.name,
      weight: holding.weight,
      weightText: formatPercent(holding.weight),
    })),
  }));
  return {
    reportDateText: portfolio.asOf
      ? `Portfolio as of ${formatFullDate(portfolio.asOf)}`
      : "Portfolio report date unavailable.",
    sectors,
    assetAllocation: toAllocationDisplay(portfolio.assetAllocation),
    marketCapAllocation: toAllocationDisplay(portfolio.marketCapAllocation),
    concentrationText:
      portfolio.topTenConcentration === null
        ? null
        : toPercentagePointsText(portfolio.topTenConcentration),
  };
}
