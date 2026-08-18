import { assert, expect, test } from "vitest";
import {
  getFinapiTri,
  getFundResearch,
  getFundResearchBatch,
  normalizeFinapiTriPayload,
  normalizeFundPayload,
} from "./finapi-service.ts";
import { metricsFor, unavailableMetrics } from "./fund-metrics.ts";
import { ProviderError, toNav } from "./provider.ts";
import { METRIC_KEYS } from "./fund-types.ts";

const payload = {
  status: "success",
  data: {
    schemeCode: "122639",
    schemeName: "Parag Parikh Flexi Cap Fund - Direct Plan - Growth",
    fundHouse: "PPFAS Mutual Fund",
    schemeCategory: "Flexi Cap",
    planName: "Direct Plan",
    optionName: "Growth",
    latestNav: 91.6834,
    latestNavDate: "2026-08-14",
    aum: "148,429.00",
    expenseRatio: "0.53",
    portfolioTurnover: "18.81",
    benchmarkIndex: "Nifty 500 TR INR",
    schemeRisk: "Very High Risk",
    schemeFundManagers: "Raj Mehta, Rajeev Thakkar",
    rollingReturns: [
      {
        timeframe: "3Y",
        averageReturn: 12,
        medianReturn: 11,
        minReturn: -2,
        maxReturn: 22,
        positiveRatio: 88,
        negativeRatio: 12,
        consistencyScore: 44,
      },
    ],
    peers: [
      {
        schemeCode: "122640",
        schemeName: "Example Flexi Cap Direct Growth",
        schemeCategory: "Flexi Cap",
      },
    ],
    navHistory: [
      { date: "2025-08-13", nav: "89.00" },
      { date: "2026-08-14", nav: "91.6834" },
    ],
    holdings: [
      { name: "HDFC Bank Ltd", sector: "Financial Services", weightage: "8.33", change1M: "0.00" },
    ],
    portfolio: {
      assetAllocation: {
        equityAllocation: "97.84",
        debtAllocation: "0.00",
        cashAllocation: "2.16",
        otherAllocation: "0.00",
      },
      marketCapWeightage: { largeCap: "71.1", midCap: "21", smallCap: "3.56", others: "4.34" },
      concentration: { top10StocksWeight: "38.80" },
    },
  },
};

const tigzigPayload = {
  scheme_code: "122639",
  data: [
    { date: "2021-08-14", nav: "45.00" },
    { date: "2025-08-13", nav: "89.00" },
    { date: "2026-08-14", nav: "91.70" },
  ],
};

test("normalizes FinAPI numeric strings and marks an undated portfolio as provider-supplied", () => {
  const fund = normalizeFundPayload(payload);
  assert.ok(fund);
  assert.equal(fund.facts.aum, 148429);
  assert.equal(fund.facts.expenseRatio, 0.53);
  assert.equal(fund.currentNav?.nav, 91.6834);
  assert.ok(fund.portfolio);
  assert.equal(fund.portfolio.asOf, null);
  assert.equal(fund.availability.portfolio.available, true);
  assert.equal(fund.returnConsistency?.averageReturn, 12);
  assert.deepEqual(
    fund.relatedFunds.peers.map((fund) => fund.schemeCode),
    ["122640"],
  );
});

test("accepts a dated portfolio snapshot and ignores provider change fields", () => {
  const fund = normalizeFundPayload({
    ...payload,
    data: { ...payload.data, portfolioAsOfDate: "2026-07-31" },
  });
  assert.ok(fund?.portfolio);
  assert.equal(fund.portfolio.asOf, "2026-07-31");
  assert.deepEqual(fund.portfolio.holdings, [
    { name: "HDFC Bank Ltd", sector: "Financial Services", weight: 0.0833 },
  ]);
  assert.deepEqual(fund.portfolio.assetAllocation, [
    { name: "Equity", weight: 0.9784 },
    { name: "Debt", weight: 0 },
    { name: "Cash", weight: 0.0216 },
    { name: "Other", weight: 0 },
  ]);
  assert.equal(fund.portfolio.topTenConcentration, 38.8);
});

test("rejects schemes outside the Direct Growth target universe", () => {
  const fund = normalizeFundPayload({
    ...payload,
    data: { ...payload.data, planName: "Regular Plan" },
  });
  assert.equal(fund, null);
});

test("normalizes valid NAV points only", () => {
  assert.deepEqual(
    toNav([
      { date: "2026-08-14", nav: "91.68" },
      { date: "invalid", nav: "92" },
      { date: "2026-08-15", nav: "0" },
    ]),
    [{ date: "2026-08-14", nav: 91.68 }],
  );
});

test("constructs complete available and unavailable metric sets", () => {
  const nav = [
    { date: "2021-01-01", nav: 100 },
    { date: "2026-01-01", nav: 150 },
  ];
  const available = metricsFor(nav);
  const unavailable = unavailableMetrics();
  expect(Object.keys(available)).toEqual(METRIC_KEYS);
  expect(Object.keys(unavailable)).toEqual(METRIC_KEYS);
  for (const key of METRIC_KEYS) assert.equal(unavailable[key].value, null);
});

