import { TrendingDownIcon, TrendingUpIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { statusColorClass, type MetricStatus } from "@/lib/utils";

export interface MetricCardValue {
  label: string;
  valueText: string;
  status: MetricStatus;
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
          return (
            <div
              key={metric.label}
              className="min-w-0 rounded-lg border bg-muted/20 p-3 shadow-card"
            >
              <p className="text-xs text-muted-foreground">{metric.label}</p>
              <p
                className={`mt-1 flex items-center gap-1.5 font-mono text-2xl font-medium tabular-nums ${statusColorClass(metric.status)}`}
              >
                {metric.status === "gain" ? (
                  <TrendingUpIcon className="size-4" aria-hidden="true" />
                ) : null}
                {metric.status === "loss" ? (
                  <TrendingDownIcon className="size-4" aria-hidden="true" />
                ) : null}
                {metric.valueText}
              </p>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
