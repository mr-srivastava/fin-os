import { expect, test } from "vitest";
import { getFinapiTri, normalizeFinapiTriPayload } from "./finapi-index.ts";
import { ProviderError } from "./provider.ts";

const payload = {
  data: [
    { priceDate: "2026-08-14", closePrice: 100, triValue: 160 },
    { priceDate: "2026-08-13", closePrice: 99, triValue: 159 },
  ],
};

test("normalizes FinAPI TRI rows in ascending order and ignores price values", () => {
  expect(normalizeFinapiTriPayload(payload)).toEqual([
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
    return new Response(JSON.stringify(payload), { status: 200 });
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
