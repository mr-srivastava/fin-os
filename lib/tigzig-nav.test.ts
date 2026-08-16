import { assert, expect, test } from "vitest";
import { ProviderError } from "./provider.ts";
import {
  getTigzigMarketSeries,
  getTigzigNav,
  normalizeTigzigMarketSeriesPayload,
  normalizeTigzigNavPayload,
} from "./tigzig-nav.ts";

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
