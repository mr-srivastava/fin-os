import type { FactDisplay } from "@/lib/research-display/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function FundFactsGrid({ facts }: { facts: readonly FactDisplay[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Fund facts</CardTitle>
        <CardDescription>
          Key scheme details, including assets, fees, turnover, and stated risk.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {facts.map((fact) => (
          <Fact
            key={fact.label}
            label={fact.label}
            value={fact.valueText}
            numeric={fact.numeric ?? false}
          />
        ))}
      </CardContent>
    </Card>
  );
}

function Fact({
  label,
  value,
  numeric = false,
}: {
  label: string;
  value: string;
  numeric?: boolean;
}) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`mt-1 text-sm font-medium ${numeric ? "font-mono" : ""}`}>{value}</p>
    </div>
  );
}
