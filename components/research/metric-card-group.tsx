import { TrendingDownIcon, TrendingUpIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
export interface MetricCardValue {
  label: string;
  valueText: string;
  status: "gain" | "loss" | "neutral";
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
            <div key={metric.label} className="min-w-0 rounded-lg bg-muted/35 px-3 py-3">
              <p className="text-xs text-muted-foreground">{metric.label}</p>
              <p
                className={`mt-1 flex items-center gap-1.5 font-mono text-xl font-semibold tabular-nums ${metric.status === "loss" ? "text-negative" : metric.status === "gain" ? "text-positive" : "text-foreground"}`}
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
