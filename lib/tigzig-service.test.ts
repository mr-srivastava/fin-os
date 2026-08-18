import { assert, expect, test } from "vitest";
import { ProviderError } from "./provider.ts";
import {
  fetchTigzigCategoryEntries,
  getTigzigMarketSeries,
  getTigzigNav,
  normalizeTigzigCatalogueRow,
  normalizeTigzigMarketSeriesPayload,
  normalizeTigzigNavPayload,
} from "./tigzig-service.ts";

test("normalizes TigZig's flat single-scheme NAV response", () => {
  assert.deepEqual(
    normalizeTigzigNavPayload({
      scheme_code: "122639",
      data: [
        { date: "2026-08-14", nav: "91.70" },
        { date: "invalid", nav: "92" },
        { date: "2026-08-15", nav: "0" },
      ],
    }),
    [{ date: "2026-08-14", nav: 91.7 }],
  );
});

test("treats a documented empty NAV window as an empty series", () => {
  assert.deepEqual(normalizeTigzigNavPayload({ scheme_code: "122639", data: [] }), []);
  assert.equal(normalizeTigzigNavPayload({ scheme_code: "122639" }), null);
});

test("normalizes a market series using its requested identifier", () => {
  assert.deepEqual(
    normalizeTigzigMarketSeriesPayload(
      {
        data: [
          { date: "2026-08-13", "^VERIFIED_TRI": 21_234.56 },
          { date: "invalid", "^VERIFIED_TRI": 21_300 },
          { date: "2026-08-14", "^VERIFIED_TRI": "21,400" },
        ],
      },
      "^VERIFIED_TRI",
    ),
    [
      { date: "2026-08-13", nav: 21_234.56 },
      { date: "2026-08-14", nav: 21_400 },
    ],
  );
});

test("requests a market series with its verified identifier", async () => {
  const originalFetch = globalThis.fetch;
  let requestedUrl = "";
  let options: RequestInit | undefined;
  globalThis.fetch = (async (input: string | URL | Request, init?: RequestInit) => {
    requestedUrl = String(input);
    options = init;
    return new Response(JSON.stringify({ data: [{ date: "2026-08-14", "^VERIFIED_TRI": 100 }] }));
  }) as typeof fetch;
  try {
    await getTigzigMarketSeries("^VERIFIED_TRI");
    assert.match(
      requestedUrl,
      /^https:\/\/api\.tigzig\.com\/v1\/series\?ids=%5EVERIFIED_TRI&from=\d{4}-\d{2}-\d{2}&format=json$/,
    );
    assert.equal(options?.next?.revalidate, 300);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("requests a bounded five-year window from TigZig", async () => {
  const originalFetch = globalThis.fetch;
  let requestedUrl = "";
  globalThis.fetch = (async (input: string | URL | Request) => {
    requestedUrl = String(input);
    return new Response(JSON.stringify({ data: [{ date: "2026-08-14", nav: 91.7 }] }), {
      status: 200,
    });
  }) as typeof fetch;
  try {
    await getTigzigNav("122639");
    assert.match(
      requestedUrl,
      /^https:\/\/api\.tigzig\.com\/mf\/v1\/nav\?scheme=122639&since=\d{4}-\d{2}-\d{2}$/,
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("represents a TigZig rate limit safely", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async () => new Response("busy", { status: 429 })) as typeof fetch;
  try {
    await expect(getTigzigNav("122639")).rejects.toMatchObject({
      status: 429,
    } satisfies Partial<ProviderError>);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

const catalogueRow = {
  scheme_code: 120564,
  scheme_name: "Aditya Birla Sun Life Flexi Cap Fund - Growth - Direct Plan",
  isin: "INF209K01XX1",
  isin2: null,
  amc: "Aditya Birla Sun Life Mutual Fund",
  group: "Equity Scheme",
  category_sub: "Flexi Cap Fund",
  category: "Equity Scheme - Flexi Cap Fund",
  scheme_type: "Open Ended Schemes",
  plan: "Direct",
  option: "Growth",
  first_date: "2013-01-02",
  last_date: "2026-08-17",
  is_active: true,
  is_stale: false,
  txic_code: "ABOFXDG",
  relevance: 8,
};

test("normalizes an eligible TigZig catalogue row", () => {
  assert.deepEqual(normalizeTigzigCatalogueRow(catalogueRow, "Flexi Cap"), {
    schemeCode: "120564",
    isin: "INF209K01XX1",
    isin2: null,
    schemeName: "Aditya Birla Sun Life Flexi Cap Fund - Growth - Direct Plan",
    amc: "Aditya Birla Sun Life Mutual Fund",
    categorySub: "Flexi Cap Fund",
    category: "Flexi Cap",
    plan: "Direct",
    option: "Growth",
    txicCode: "ABOFXDG",
    liveness: {
      isActive: true,
      isStale: false,
      firstNavDate: "2013-01-02",
      lastNavDate: "2026-08-17",
    },
  });
});

test("rejects a row whose category_sub does not match the requested category exactly", () => {
  assert.equal(
    normalizeTigzigCatalogueRow(
      { ...catalogueRow, category_sub: "Large & Mid Cap Fund" },
      "Mid Cap",
    ),
    null,
  );
});

test("rejects a Regular plan or a non-Growth option", () => {
  assert.equal(
    normalizeTigzigCatalogueRow({ ...catalogueRow, plan: "Regular" }, "Flexi Cap"),
    null,
  );
  assert.equal(normalizeTigzigCatalogueRow({ ...catalogueRow, option: "IDCW" }, "Flexi Cap"), null);
});

test("rejects a row missing a required field", () => {
  assert.equal(
    normalizeTigzigCatalogueRow({ ...catalogueRow, is_active: "true" }, "Flexi Cap"),
    null,
  );
  assert.equal(
    normalizeTigzigCatalogueRow({ ...catalogueRow, scheme_code: "SIF-57" }, "Flexi Cap"),
    null,
  );
});

test("paginates until every reported match is fetched", async () => {
  const originalFetch = globalThis.fetch;
  const requestedUrls: string[] = [];
  globalThis.fetch = (async (input: string | URL | Request) => {
    const url = String(input);
    requestedUrls.push(url);
    const offset = Number(new URL(url).searchParams.get("offset"));
    const results =
      offset === 0
        ? [catalogueRow, { ...catalogueRow, scheme_code: 120565 }]
        : [{ ...catalogueRow, scheme_code: 120566 }];
    return new Response(JSON.stringify({ results, total_matches: 105 }));
  }) as typeof fetch;
  try {
    const entries = await fetchTigzigCategoryEntries("Flexi Cap");
    assert.equal(entries.length, 3);
    assert.deepEqual(
      requestedUrls.map((url) => new URL(url).searchParams.get("offset")),
      ["0", "100"],
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("represents a TigZig catalogue rate limit safely", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async () => new Response("busy", { status: 429 })) as typeof fetch;
  try {
    await expect(fetchTigzigCategoryEntries("Flexi Cap")).rejects.toMatchObject({
      status: 429,
    } satisfies Partial<ProviderError>);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
