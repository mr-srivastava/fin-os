import { describe, expect, it } from "vitest";
import {
  financialStatus,
  toAllocationDisplay,
  toCurrentNavDisplay,
  toFundFactsDisplay,
  toFundMetricGroups,
  toPercentagePointsText,
  toPortfolioDisplay,
} from "@/lib/research-display/fundResearch";
import { fundResearchFixture } from "@/test/fixtures/fundResearchView";

describe("fund research display mapping", () => {
  it("uses explicit financial statuses", () => {
    expect(financialStatus(0.1)).toBe("gain");
    expect(financialStatus(-0.1)).toBe("loss");
    expect(financialStatus(null)).toBe("neutral");
  });

  it("formats missing facts without exposing raw values", () => {
    const fund = fundResearchFixture({
      facts: {
        aum: null,
        expenseRatio: null,
        portfolioTurnover: null,
        benchmark: null,
        riskLabel: null,
        managers: [],
      },
    });
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

  it("maps metric semantics and portfolio data before rendering", () => {
    const fund = fundResearchFixture({
      metrics: {
        oneYear: { value: 0.12, label: "1Y" },
        threeYear: { value: -0.02, label: "3Y" },
        fiveYear: { value: null, label: "5Y" },
        volatility: { value: 0.1, label: "Volatility" },
        maxDrawdown: { value: -0.2, label: "Max drawdown" },
      },
      portfolio: {
        asOf: "2025-01-01",
        holdings: [{ name: "Company", weight: 0.2, sector: "Technology" }],
        sectors: [],
        assetAllocation: [],
        marketCapAllocation: [],
        topTenConcentration: 42.5,
      },
    });
    expect(toFundMetricGroups(fund)[0]?.metrics.map((metric) => metric.status)).toEqual([
      "gain",
      "loss",
      "neutral",
    ]);
    expect(toPortfolioDisplay(fund)).toMatchObject({
      concentrationText: "42.5%",
      sectors: [{ name: "Technology", weightText: "20%" }],
    });
  });

  it("keeps latest NAV independent of NAV-history availability", () => {
    const fund = fundResearchFixture({ currentNav: { nav: 123.45, date: "2025-01-01" } });
    expect(toCurrentNavDisplay(fund)).toEqual({ valueText: "₹123.45", dateText: "1 Jan 2025" });
  });
});
