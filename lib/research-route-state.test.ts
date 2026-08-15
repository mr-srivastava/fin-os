import { describe, expect, it } from "vitest";
import {
  DEFAULT_PERFORMANCE_RANGE,
  parseComparisonSearchParams,
  parseFundResearchSearchParams,
  toComparisonHref,
  toFundResearchHref,
} from "@/lib/research-route-state";

describe("research route state", () => {
  it("uses canonical fund defaults and omits them from hrefs", () => {
    expect(parseFundResearchSearchParams({ range: "invalid", benchmark: "0" })).toEqual({
      range: DEFAULT_PERFORMANCE_RANGE,
      showBenchmark: false,
    });
    expect(toFundResearchHref("1234", { range: "3y", showBenchmark: false })).toBe("/fund/1234");
    expect(toFundResearchHref("1234", { range: "1y", showBenchmark: true })).toBe(
      "/fund/1234?range=1y&benchmark=1",
    );
  });

  it("keeps comparison selections valid, ordered, unique, and bounded", () => {
    expect(parseComparisonSearchParams({ fund: "1234", against: "1234", range: "5y" })).toEqual({
      schemeCodes: ["1234"],
      range: "5y",
    });
    expect(parseComparisonSearchParams({ fund: "bad", against: "5678" })).toEqual({
      schemeCodes: ["5678"],
      range: DEFAULT_PERFORMANCE_RANGE,
    });
    expect(toComparisonHref({ schemeCodes: ["1234", "5678"], range: "3y" })).toBe(
      "/compare?fund=1234&against=5678",
    );
  });
});
