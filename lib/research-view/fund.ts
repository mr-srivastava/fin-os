import { filterSeriesByRange, investmentOutcome, relativeReturnSeries } from "@/lib/analytics";
import type { FundResearch, WeightedItem } from "@/lib/fund-types";
import { PERFORMANCE_RANGES } from "@/lib/research-route-state";
import type { FundResearchView, PerformanceRangeView, Tone } from "./types";

function tone(value: number | null): Tone {
  return value === null || value === 0 ? "neutral" : value > 0 ? "gain" : "loss";
}

function allocation(items: readonly WeightedItem[]) {
  return [...items]
    .sort((a, b) => b.weight - a.weight)
    .map(({ name, weight }) => ({ name, weight }));
}

function rangeView(
  fund: FundResearch,
  range: (typeof PERFORMANCE_RANGES)[number]["value"],
): PerformanceRangeView {
  const fundPoints = filterSeriesByRange(fund.nav, range);
  const sources = [{ name: "This fund", points: fundPoints }].concat(
    fund.benchmark
      ? [{ name: fund.benchmark.name, points: filterSeriesByRange(fund.benchmark.nav, range) }]
      : [],
  );
  return {
    label: PERFORMANCE_RANGES.find((item) => item.value === range)?.label ?? range,
    series: sources.map((source) => ({
      name: source.name,
      points: relativeReturnSeries(source.points),
    })),
    outcomes: sources.map((source) => {
      const outcome = investmentOutcome(source.points);
      return {
        name: source.name,
        returnPercent: outcome?.returnPercent ?? null,
        endingValue: outcome?.value ?? null,
        tone: tone(outcome?.returnPercent ?? null),
      };
    }),
  };
}

export function toFundResearchView(fund: FundResearch): FundResearchView {
  const holdings = new Map<string, NonNullable<FundResearch["portfolio"]>["holdings"]>();
  if (fund.portfolio)
    for (const item of fund.portfolio.holdings) {
      const sector = item.sector?.trim() || "Unclassified";
      holdings.set(sector, [...(holdings.get(sector) ?? []), item]);
    }
  const portfolio = fund.portfolio;
  const known = new Set(portfolio?.sectors.map((item) => item.name) ?? []);
  const sectors = portfolio
    ? [
        ...portfolio.sectors,
        ...[...holdings.entries()]
          .filter(([name]) => !known.has(name))
          .map(([name, items]) => ({
            name,
            weight: items.reduce((sum, item) => sum + item.weight, 0),
          })),
      ].map((sector) => ({
        name: sector.name,
        weight: sector.weight,
        holdings: (holdings.get(sector.name) ?? []).map(({ name, weight }) => ({ name, weight })),
      }))
    : [];
  const ranges = Object.fromEntries(
    PERFORMANCE_RANGES.map(({ value }) => [value, rangeView(fund, value)]),
  ) as FundResearchView["performance"] extends { data: infer T } ? T : never;
  return {
    scheme: fund.scheme,
    currentNav: fund.currentNav,
    benchmarkName: fund.benchmark?.name ?? null,
    performance: fund.availability.navHistory.available
      ? { status: "ready", data: ranges }
      : { status: "unavailable", message: fund.availability.navHistory.reason },
    metricGroups: [
      {
        id: "returns",
        metrics: ["oneYear", "threeYear", "fiveYear"].map((id) => ({
          id,
          value: fund.metrics[id as keyof typeof fund.metrics].value,
          tone: tone(fund.metrics[id as keyof typeof fund.metrics].value),
        })),
      },
      {
        id: "risk",
        metrics: ["volatility", "maxDrawdown"].map((id) => ({
          id,
          value: fund.metrics[id as keyof typeof fund.metrics].value,
          tone: "neutral" as const,
        })),
      },
    ],
    facts: fund.facts,
    portfolio: portfolio
      ? {
          status: "ready",
          data: {
            asOf: portfolio.asOf,
            sectors,
            assetAllocation: allocation(portfolio.assetAllocation),
            marketCapAllocation: allocation(portfolio.marketCapAllocation),
            topTenConcentration: portfolio.topTenConcentration,
          },
        }
      : {
          status: "unavailable",
          message: !fund.availability.portfolio.available
            ? fund.availability.portfolio.reason
            : "Portfolio data is unavailable right now.",
        },
  };
}
