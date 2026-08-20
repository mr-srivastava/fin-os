import type { FundResearch, WeightedItem } from "@/lib/fund.types";
import { toFundResearchView } from "./fund";
import { performanceRanges } from "./performance";
import type { ComparisonView } from "./types";

function joined(left: readonly WeightedItem[], right: readonly WeightedItem[]) {
  const leftByName = new Map(left.map((item) => [item.name, item.weight]));
  const rightByName = new Map(right.map((item) => [item.name, item.weight]));
  return [...new Set([...leftByName.keys(), ...rightByName.keys()])].map((name) => ({
    name,
    weights: [leftByName.get(name) ?? null, rightByName.get(name) ?? null] as [
      number | null,
      number | null,
    ],
  }));
}

function toSelection(
  result: PromiseSettledResult<FundResearch | null>,
  schemeCode: string,
): ComparisonView["selections"][number] {
  if (result.status === "fulfilled" && result.value) {
    const view = toFundResearchView(result.value);
    return { status: "ready", scheme: view.scheme, currentNav: view.currentNav };
  }
  const message =
    result.status === "rejected" && result.reason instanceof Error
      ? result.reason.message
      : "This fund is not available for research.";
  return { status: "unavailable", schemeCode, message };
}

export function toComparisonView(
  schemeCodes: readonly [string, string],
  results: readonly [
    PromiseSettledResult<FundResearch | null>,
    PromiseSettledResult<FundResearch | null>,
  ],
): ComparisonView {
  const selections: ComparisonView["selections"] = [
    toSelection(results[0], schemeCodes[0]),
    toSelection(results[1], schemeCodes[1]),
  ];
  if (selections.some((selection) => selection.status !== "ready")) {
    return {
      selections,
      comparison: { status: "unavailable", message: "Both funds must be available to compare." },
    };
  }
  const funds = results.map((result) => (result.status === "fulfilled" ? result.value : null)) as [
    FundResearch | null,
    FundResearch | null,
  ];
  if (!funds[0] || !funds[1])
    return {
      selections,
      comparison: { status: "unavailable", message: "Both funds must be available to compare." },
    };
  const pair = funds as [FundResearch, FundResearch];
  const unavailableNav = pair
    .filter((fund) => !fund.availability.navHistory.available)
    .map((fund) => fund.scheme.schemeName);
  const ranges = performanceRanges(
    pair.map((fund) => ({ name: fund.scheme.schemeName, points: fund.nav })),
  );
  const leftPortfolio = pair[0].portfolio;
  const rightPortfolio = pair[1].portfolio;
  const portfolio =
    leftPortfolio && rightPortfolio
      ? {
          status: "ready" as const,
          data: {
            reportDates: [leftPortfolio.asOf, rightPortfolio.asOf] as [
              string | null,
              string | null,
            ],
            sectorAllocation: joined(leftPortfolio.sectors, rightPortfolio.sectors),
            assetAllocation: joined(leftPortfolio.assetAllocation, rightPortfolio.assetAllocation),
            marketCapAllocation: joined(
              leftPortfolio.marketCapAllocation,
              rightPortfolio.marketCapAllocation,
            ),
            concentration: [
              leftPortfolio.topTenConcentration,
              rightPortfolio.topTenConcentration,
            ] as [number | null, number | null],
          },
        }
      : {
          status: "unavailable" as const,
          message:
            "A reported portfolio is not available for both funds, so portfolio comparison cannot be shown.",
        };
  const metricIds = ["volatility", "maxDrawdown"] as const;
  return {
    selections,
    comparison: {
      status: "ready",
      data: {
        fundNames: [pair[0].scheme.schemeName, pair[1].scheme.schemeName],
        performance: unavailableNav.length
          ? {
              status: "unavailable",
              message: `Historical NAV data is unavailable for ${unavailableNav.join(" and ")}, so performance comparison cannot be shown.`,
            }
          : { status: "ready", data: ranges },
        metrics: unavailableNav.length
          ? {
              status: "unavailable",
              message: `Historical NAV data is unavailable for ${unavailableNav.join(" and ")}, so risk measures cannot be compared.`,
            }
          : {
              status: "ready",
              data: metricIds.map((id) => ({
                id,
                values: pair.map((fund) => ({
                  value: fund.metrics[id].value,
                  tone: "neutral" as const,
                })),
              })),
            },
        facts: (["aum", "expenseRatio", "portfolioTurnover", "riskLabel"] as const).map((id) => ({
          id,
          values: pair.map((fund) => fund.facts[id]),
        })),
        portfolio,
      },
    },
  };
}
