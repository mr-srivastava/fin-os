import { TermHelp } from "@/components/TermHelp";
import { TERM_DEFINITIONS } from "@/lib/glossary";

export function ComparisonMetricList({
  rows,
  fundNames,
}: {
  rows: readonly { label: string; values: readonly string[] }[];
  fundNames: readonly [string, string];
}) {
  if (!rows.length) return null;
  return (
    <div>
      <div className="mb-4 flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex min-w-0 items-center gap-1.5">
          <span aria-hidden="true" className="size-2 shrink-0 rounded-full bg-foreground" />
          <span className="truncate" title={fundNames[0]}>
            {fundNames[0]}
          </span>
        </span>
        <span className="flex min-w-0 items-center gap-1.5">
          <span aria-hidden="true" className="size-2 shrink-0 rounded-full bg-(--chart-3)" />
          <span className="truncate" title={fundNames[1]}>
            {fundNames[1]}
          </span>
        </span>
      </div>
      <div className="divide-y divide-border/60">
        {rows.map((row) => (
          <div key={row.label} className="py-3 first:pt-0 last:pb-0">
            <p className="text-xs text-muted-foreground">
              {TERM_DEFINITIONS[row.label as keyof typeof TERM_DEFINITIONS] ? (
                <TermHelp definition={TERM_DEFINITIONS[row.label as keyof typeof TERM_DEFINITIONS]}>
                  {row.label}
                </TermHelp>
              ) : (
                row.label
              )}
            </p>
            <div className="mt-1 grid grid-cols-2 gap-3">
              <p className="font-mono text-base font-semibold tabular-nums">
                {row.values[0] ?? "—"}
              </p>
              <p className="font-mono text-base font-semibold tabular-nums">
                {row.values[1] ?? "—"}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
