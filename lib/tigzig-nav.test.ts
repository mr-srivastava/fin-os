import { assert, expect, test } from "vitest";
import { ProviderError } from "./provider.ts";
import {
  getTigzigNav,
  normalizeTigzigNavPayload,
  normalizeTigzigNifty500Payload,
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

test("normalizes Nifty 500 market series data", () => {
  assert.deepEqual(
    normalizeTigzigNifty500Payload({
      data: [
        { date: "2026-08-13", "^CRSLDX": 21_234.56 },
        { date: "invalid", "^CRSLDX": 21_300 },
        { date: "2026-08-14", "^CRSLDX": "21,400" },
      ],
    }),
    [
      { date: "2026-08-13", nav: 21_234.56 },
      { date: "2026-08-14", nav: 21_400 },
    ],
  );
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
