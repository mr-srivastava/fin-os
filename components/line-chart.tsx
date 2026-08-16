"use client";

import {
  CartesianGrid,
  Line,
  LineChart as RechartsLineChart,
  ReferenceLine,
  XAxis,
  YAxis,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { investmentValueFromReturn } from "@/lib/analytics";
import { alignSeriesByMonth } from "@/lib/chart-data";
import {
  formatCompactDate,
  formatFullDate,
  formatNumber,
  formatPercent,
  formatRupees,
} from "@/lib/utils";

export type ChartColor = "foreground" | "chart-1" | "chart-3";
export interface ChartPoint {
  date: string;
  value: number;
}

export interface ChartSeries {
  name: string;
  color: ChartColor;
  points: readonly ChartPoint[];
}

export type ChartValueMode = "indexed" | "return";

interface LineChartProps {
  series: readonly ChartSeries[];
  valueMode?: ChartValueMode;
}

export function LineChart({ series, valueMode = "indexed" }: LineChartProps) {
  const allPoints = series.flatMap((item) => item.points);
  if (allPoints.length < 2)
    return (
      <p className="grid min-h-48 place-items-center text-sm text-muted-foreground">
        Not enough data to plot a series.
      </p>
    );
  const isComparison = series.length > 1;
  const primarySeries = series[0];
  const data = isComparison
    ? alignSeriesByMonth(series.map((item) => item.points)).map(({ month, values }) => ({
        date: month,
        ...Object.fromEntries(values.map((value, index) => [`fund${index}`, value])),
      }))
    : (primarySeries?.points ?? []).map((point) => ({ date: point.date, fund0: point.value }));
  const config = Object.fromEntries(
    series.map((item, index) => [
      `fund${index}`,
      { label: item.name, color: `var(--${item.color})` },
    ]),
  ) satisfies ChartConfig;
  return (
    <ChartContainer
      config={config}
      className="min-h-64 w-full"
      aria-label={
        valueMode === "return"
          ? "NAV return chart. The series begins at zero percent for the selected period."
          : "Indexed NAV performance chart. The series begins at an index value of 100."
      }
    >
      <RechartsLineChart accessibilityLayer data={data} margin={{ left: 0, right: 8, top: 8 }}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis
          dataKey="date"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          minTickGap={40}
          tickFormatter={(date) =>
            isComparison ? formatMonth(String(date)) : formatCompactDate(date)
          }
        />
        {valueMode === "return" ? (
          <YAxis
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            width={44}
            domain={[
              (minimum: number) => Math.min(0, Math.floor(minimum / 5) * 5),
              (maximum: number) => Math.max(0, Math.ceil(maximum / 5) * 5),
            ]}
            tickFormatter={(value) => formatPercent(Number(value) / 100)}
          />
        ) : (
          <YAxis
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            width={44}
            tickFormatter={(value) => formatNumber(Number(value))}
          />
        )}
        <ReferenceLine
          y={valueMode === "return" ? 0 : 100}
          stroke="var(--border)"
          strokeDasharray="4 4"
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              labelFormatter={(label) =>
                isComparison ? formatMonth(String(label)) : formatFullDate(String(label))
              }
              formatter={(value, name) => (
                <div className="flex w-full items-center justify-between gap-6">
                  <span className="text-muted-foreground">{String(name)}</span>
                  <span className="font-mono font-medium tabular-nums">
                    {valueMode === "return"
                      ? formatRupees(investmentValueFromReturn(Number(value) / 100))
                      : formatNumber(Number(value))}
                  </span>
                </div>
              )}
            />
          }
        />
        {series.map((item, index) => (
          <Line
            key={item.name}
            dataKey={`fund${index}`}
            name={item.name}
            type="monotone"
            stroke={`var(--color-fund${index})`}
            strokeWidth={2.5}
            dot={false}
          />
        ))}
      </RechartsLineChart>
    </ChartContainer>
  );
}

function formatMonth(value: string) {
  const match = /^(\d{4})-(\d{2})$/.exec(value);
  if (!match) return value;
  const [year, month] = match.slice(1);
  return new Intl.DateTimeFormat("en-IN", { month: "short", year: "2-digit" }).format(
    new Date(Date.UTC(Number(year), Number(month) - 1, 1)),
  );
}
