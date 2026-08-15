"use client";

import { useEffect, useMemo, useState } from "react";
import { LineChart, type ChartColor, type ChartSeries } from "@/components/line-chart";
import { Badge } from "@/components/ui/badge";
import { Toggle } from "@/components/ui/toggle";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { filterSeriesByRange, relativeReturnSeries, type PerformanceRange } from "@/lib/analytics";
import type { NavPoint } from "@/lib/fund-types";

export interface SchemeAnalysisSeries {
  name: string;
  color: ChartColor;
  points: NavPoint[];
}

interface SchemeAnalysisChartProps {
  series: readonly SchemeAnalysisSeries[];
  initialRange?: PerformanceRange;
  comparisonToggle?: {
    initialPressed: boolean;
    label: string;
    onPressedChange: (pressed: boolean) => void;
  };
  onRangeChange?: (range: PerformanceRange) => void;
}

const performanceRanges = [
  { value: "6m", label: "6M" },
  { value: "1y", label: "1Y" },
  { value: "3y", label: "3Y" },
  { value: "5y", label: "5Y" },
  { value: "max", label: "Max" },
] as const satisfies readonly { value: PerformanceRange; label: string }[];

export function SchemeAnalysisChart({
  series,
  initialRange = "3y",
  comparisonToggle,
  onRangeChange,
}: SchemeAnalysisChartProps) {
  const [range, setRange] = useState(initialRange);
  const [showComparison, setShowComparison] = useState(comparisonToggle?.initialPressed ?? true);

  useEffect(() => setRange(initialRange), [initialRange]);
  useEffect(
    () => setShowComparison(comparisonToggle?.initialPressed ?? true),
    [comparisonToggle?.initialPressed],
  );

  const visibleSeries = comparisonToggle && !showComparison ? series.slice(0, 1) : series;
  const chartSeries = useMemo<readonly ChartSeries[]>(
    () =>
      visibleSeries.map((item) => ({
        ...item,
        points: relativeReturnSeries(filterSeriesByRange(item.points, range)),
      })),
    [range, visibleSeries],
  );

  function selectRange(nextRange: PerformanceRange) {
    setRange(nextRange);
    onRangeChange?.(nextRange);
  }

  function toggleComparison(pressed: boolean) {
    setShowComparison(pressed);
    comparisonToggle?.onPressedChange(pressed);
  }

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
            if (performanceRanges.some((option) => option.value === nextRange)) {
              selectRange(nextRange as PerformanceRange);
            }
          }}
        >
          {performanceRanges.map((option) => (
            <ToggleGroupItem key={option.value} value={option.value}>
              {option.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        {comparisonToggle ? (
          <Toggle
            variant="outline"
            size="sm"
            pressed={showComparison}
            onPressedChange={toggleComparison}
          >
            {showComparison ? `Hide ${comparisonToggle.label}` : `Show ${comparisonToggle.label}`}
          </Toggle>
        ) : null}
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