test("uses TigZig NAV without calling FinAPI's historical NAV endpoint", async () => {
  const originalFetch = globalThis.fetch;
  const requests: string[] = [];
  globalThis.fetch = (async (input: string | URL | Request) => {
    const url = String(input);
    requests.push(url);
    const body = url.includes("api.tigzig.com")
      ? tigzigPayload
      : url.includes("nifty-indices")
        ? {
            data: [
              { priceDate: "2026-08-13", triValue: 30000 },
              { priceDate: "2026-08-14", triValue: 30100 },
            ],
          }
        : payload;
    return new Response(JSON.stringify(body), {
      status: 200,
    });
  }) as typeof fetch;
  try {
    const fund = await getFundResearch("122639");
    assert.ok(fund);
    assert.equal(fund.currentNav?.nav, 91.7);
    assert.equal(fund.currentNav?.date, "2026-08-14");
    assert.equal(fund.availability.navHistory.source, "TigZig");
    assert.notEqual(fund.metrics.fiveYear.value, null);
    assert.equal(fund.benchmark?.name, "Nifty 500 TRI");
    assert.equal(fund.facts.benchmark, "Nifty 500 TR INR");
    assert.equal(
      requests.some((url) => url.includes("finapi.upvaly.com") && url.includes("/nav?")),
      false,
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("keeps FinAPI research available when TigZig NAV fails", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async (input: string | URL | Request) => {
    if (String(input).includes("api.tigzig.com")) throw new Error("upstream timeout");
    return new Response(JSON.stringify(payload), { status: 200 });
  }) as typeof fetch;
  try {
    const fund = await getFundResearch("122639");
    assert.ok(fund);
    assert.equal(fund.currentNav, null);
    assert.equal(fund.availability.navHistory.available, false);
    assert.equal(fund.availability.navHistory.source, null);
    assert.equal(fund.metrics.fiveYear.value, null);
    assert.equal(fund.facts.aum, 148429);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("keeps TigZig-only data from creating a research page when FinAPI fails", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async (input: string | URL | Request) => {
    if (String(input).includes("api.tigzig.com"))
      return new Response(JSON.stringify(tigzigPayload), { status: 200 });
    return new Response("service unavailable", { status: 503 });
  }) as typeof fetch;
  try {
    await expect(getFundResearch("122639")).rejects.toBeInstanceOf(ProviderError);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("deduplicates a verified benchmark request for a comparison batch", async () => {
  const originalFetch = globalThis.fetch;
  const requests: string[] = [];
  globalThis.fetch = (async (input: string | URL | Request) => {
    const url = String(input);
    requests.push(url);
    const body = url.includes("api.tigzig.com")
      ? tigzigPayload
      : url.includes("nifty-indices")
        ? {
            data: [
              { priceDate: "2026-08-13", triValue: 30000 },
              { priceDate: "2026-08-14", triValue: 30100 },
            ],
          }
        : payload;
    return new Response(JSON.stringify(body), {
      status: 200,
    });
  }) as typeof fetch;
  try {
    const results = await getFundResearchBatch(["122639", "122640"]);
    expect(results.every((result) => result.status === "fulfilled")).toBe(true);
    expect(requests.filter((url) => url.includes("nifty-indices")).length).toBe(1);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("normalizes FinAPI TRI rows in ascending order and ignores price values", () => {
  expect(
    normalizeFinapiTriPayload({
      data: [
        { priceDate: "2026-08-14", closePrice: 100, triValue: 160 },
        { priceDate: "2026-08-13", closePrice: 99, triValue: 159 },
      ],
    }),
  ).toEqual([
    { date: "2026-08-13", nav: 159 },
    { date: "2026-08-14", nav: 160 },
  ]);
  expect(
    normalizeFinapiTriPayload({ data: [{ priceDate: "2026-08-14", closePrice: 100 }] }),
  ).toEqual([]);
});

test("requests a dynamic Nifty index and maps provider failures", async () => {
  const originalFetch = globalThis.fetch;
  const requests: string[] = [];
  globalThis.fetch = (async (input: string | URL | Request) => {
    requests.push(String(input));
    return new Response(
      JSON.stringify({
        data: [
          { priceDate: "2026-08-14", closePrice: 100, triValue: 160 },
          { priceDate: "2026-08-13", closePrice: 99, triValue: 159 },
        ],
      }),
      { status: 200 },
    );
  }) as typeof fetch;
  try {
    await expect(getFinapiTri("NIFTY 500")).resolves.toHaveLength(2);
    expect(requests[0]).toContain("nifty-indices?indexName=NIFTY%20500");
  } finally {
    globalThis.fetch = originalFetch;
  }
  globalThis.fetch = (async () => new Response("busy", { status: 429 })) as typeof fetch;
  try {
    await expect(getFinapiTri("NIFTY 500")).rejects.toBeInstanceOf(ProviderError);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
