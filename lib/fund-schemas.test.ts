import { assert, test } from "vitest";
import * as v from "valibot";
import {
  ApiErrorSchema,
  ComparisonViewSchema,
  FundResearchSchema,
  FundResearchViewSchema,
  NavPointSchema,
  SchemeSearchSchema,
} from "./fund-schemas.ts";
import { isSchemeCode, isSearchQuery } from "./fund-input.ts";
import type { ApiErrorCode } from "./fund-types.ts";

test("accepts a valid scheme search response", () => {
  const result = v.safeParse(SchemeSearchSchema, {
    schemes: [
      {
        schemeCode: "123456",
        schemeName: "Example Fund",
        amc: "Example AMC",
        category: "Large Cap",
        plan: "Direct",
        option: "Growth",
      },
    ],
  });

  assert.equal(result.success, true);
});

test("rejects an invalid nested fund response", () => {
  const result = v.safeParse(FundResearchSchema, {
    scheme: {},
    nav: [{ date: "2025-01-01", nav: "not-a-number" }],
  });

  assert.equal(result.success, false);
});

test("rejects malformed nested research views", () => {
  assert.equal(v.safeParse(FundResearchViewSchema, { scheme: {}, performance: {} }).success, false);
  assert.equal(
    v.safeParse(ComparisonViewSchema, { selections: [], comparison: {} }).success,
    false,
  );
});

test("rejects invalid NAV domain values", () => {
  assert.equal(v.safeParse(NavPointSchema, { date: "2026-02-30", nav: 10 }).success, false);
  assert.equal(v.safeParse(NavPointSchema, { date: "2026-02-28", nav: 0 }).success, false);
});

test("requires the complete API error contract", () => {
  assert.equal(v.safeParse(ApiErrorSchema, { message: "Missing error code" }).success, false);
  const errorCodes: readonly ApiErrorCode[] = [
    "invalid_query",
    "invalid_scheme_code",
    "invalid_comparison",
    "not_found",
    "provider_error",
  ];
  for (const error of errorCodes) {
    assert.equal(v.safeParse(ApiErrorSchema, { error, message: "Unavailable" }).success, true);
  }
  assert.equal(
    v.safeParse(ApiErrorSchema, { error: "unexpected", message: "Unavailable" }).success,
    false,
  );
});

test("shares API request input constraints", () => {
  assert.equal(isSchemeCode("1234"), true);
  assert.equal(isSchemeCode("1234567"), true);
  assert.equal(isSchemeCode("123"), false);
  assert.equal(isSchemeCode("12345678"), false);
  assert.equal(isSchemeCode("code"), false);
  assert.equal(isSearchQuery("ab"), true);
  assert.equal(isSearchQuery("a"), false);
  assert.equal(isSearchQuery("a".repeat(81)), false);
});
