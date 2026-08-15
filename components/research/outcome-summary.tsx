import { formatRupees, formatSignedPercent } from "@/lib/utils";

export interface InvestmentOutcomeValue {
  value: number;
  returnPercent: number;
}

export function OutcomeSummary({
  name,
  colorClassName,
  outcome,
}: {
  name: string;
  colorClassName: string;
  outcome: InvestmentOutcomeValue | null;
}) {
  const isLoss = (outcome?.returnPercent ?? 0) < 0;
  return (
    <div className="min-w-0">
      <p className="flex items-center gap-2 text-sm font-medium">
        <span aria-hidden="true" className={`size-2 rounded-full ${colorClassName}`} />
        {name}
      </p>
      <div className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <p
          className={`font-mono text-xl font-semibold tabular-nums ${isLoss ? "text-negative" : "text-positive"}`}
        >
          {outcome ? formatSignedPercent(outcome.returnPercent) : "—"}
        </p>
        <p className="font-mono text-sm font-medium text-muted-foreground tabular-nums">
          {outcome ? formatRupees(outcome.value) : "—"}
          <span className="ml-1 font-sans text-xs">ending value</span>
        </p>
      </div>
    </div>
  );
}
