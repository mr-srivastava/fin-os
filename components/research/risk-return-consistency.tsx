import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { FundResearchReadyModel } from "@/lib/research-display/types";

export function RiskAndReturnConsistency({
  riskMetrics,
  consistency,
}: {
  riskMetrics: readonly { label: string; valueText: string; status: "gain" | "loss" | "neutral" }[];
  consistency: FundResearchReadyModel["returnConsistency"];
}) {
  if (!riskMetrics.length && !consistency) return null;
  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Risk &amp; return consistency</CardTitle>
        <CardDescription>
          Path risk is calculated from available NAV history. Rolling-return figures are reported by
          FinAPI and describe historical outcomes, not recommendations.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        {riskMetrics.length ? (
          <section aria-labelledby="path-risk-title">
            <h3 id="path-risk-title" className="text-sm font-semibold">
              Path risk
            </h3>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {riskMetrics.map((metric) => (
                <div key={metric.label} className="rounded-lg border bg-muted/20 p-3">
                  <p className="text-xs text-muted-foreground">{metric.label}</p>
                  <p className="mt-1 font-mono text-xl font-semibold tabular-nums">
                    {metric.valueText}
                  </p>
                </div>
              ))}
            </div>
          </section>
        ) : null}
        {consistency ? (
          <section aria-labelledby="return-consistency-title" className="lg:border-l lg:pl-6">
            <h3 id="return-consistency-title" className="text-sm font-semibold">
              {consistency.timeframe} rolling returns
            </h3>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {consistency.rows.map((row) => (
                <div key={row.label}>
                  <p className="text-xs text-muted-foreground">{row.label}</p>
                  <p className="mt-1 font-mono text-sm font-medium tabular-nums">{row.valueText}</p>
                </div>
              ))}
            </div>
          </section>
        ) : null}
      </CardContent>
    </Card>
  );
}
