import type { FundFacts, FundResearch } from "@/lib/fund-types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatNumber } from "@/lib/utils";

function formatFacts(facts: FundFacts) {
  return [
    ["AUM", facts.aum === null ? "—" : `₹${formatNumber(facts.aum)} Cr`],
    ["Expense ratio", facts.expenseRatio === null ? "—" : `${formatNumber(facts.expenseRatio)}%`],
    [
      "Portfolio turnover",
      facts.portfolioTurnover === null ? "—" : `${formatNumber(facts.portfolioTurnover)}%`,
    ],
  ] as const;
}

export function FundFactsGrid({ facts }: { facts: FundFacts }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Fund facts</CardTitle>
        <CardDescription>
          Key scheme details, including assets, fees, turnover, and stated risk.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {formatFacts(facts).map(([label, value]) => (
          <Fact key={label} label={label} value={value} numeric />
        ))}
        {facts.benchmark ? <Fact label="Benchmark" value={facts.benchmark} /> : null}
        {facts.riskLabel ? <Fact label="Risk" value={facts.riskLabel} /> : null}
        {facts.managers.length ? (
          <Fact label="Fund managers" value={facts.managers.join(", ")} />
        ) : null}
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

export function FundFactsComparisonTable({ funds }: { funds: readonly FundResearch[] }) {
  const rows = [
    ["AUM", (fund: FundResearch) => formatFacts(fund.facts)[0][1]],
    ["Expense ratio", (fund: FundResearch) => formatFacts(fund.facts)[1][1]],
    ["Portfolio turnover", (fund: FundResearch) => formatFacts(fund.facts)[2][1]],
    ["Risk", (fund: FundResearch) => fund.facts.riskLabel ?? "—"],
  ] as const;
  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Fund facts</CardTitle>
        <CardDescription>
          Key scheme details, including assets, fees, turnover, and stated risk.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Metric</TableHead>
              {funds.map((fund) => (
                <TableHead key={fund.scheme.schemeCode}>{fund.scheme.schemeName}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map(([label, getValue]) => (
              <TableRow key={label}>
                <TableCell className="font-medium">{label}</TableCell>
                {funds.map((fund) => (
                  <TableCell key={fund.scheme.schemeCode}>{getValue(fund)}</TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
