import type { FactDisplay } from "@/lib/research-display/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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

export function FundFactsComparisonTable({
  rows,
  fundNames,
}: {
  rows: readonly { label: string; values: readonly string[] }[];
  fundNames: readonly string[];
}) {
  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Fund facts</CardTitle>
        <CardDescription>
          Key scheme details, including assets, fees, turnover, and stated risk.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table className="table-fixed">
          <colgroup>
            <col className="w-1/5" />
            <col className="w-2/5" />
            <col className="w-2/5" />
          </colgroup>
          <TableHeader>
            <TableRow>
              <TableHead className="whitespace-normal">Metric</TableHead>
              {fundNames.map((name) => (
                <TableHead key={name} className="whitespace-normal break-words">
                  {name}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.label}>
                <TableCell className="font-medium whitespace-normal">{row.label}</TableCell>
                {row.values.map((value, index) => (
                  <TableCell key={`${row.label}-${fundNames[index]}`} className="whitespace-normal">
                    {value}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
