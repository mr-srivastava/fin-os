"use client";

import { LineChart, type ChartColor, type ChartSeries } from "@/components/line-chart";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { PerformanceRange } from "@/lib/analytics";
import { PERFORMANCE_RANGES } from "@/lib/research-route-state";

export interface SchemeAnalysisSeries extends ChartSeries {
  color: ChartColor;
}

interface SchemeAnalysisChartProps {
  series: readonly SchemeAnalysisSeries[];
  range: PerformanceRange;
  onRangeChange: (range: PerformanceRange) => void;
}

export function SchemeAnalysisChart({ series, range, onRangeChange }: SchemeAnalysisChartProps) {
  return (
    <>
      <div>
        <Separator />
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3">
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
      </div>
      <LineChart series={series} valueMode="return" />
      <div className="mt-4 flex flex-wrap gap-3" aria-label="Chart series">
        {series.map((item) => (
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
