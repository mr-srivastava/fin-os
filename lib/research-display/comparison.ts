import type { FundPair, FundResearch } from "@/lib/fund.types";
import { formatPercent } from "@/lib/utils";
import { toFundFactsDisplay, toMetricDisplay } from "./fundResearch";
import type { MetricDisplay } from "./types";

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
