import type { FactDisplay } from "@/lib/research/research-display/fundResearch.types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TermHelp } from "@/components/TermHelp";
import { TERM_DEFINITIONS, riskLabelDefinition } from "@/lib/shared/glossary";

const COMPACT_LABELS = ["AUM", "Expense ratio", "Portfolio turnover", "Risk"];
const WIDE_LABELS = ["Benchmark", "Fund managers"];

function definitionFor(fact: FactDisplay): string | null {
  if (fact.label === "Risk") return riskLabelDefinition(fact.valueText);
  return TERM_DEFINITIONS[fact.label as keyof typeof TERM_DEFINITIONS] ?? null;
}

export function FundFactsGrid({ facts }: { facts: readonly FactDisplay[] }) {
  const byLabel = new Map(facts.map((fact) => [fact.label, fact]));
  const compact = COMPACT_LABELS.map((label) => byLabel.get(label)).filter(
    Boolean,
  ) as FactDisplay[];
  const wide = WIDE_LABELS.map((label) => byLabel.get(label)).filter(Boolean) as FactDisplay[];
  const rest = facts.filter(
    (fact) => !COMPACT_LABELS.includes(fact.label) && !WIDE_LABELS.includes(fact.label),
  );

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Fund overview</CardTitle>
        <CardDescription>
          Key scheme details, including assets, fees, turnover, and benchmark.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        {compact.length || rest.length ? (
          <div className="grid grid-cols-2 gap-x-4 gap-y-4">
            {compact.map((fact) => (
              <Fact
                key={fact.label}
                label={fact.label}
                value={fact.valueText}
                numeric={fact.numeric ?? false}
                definition={definitionFor(fact)}
              />
            ))}
            {rest.map((fact) => (
              <Fact
                key={fact.label}
                label={fact.label}
                value={fact.valueText}
                numeric={fact.numeric ?? false}
                definition={definitionFor(fact)}
              />
            ))}
          </div>
        ) : null}
        {wide.map((fact) => (
          <div key={fact.label}>
            <p className="text-xs text-muted-foreground">
              {definitionFor(fact) ? (
                <TermHelp definition={definitionFor(fact)!}>{fact.label}</TermHelp>
              ) : (
                fact.label
              )}
            </p>
            <p className="mt-1 text-sm font-semibold">{fact.valueText}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function Fact({
  label,
  value,
  numeric = false,
  definition,
}: {
  label: string;
  value: string;
  numeric?: boolean;
  definition?: string | null;
}) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">
        {definition ? <TermHelp definition={definition}>{label}</TermHelp> : label}
      </p>
      <p className={`mt-1 text-lg font-semibold ${numeric ? "font-mono tabular-nums" : ""}`}>
        {value}
      </p>
    </div>
  );
}
