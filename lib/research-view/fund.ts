import type { FundResearch, WeightedItem } from "@/lib/fund.types";
import { performanceRanges } from "./performance";
import type { FundResearchView } from "@/lib/fund.schema";

function allocation(items: readonly WeightedItem[]) {
  return [...items]
    .sort((a, b) => b.weight - a.weight)
    .map(({ name, weight }) => ({ name, weight }));
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
  const ranges = performanceRanges([
    { name: "This fund", points: fund.nav },
    ...(fund.benchmark ? [{ name: fund.benchmark.name, points: fund.benchmark.nav }] : []),
  ]);
  return {
    scheme: fund.scheme,
    currentNav: fund.currentNav,
    benchmark: fund.benchmark
      ? { name: fund.benchmark.name, returnBasis: fund.benchmark.returnBasis }
      : null,
    performance: fund.availability.navHistory.available
      ? { status: "ready", data: ranges }
      : { status: "unavailable", message: fund.availability.navHistory.reason },
    metricGroups: [
      {
        id: "risk",
        metrics: ["volatility", "maxDrawdown"].map((id) => ({
          id,
          value: fund.metrics[id as keyof typeof fund.metrics].value,
          tone: "neutral" as const,
        })),
      },
    ],
    returnConsistency: fund.returnConsistency,
    relatedFunds: fund.relatedFunds,
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
