import { statusColorClass, type MetricStatus } from "@/lib/utils";

export function OutcomeSummary({
  name,
  colorClassName,
  returnText,
  valueText,
  status,
}: {
  name: string;
  colorClassName: string;
  returnText: string;
  valueText: string;
  status: MetricStatus;
}) {
  return (
    <div className="min-w-0">
      <p className="flex items-center gap-2 text-sm font-medium">
        <span aria-hidden="true" className={`size-2 rounded-full ${colorClassName}`} />
        {name}
      </p>
      <div className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <p className={`font-mono text-xl font-semibold tabular-nums ${statusColorClass(status)}`}>
          {returnText}
        </p>
        <p className="font-mono text-sm font-medium text-muted-foreground tabular-nums">
          {valueText}
          <span className="ml-1 font-sans text-xs">ending value</span>
        </p>
      </div>
    </div>
  );
}
