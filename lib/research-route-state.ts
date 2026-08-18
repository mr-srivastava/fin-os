import type { PerformanceRange } from "@/lib/analytics";
import { isSchemeCode } from "@/lib/fund-input";

export const DEFAULT_PERFORMANCE_RANGE: PerformanceRange = "3y";

export const PERFORMANCE_RANGES = [
  { value: "6m", label: "6M" },
  { value: "1y", label: "1Y" },
  { value: "3y", label: "3Y" },
  { value: "5y", label: "5Y" },
  { value: "max", label: "Max" },
] as const satisfies readonly { value: PerformanceRange; label: string }[];

type SearchValue = string | string[] | undefined;
type SearchParams = Record<string, SearchValue>;

export interface FundResearchRouteState {
  range: PerformanceRange;
  showBenchmark: boolean;
  against: string | null;
}

export interface ComparisonRouteState {
  schemeCodes: readonly string[];
  range: PerformanceRange;
}

function first(value: SearchValue) {
  return typeof value === "string" ? value : undefined;
}

export function isPerformanceRange(value: string | undefined): value is PerformanceRange {
  return PERFORMANCE_RANGES.some((option) => option.value === value);
}

export function parseFundResearchSearchParams(params: SearchParams): FundResearchRouteState {
  const range = first(params.range);
  const against = first(params.against);
  return {
    range: isPerformanceRange(range) ? range : DEFAULT_PERFORMANCE_RANGE,
    showBenchmark: first(params.benchmark) === "1",
    against: against && isSchemeCode(against) ? against : null,
  };
}

export function toFundResearchHref(schemeCode: string, state: FundResearchRouteState) {
  const params = new URLSearchParams();
  if (state.range !== DEFAULT_PERFORMANCE_RANGE) params.set("range", state.range);
  if (state.showBenchmark) params.set("benchmark", "1");
  if (state.against && state.against !== schemeCode) params.set("against", state.against);
  const query = params.toString();
  return `/fund/${schemeCode}${query ? `?${query}` : ""}`;
}

export function parseComparisonSearchParams(params: SearchParams): ComparisonRouteState {
  const codesParam = first(params.codes);
  const rawCandidates = codesParam
    ? codesParam.split(",").map((code) => code.trim())
    : [first(params.fund), first(params.against)];
  const candidates = rawCandidates.filter((schemeCode): schemeCode is string =>
    Boolean(schemeCode && isSchemeCode(schemeCode)),
  );
  const schemeCodes = candidates.filter(
    (schemeCode, index) => candidates.indexOf(schemeCode) === index,
  );
  const range = first(params.range);
  return {
    schemeCodes: schemeCodes.slice(0, 2),
    range: isPerformanceRange(range) ? range : DEFAULT_PERFORMANCE_RANGE,
  };
}

export function toComparisonHref(state: ComparisonRouteState) {
  const [fund, against] = state.schemeCodes;
  if (!fund) return "/compare";
  const params = new URLSearchParams({ fund });
  if (against) params.set("against", against);
  if (state.range !== DEFAULT_PERFORMANCE_RANGE) params.set("range", state.range);
  return `/compare?${params.toString()}`;
}
