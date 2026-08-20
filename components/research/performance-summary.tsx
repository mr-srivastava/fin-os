import { Field, FieldLabel } from "@/components/ui/field";
import { Switch } from "@/components/ui/switch";
import { statusColorClass, type MetricStatus } from "@/lib/utils";

interface Outcome {
  returnPercent: number | null;
  returnText: string;
  valueText: string;
  status: MetricStatus;
}

export function PerformanceSummary({
  fund,
  benchmark,
  benchmarkName,
  showBenchmark,
  hasBenchmark,
  onToggleBenchmark,
  toggleId,
}: {
  fund: Outcome | undefined;
  benchmark: Outcome | undefined;
  benchmarkName: string | undefined;
  showBenchmark: boolean;
  hasBenchmark: boolean;
  onToggleBenchmark: (checked: boolean) => void;
  toggleId: string;
}) {
  const comparing = showBenchmark && hasBenchmark;
  const excessPercent =
    comparing && fund?.returnPercent != null && benchmark?.returnPercent != null
      ? fund.returnPercent - benchmark.returnPercent
      : null;
  const excessText =
    excessPercent === null
      ? "—"
      : `${excessPercent > 0 ? "+" : ""}${(excessPercent * 100).toFixed(1)} pp`;

  return (
    <div>
      <div className={`grid gap-4 ${comparing ? "grid-cols-3" : "grid-cols-1"}`}>
        <div>
          <p className="text-xs text-muted-foreground">Fund</p>
          <p
            className={`mt-1 font-mono text-lg font-semibold tabular-nums ${statusColorClass(fund?.status ?? "neutral")}`}
          >
            {fund?.returnText ?? "—"}
          </p>
          <p className="mt-0.5 font-mono text-xs text-muted-foreground tabular-nums">
            {fund?.valueText ?? "—"}
          </p>
        </div>
        {comparing ? (
          <div>
            <p className="truncate text-xs text-muted-foreground">{benchmarkName ?? "Benchmark"}</p>
            <p
              className={`mt-1 font-mono text-lg font-semibold tabular-nums ${statusColorClass(benchmark?.status ?? "neutral")}`}
            >
              {benchmark?.returnText ?? "—"}
            </p>
            <p className="mt-0.5 font-mono text-xs text-muted-foreground tabular-nums">
              {benchmark?.valueText ?? "—"}
            </p>
          </div>
        ) : null}
        {comparing ? (
          <div>
            <p className="text-xs text-muted-foreground">Excess</p>
            <p
              className={`mt-1 font-mono text-lg font-semibold tabular-nums ${
                excessPercent === null ? "" : excessPercent >= 0 ? "text-positive" : "text-negative"
              }`}
            >
              {excessText}
            </p>
          </div>
        ) : null}
      </div>
      {hasBenchmark ? (
        <div className="mt-4">
          <Field orientation="horizontal" className="w-auto">
            <Switch id={toggleId} checked={showBenchmark} onCheckedChange={onToggleBenchmark} />
            <FieldLabel htmlFor={toggleId}>Show total-return benchmark</FieldLabel>
          </Field>
        </div>
      ) : null}
    </div>
  );
}

export function ComparisonSummary({
  outcomes,
}: {
  outcomes: readonly (Outcome & { name: string })[];
}) {
  const a = outcomes[0];
  const b = outcomes[1];
  if (!a || !b) return null;
  const diffPercent =
    a.returnPercent != null && b.returnPercent != null ? a.returnPercent - b.returnPercent : null;
  const diffText =
    diffPercent === null
      ? "—"
      : `${diffPercent > 0 ? "+" : ""}${(diffPercent * 100).toFixed(1)} pp`;

  return (
    <div className="grid grid-cols-3 gap-4">
      <div>
        <p className="truncate text-xs text-muted-foreground">{a.name}</p>
        <p
          className={`mt-1 font-mono text-lg font-semibold tabular-nums ${statusColorClass(a.status)}`}
        >
          {a.returnText}
        </p>
        <p className="mt-0.5 font-mono text-xs text-muted-foreground tabular-nums">{a.valueText}</p>
      </div>
      <div>
        <p className="truncate text-xs text-muted-foreground">{b.name}</p>
        <p
          className={`mt-1 font-mono text-lg font-semibold tabular-nums ${statusColorClass(b.status)}`}
        >
          {b.returnText}
        </p>
        <p className="mt-0.5 font-mono text-xs text-muted-foreground tabular-nums">{b.valueText}</p>
      </div>
      <div>
        <p className="text-xs text-muted-foreground">Difference</p>
        <p
          className={`mt-1 font-mono text-lg font-semibold tabular-nums ${
            diffPercent === null ? "" : diffPercent >= 0 ? "text-positive" : "text-negative"
          }`}
        >
          {diffText}
        </p>
      </div>
    </div>
  );
}
