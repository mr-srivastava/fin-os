import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { AllocationDisplay } from "@/lib/research/research-display/fundResearch.types";

export function AllocationBar({
  title,
  description,
  items,
}: {
  title: string;
  description: string;
  items: readonly AllocationDisplay[];
}) {
  if (!items.length) return null;
  const visibleItems = items.filter((item) => item.weight > 0);
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div
          className="flex h-3 overflow-hidden rounded-full bg-muted"
          aria-label={`${title}: ${visibleItems.map((item) => `${item.name} ${item.weightText}`).join(", ")}`}
        >
          {visibleItems.map((item) => {
            return (
              <div
                key={item.name}
                className="min-w-px first:rounded-l-full last:rounded-r-full"
                style={{
                  backgroundColor: item.color,
                  flex: item.weight,
                }}
              />
            );
          })}
        </div>
        <div className="mt-4 flex flex-col gap-2.5">
          {items.map((item) => (
            <div
              key={item.name}
              className="flex items-center justify-between gap-3 text-sm tabular-nums"
            >
              <span className="flex min-w-0 items-center gap-2">
                <span
                  aria-hidden="true"
                  className="size-2 shrink-0 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span className="truncate">{item.name}</span>
              </span>
              <span className="font-mono text-muted-foreground">{item.weightText}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
