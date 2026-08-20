import type { BenchmarkReturnBasis } from "./fund.types.ts";

export interface BenchmarkDefinition {
  declaredNames: readonly string[];
  displayName: string;
  finapiIndexName: string;
  returnBasis: BenchmarkReturnBasis;
}

const KNOWN_PRICE_RETURN_FIELDS = new Set(["closePrice", "ntrValue"]);

/**
 * Entries are registered only when FinAPI exposes an explicit TRI field for
 * the exact declared benchmark.
 */
const TOTAL_RETURN_BENCHMARKS: readonly BenchmarkDefinition[] = [
  {
    declaredNames: ["Nifty 500 TR INR"],
    displayName: "Nifty 500 TRI",
    finapiIndexName: "NIFTY 500",
    returnBasis: "total_return",
  },
];

export function normalizeBenchmarkName(name: string) {
  return name.trim().replace(/\s+/g, " ").toUpperCase();
}

export function validateBenchmarkCatalog(entries: readonly BenchmarkDefinition[]) {
  for (const entry of entries) {
    if (entry.returnBasis !== "total_return")
      throw new Error("Only total-return benchmarks can be registered.");
    if (KNOWN_PRICE_RETURN_FIELDS.has(entry.finapiIndexName))
      throw new Error(`${entry.finapiIndexName} is a known price-return field.`);
    if (!entry.declaredNames.length || !entry.displayName || !entry.finapiIndexName)
      throw new Error(
        "A benchmark definition must include names, a display name, and an identifier.",
      );
  }
}

validateBenchmarkCatalog(TOTAL_RETURN_BENCHMARKS);

export function resolveBenchmark(name: string | null): BenchmarkDefinition | null {
  if (!name) return null;
  const normalized = normalizeBenchmarkName(name);
  return (
    TOTAL_RETURN_BENCHMARKS.find((entry) =>
      entry.declaredNames.some((declared) => normalizeBenchmarkName(declared) === normalized),
    ) ?? null
  );
}
