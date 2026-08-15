"use client";

import { useMemo } from "react";
import { LineChart, type ChartColor, type ChartSeries } from "@/components/line-chart";
import { Badge } from "@/components/ui/badge";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { filterSeriesByRange, relativeReturnSeries, type PerformanceRange } from "@/lib/analytics";
import type { NavPoint } from "@/lib/fund-types";
import { PERFORMANCE_RANGES } from "@/lib/research-route-state";

export interface SchemeAnalysisSeries {
  name: string;
  color: ChartColor;
  points: readonly NavPoint[];
}

interface SchemeAnalysisChartProps {
  series: readonly SchemeAnalysisSeries[];
  range: PerformanceRange;
  onRangeChange: (range: PerformanceRange) => void;
}

export function SchemeAnalysisChart({ series, range, onRangeChange }: SchemeAnalysisChartProps) {
  const chartSeries = useMemo<readonly ChartSeries[]>(
    () =>
      series.map((item) => ({
        ...item,
        points: relativeReturnSeries(filterSeriesByRange([...item.points], range)),
      })),
    [range, series],
  );

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-3">
        <ToggleGroup
          aria-label="Performance period"
          size="sm"
          spacing={0}
          value={[range]}
          onValueChange={(value) => {
            const nextRange = value[0];
            if (PERFORMANCE_RANGES.some((option) => option.value === nextRange)) {
              onRangeChange(nextRange as PerformanceRange);
            }
          }}
        >
          {PERFORMANCE_RANGES.map((option) => (
            <ToggleGroupItem key={option.value} value={option.value}>
              {option.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>
      <LineChart series={chartSeries} valueMode="return" />
      <div className="mt-4 flex flex-wrap gap-3" aria-label="Chart series">
        {chartSeries.map((item) => (
          <Badge key={item.name} variant="outline">
            <i
              aria-hidden="true"
              className="mr-2 inline-block size-2 rounded-full"
              style={{ background: `var(--${item.color})` }}
            />
            {item.name}
          </Badge>
        ))}
      </div>
    </>
  );
}
