import { describe, expect, it } from "vitest";
import {
  financialStatus,
  toAllocationDisplay,
  toFundFactsDisplay,
  toPercentagePointsText,
} from "@/lib/research-display/fund-research";
import type { FundResearch } from "@/lib/fund-types";

describe("fund research display mapping", () => {
  it("uses explicit financial statuses", () => {
    expect(financialStatus(0.1)).toBe("gain");
    expect(financialStatus(-0.1)).toBe("loss");
    expect(financialStatus(null)).toBe("neutral");
  });

  it("formats missing facts without exposing raw values", () => {
    const fund = {
      facts: {
        aum: null,
        expenseRatio: null,
        portfolioTurnover: null,
        benchmark: null,
        riskLabel: null,
        managers: [],
      },
    } as unknown as FundResearch;
    expect(toFundFactsDisplay(fund).slice(0, 3)).toEqual([
      { label: "AUM", valueText: "—", numeric: true },
      { label: "Expense ratio", valueText: "—", numeric: true },
      { label: "Portfolio turnover", valueText: "—", numeric: true },
    ]);
  });

  it("sorts allocation displays and keeps percentage-point conversion explicit", () => {
    expect(
      toAllocationDisplay([
        { name: "Small", weight: 0.1 },
        { name: "Large", weight: 0.6 },
      ]).map((item) => item.name),
    ).toEqual(["Large", "Small"]);
    expect(toPercentagePointsText(42.5)).toBe("42.5%");
  });
});
