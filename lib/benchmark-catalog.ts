import type { BenchmarkReturnBasis } from "./fund-types.ts";

export interface BenchmarkDefinition {
  declaredNames: readonly string[];
  displayName: string;
  tigzigId: string;
  returnBasis: BenchmarkReturnBasis;
}

const KNOWN_PRICE_RETURN_IDENTIFIERS = new Set(["^CRSLDX"]);

/**
 * Only add an entry after confirming that TigZig serves this exact identifier
 * as a total-return index. The current TigZig catalog exposes Nifty 500 only
 * as the price index ^CRSLDX, so it must not be registered here.
 */
const TOTAL_RETURN_BENCHMARKS: readonly BenchmarkDefinition[] = [];

export function normalizeBenchmarkName(name: string) {
  return name.trim().replace(/\s+/g, " ").toUpperCase();
}

export function validateBenchmarkCatalog(entries: readonly BenchmarkDefinition[]) {
  for (const entry of entries) {
    if (entry.returnBasis !== "total_return")
      throw new Error("Only total-return benchmarks can be registered.");
    if (KNOWN_PRICE_RETURN_IDENTIFIERS.has(entry.tigzigId))
      throw new Error(`${entry.tigzigId} is a known price-return identifier.`);
    if (!entry.declaredNames.length || !entry.displayName || !entry.tigzigId)
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
