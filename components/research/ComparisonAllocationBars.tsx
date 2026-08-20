import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { ComparisonAllocationItem } from "@/lib/research/research-display/types";

function Bar({
  label,
  items,
  weightOf,
}: {
  label: string;
  items: readonly ComparisonAllocationItem[];
  weightOf: (item: ComparisonAllocationItem) => number | null;
}) {
  const visible = items.filter((item) => (weightOf(item) ?? 0) > 0);
  return (
    <div>
      <p className="truncate text-xs text-muted-foreground" title={label}>
        {label}
      </p>
      <div
        className="mt-1.5 flex h-3 overflow-hidden rounded-full bg-muted"
        aria-label={`${label}: ${visible
          .map((item) => `${item.name} ${weightOf(item)}`)
          .join(", ")}`}
      >
        {visible.map((item) => (
          <div
            key={item.name}
            className="min-w-px first:rounded-l-full last:rounded-r-full"
            style={{ backgroundColor: item.color, flex: weightOf(item) ?? 0 }}
          />
        ))}
      </div>
    </div>
  );
}

export function ComparisonAllocationBars({
  title,
  description,
  items,
  fundNames,
}: {
  title: string;
  description: string;
  items: readonly ComparisonAllocationItem[];
  fundNames: readonly [string, string];
}) {
  if (!items.length) return null;
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3">
          <Bar label={fundNames[0]} items={items} weightOf={(item) => item.leftWeight} />
          <Bar label={fundNames[1]} items={items} weightOf={(item) => item.rightWeight} />
        </div>
        <div className="mt-4 flex flex-col gap-2.5">
          {items.map((item) => (
            <div key={item.name} className="flex items-center gap-3 text-sm">
              <span className="flex min-w-0 flex-1 items-center gap-2">
                <span
                  aria-hidden="true"
                  className="size-2 shrink-0 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span className="truncate">{item.name}</span>
              </span>
              <span className="w-14 shrink-0 text-right font-mono tabular-nums text-muted-foreground">
                {item.leftText}
              </span>
              <span className="w-14 shrink-0 text-right font-mono tabular-nums text-muted-foreground">
                {item.rightText}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
