import { expect, test } from "vitest";
import {
  normalizeBenchmarkName,
  resolveBenchmark,
  validateBenchmarkCatalog,
} from "./benchmarkCatalog";

test("normalizes declared benchmark names before lookup", () => {
  expect(normalizeBenchmarkName("  Nifty  500 TR INR ")).toBe("NIFTY 500 TR INR");
  expect(resolveBenchmark("Nifty 500 TR INR")).toMatchObject({
    displayName: "Nifty 500 TRI",
    finapiIndexName: "NIFTY 500",
  });
});

test("rejects price-return identifiers from the TRI catalog", () => {
  expect(() =>
    validateBenchmarkCatalog([
      {
        declaredNames: ["Nifty 500 TR INR"],
        displayName: "Nifty 500 TRI",
        finapiIndexName: "closePrice",
        returnBasis: "total_return",
      },
    ]),
  ).toThrow("known price-return");
});

test("rejects catalog entries that are not total-return series", () => {
  expect(() =>
    validateBenchmarkCatalog([
      {
        declaredNames: ["Nifty 500 PR INR"],
        displayName: "Nifty 500 price index",
        finapiIndexName: "NIFTY 500",
        returnBasis: "price_return" as never,
      },
    ]),
  ).toThrow("Only total-return");
});
