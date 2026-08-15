import { expect, test } from "vitest";
import { toFundResearchView } from "./fund";
import type { FundResearch } from "@/lib/fund-types";

test("precomputes every range and synthesizes sectors from holdings", () => {
  const fund = {
    scheme: {
      schemeCode: "1234",
      schemeName: "Example",
      amc: "AMC",
      category: "Flexi Cap",
      plan: "Direct",
      option: "Growth",
    },
    nav: [
      { date: "2025-01-01", nav: 100 },
      { date: "2026-01-01", nav: 120 },
    ],
    benchmark: null,
    currentNav: { date: "2026-01-01", nav: 120 },
    facts: {
      aum: null,
      expenseRatio: null,
      portfolioTurnover: null,
      benchmark: null,
      riskLabel: null,
      managers: [],
    },
    portfolio: {
      asOf: null,
      holdings: [{ name: "Company", sector: "Technology", weight: 0.2 }],
      sectors: [],
      assetAllocation: [],
      marketCapAllocation: [],
      topTenConcentration: null,
    },
    availability: {
      navHistory: { available: true, source: "TigZig" },
      facts: { available: true },
      portfolio: { available: true },
    },
    metrics: {
      oneYear: { label: "", value: 0.2 },
      threeYear: { label: "", value: null },
      fiveYear: { label: "", value: null },
      volatility: { label: "", value: null },
      maxDrawdown: { label: "", value: null },
    },
  } satisfies FundResearch;
  const view = toFundResearchView(fund);
  expect(view.performance.status).toBe("ready");
  if (view.performance.status === "ready")
    expect(Object.keys(view.performance.data)).toEqual(["6m", "1y", "3y", "5y", "max"]);
  expect(view.portfolio).toMatchObject({
    status: "ready",
    data: { sectors: [{ name: "Technology", weight: 0.2 }] },
  });
});
