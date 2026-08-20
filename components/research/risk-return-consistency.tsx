import { CircleHelpIcon } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { formatNumber } from "@/lib/utils";
import type { FundResearchReadyModel } from "@/lib/research-display/types";

const RISK_CAPTIONS: Record<string, string> = {
  Volatility: "How much returns fluctuate",
  "Max drawdown": "Largest peak-to-trough decline",
};

export function RiskAndReturnConsistency({
  riskMetrics,
  consistency,
}: {
  riskMetrics: readonly { label: string; valueText: string; status: "gain" | "loss" | "neutral" }[];
  consistency: FundResearchReadyModel["returnConsistency"];
}) {
  if (!riskMetrics.length && !consistency) return null;

  const positiveRatio = consistency?.positiveRatio ?? null;
  const min = consistency?.minReturn ?? null;
  const median = consistency?.medianReturn ?? null;
  const max = consistency?.maxReturn ?? null;
  const hasRange = min !== null && median !== null && max !== null;
  const rangePosition = hasRange && max !== min ? ((median - min) / (max - min)) * 100 : 50;

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Risk &amp; consistency</CardTitle>
        <CardDescription>
          How risky has the fund&apos;s path been, and how reliably has it delivered?
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-5">
        {riskMetrics.length ? (
          <section aria-labelledby="historical-risk-title">
            <h3
              id="historical-risk-title"
              className="text-xs font-semibold tracking-wide text-muted-foreground uppercase"
            >
              Historical risk
            </h3>
            <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-4">
              {riskMetrics.map((metric) => (
                <div key={metric.label}>
                  <p className="text-xs text-muted-foreground">{metric.label}</p>
                  <p className="mt-1 font-mono text-lg font-semibold tabular-nums">
                    {metric.valueText}
                  </p>
                  {RISK_CAPTIONS[metric.label] ? (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {RISK_CAPTIONS[metric.label]}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {consistency ? (
          <section aria-labelledby="return-consistency-title" className="space-y-4">
            <h3
              id="return-consistency-title"
              className="text-xs font-semibold tracking-wide text-muted-foreground uppercase"
            >
              {consistency.timeframe} rolling return consistency
            </h3>
            {positiveRatio !== null ? (
              <div>
                <div className="flex items-baseline justify-between">
                  <p className="text-xs text-muted-foreground">Positive periods</p>
                  <p className="font-mono text-lg font-semibold tabular-nums">
                    {formatNumber(positiveRatio)}%
                  </p>
                </div>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-foreground"
                    style={{ width: `${Math.min(100, Math.max(0, positiveRatio))}%` }}
                  />
                </div>
              </div>
            ) : null}
            {hasRange ? (
              <div>
                <div className="relative h-1.5 rounded-full bg-muted">
                  <div
                    className="absolute top-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-foreground"
                    style={{ left: `${Math.min(96, Math.max(4, rangePosition))}%` }}
                  />
                </div>
                <div className="mt-2 flex justify-between text-xs">
                  <div>
                    <p className="font-mono text-sm font-medium tabular-nums">
                      {formatNumber(min)}%
                    </p>
                    <p className="text-muted-foreground">Worst</p>
                  </div>
                  <div className="text-center">
                    <p className="font-mono text-sm font-medium tabular-nums">
                      {formatNumber(median)}%
                    </p>
                    <p className="text-muted-foreground">Median</p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-sm font-medium tabular-nums">
                      {formatNumber(max)}%
                    </p>
                    <p className="text-muted-foreground">Best</p>
                  </div>
                </div>
              </div>
            ) : null}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
              {consistency.averageReturn !== null ? (
                <span>
                  Average{" "}
                  <span className="font-mono font-medium text-foreground tabular-nums">
                    {formatNumber(consistency.averageReturn)}%
                  </span>
                </span>
              ) : null}
              {consistency.negativeRatio !== null ? (
                <span>
                  Negative{" "}
                  <span className="font-mono font-medium text-foreground tabular-nums">
                    {formatNumber(consistency.negativeRatio)}%
                  </span>
                </span>
              ) : null}
              {consistency.consistencyScore !== null ? (
                <Tooltip>
                  <TooltipTrigger
                    className="ml-auto text-muted-foreground"
                    aria-label="Provider consistency score"
                  >
                    <CircleHelpIcon className="size-3.5" />
                  </TooltipTrigger>
                  <TooltipContent>
                    Provider consistency score: {formatNumber(consistency.consistencyScore)}.
                    Reported by FinAPI — methodology and scale aren&apos;t documented by the
                    provider, shown for reference only.
                  </TooltipContent>
                </Tooltip>
              ) : null}
            </div>
          </section>
        ) : null}
      </CardContent>
    </Card>
  );
}
