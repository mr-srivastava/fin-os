import { filterSeriesByRange, investmentOutcome, relativeReturnSeries } from "@/lib/analytics";
import type { NavPoint } from "@/lib/fund-types";
import { PERFORMANCE_RANGES } from "@/lib/research-route-state";
import type { PerformanceRangeView, Tone } from "./types";

export function financialTone(value: number | null): Tone {
  if (value === null || value === 0) return "neutral";
  return value > 0 ? "gain" : "loss";
}

export function performanceRanges(
  sources: readonly { name: string; points: readonly NavPoint[] }[],
): Record<(typeof PERFORMANCE_RANGES)[number]["value"], PerformanceRangeView> {
  return Object.fromEntries(
    PERFORMANCE_RANGES.map(({ value, label }) => {
      const selectedSources = sources.map((source) => ({
        name: source.name,
        points: filterSeriesByRange([...source.points], value),
      }));
      return [
        value,
        {
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
        } satisfies PerformanceRangeView,
      ];
    }),
  ) as unknown as Record<(typeof PERFORMANCE_RANGES)[number]["value"], PerformanceRangeView>;
}
