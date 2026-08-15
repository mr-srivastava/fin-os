import { TrendingDownIcon, TrendingUpIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPercent, formatSignedPercent } from "@/lib/utils";

export interface MetricCardValue {
  label: string;
  value: number | null;
  format: "percent" | "signed-percent";
  direction: "positive-is-good" | "negative-is-good" | "neutral";
}

export function MetricCardGroup({
  title,
  metrics,
}: {
  title: string;
  metrics: readonly MetricCardValue[];
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent
        className={`grid gap-3 ${metrics.length === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}
      >
        {metrics.map((metric) => {
          const isLoss =
            metric.value !== null &&
            metric.direction === "positive-is-good" &&
            metric.value < 0;
          const isGain =
            metric.value !== null &&
            metric.direction === "positive-is-good" &&
            metric.value > 0;
          return (
            <div key={metric.label} className="min-w-0 rounded-lg bg-muted/35 px-3 py-3">
              <p className="text-xs text-muted-foreground">{metric.label}</p>
              <p
                className={`mt-1 flex items-center gap-1.5 font-mono text-xl font-semibold tabular-nums ${isLoss ? "text-negative" : isGain ? "text-positive" : "text-foreground"}`}
              >
                {isGain ? <TrendingUpIcon className="size-4" aria-hidden="true" /> : null}
                {isLoss ? <TrendingDownIcon className="size-4" aria-hidden="true" /> : null}
                {metric.format === "signed-percent"
                  ? formatSignedPercent(metric.value)
                  : formatPercent(metric.value)}
              </p>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
