import { describe, expect, it } from "vitest";
import {
  toComparisonAllocationDisplay,
  toComparisonFactsDisplay,
  toComparisonMetricDisplay,
} from "@/lib/research-display/comparison";
import type { FundPair, FundResearch } from "@/lib/fund-types";

describe("comparison display mapping", () => {
  it("represents missing allocation values as display text", () => {
    expect(
      toComparisonAllocationDisplay(
        [{ name: "Equity", weight: 0.8 }],
        [{ name: "Debt", weight: 0.2 }],
      ),
    ).toEqual([
      { name: "Equity", leftText: "80%", rightText: "—" },
      { name: "Debt", leftText: "—", rightText: "20%" },
    ]);
  });

  it("reuses fact formatting and keeps risk metric tones neutral", () => {
    const fund = {
      scheme: { schemeName: "Fund" },
      facts: {
        aum: 1234.56,
        expenseRatio: 1.23,
        portfolioTurnover: 12.34,
        riskLabel: "High",
        managers: [],
      },
      metrics: {
        oneYear: { value: 0.1 },
        threeYear: { value: 0.1 },
        fiveYear: { value: 0.1 },
        volatility: { value: 0.2 },
        maxDrawdown: { value: -0.3 },
      },
    } as unknown as FundResearch;
    const pair = [fund, fund] as const satisfies FundPair<FundResearch>;
    expect(toComparisonFactsDisplay(pair)[0]?.values).toEqual(["₹1,234.56 Cr", "₹1,234.56 Cr"]);
    expect(
      toComparisonMetricDisplay(pair)
        .slice(-2)
        .flatMap((row) => row.values.map((value) => value.status)),
    ).toEqual(["neutral", "neutral", "neutral", "neutral"]);
  });
});
