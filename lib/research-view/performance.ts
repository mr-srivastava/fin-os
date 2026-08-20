import { filterSeriesByRange, investmentOutcome, relativeReturnSeries } from "@/lib/analytics";
import type { NavPoint } from "@/lib/fund.types";
import { PERFORMANCE_RANGES } from "@/lib/researchRouteState";
import type { PerformanceRangeView, Tone } from "./types";

export function financialTone(value: number | null): Tone {
  if (value === null || value === 0) return "neutral";
  return value > 0 ? "gain" : "loss";
}

type PerformanceRangeKey = (typeof PERFORMANCE_RANGES)[number]["value"];

export function performanceRanges(
  sources: readonly { name: string; points: readonly NavPoint[] }[],
): Record<PerformanceRangeKey, PerformanceRangeView> {
  return PERFORMANCE_RANGES.reduce<Record<PerformanceRangeKey, PerformanceRangeView>>(
    (ranges, { value, label }) => {
      const selectedSources = sources.map((source) => ({
        name: source.name,
        points: filterSeriesByRange([...source.points], value),
      }));
      ranges[value] = {
        label,
        series: selectedSources.map((source) => ({
          name: source.name,
          points: relativeReturnSeries(source.points),
        })),
        outcomes: selectedSources.map((source) => {
          const outcome = investmentOutcome(source.points);
          return {
            name: source.name,
            returnPercent: outcome?.returnPercent ?? null,
            endingValue: outcome?.value ?? null,
            tone: financialTone(outcome?.returnPercent ?? null),
          };
        }),
      };
      return ranges;
    },
    // SAFETY: seeds the reduce accumulator; every PERFORMANCE_RANGES key is assigned above
    // before this function returns.
    {} as Record<PerformanceRangeKey, PerformanceRangeView>,
  );
}
