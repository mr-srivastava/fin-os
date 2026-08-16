"use client";

import { CircleAlertIcon } from "lucide-react";
import { OutcomeSummary } from "@/components/research/outcome-summary";
import { FundFactsComparisonTable } from "@/components/research/fund-facts";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SchemeAnalysisChart } from "@/components/scheme-analysis-chart";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { PerformanceRange } from "@/lib/analytics";
import type { ComparisonReadyDisplay } from "@/lib/research-display/types";

function AllocationTable({
  title,
  rows,
  fundNames,
}: {
  title: string;
  rows: readonly { name: string; leftText: string; rightText: string }[];
  fundNames: readonly [string, string];
}) {
  if (!rows.length) return null;
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
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
              <TableHead className="whitespace-normal">Allocation</TableHead>
              <TableHead className="whitespace-normal break-words">{fundNames[0]}</TableHead>
              <TableHead className="whitespace-normal break-words">{fundNames[1]}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.name}>
                <TableCell className="font-medium whitespace-normal">{row.name}</TableCell>
                <TableCell className="font-mono">{row.leftText}</TableCell>
                <TableCell className="font-mono">{row.rightText}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

export function FundComparison({
  comparison,
  range,
  onRangeChange,
}: {
  comparison: ComparisonReadyDisplay;
  range: PerformanceRange;
  onRangeChange: (range: PerformanceRange) => void;
}) {
  return (
    <>
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Relative performance</CardTitle>
          <CardDescription>
            Each fund’s return from the start of the selected period.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {comparison.performance.status === "ready" ? (
            <>
              <div className="mb-6 grid gap-3 rounded-lg border bg-muted/20 p-3 sm:grid-cols-2">
                {comparison.performance.data.outcomes.map((outcome, index) => (
                  <OutcomeSummary
                    key={outcome.name}
                    name={outcome.name}
                    colorClassName={index === 0 ? "bg-foreground" : "bg-(--chart-3)"}
                    returnText={outcome.returnText}
                    valueText={outcome.valueText}
                    status={outcome.status}
                  />
                ))}
              </div>
              <SchemeAnalysisChart
                series={comparison.performance.data.series}
                range={range}
                onRangeChange={onRangeChange}
              />
            </>
          ) : (
            <Unavailable
              title="NAV comparison unavailable"
              message={
                comparison.performance.status === "unavailable"
                  ? comparison.performance.message
                  : "Performance comparison is unavailable."
              }
            />
          )}
        </CardContent>
      </Card>
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Performance characteristics</CardTitle>
          <CardDescription>
            Return and risk measures calculated from available NAV history.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {comparison.characteristics.status === "ready" ? (
            <Table className="table-fixed">
              <colgroup>
                <col className="w-1/5" />
                <col className="w-2/5" />
                <col className="w-2/5" />
              </colgroup>
              <TableHeader>
                <TableRow>
                  <TableHead className="whitespace-normal">Metric</TableHead>
                  {comparison.fundNames.map((name) => (
                    <TableHead key={name} className="whitespace-normal break-words">
                      {name}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {comparison.characteristics.data.map((row) => (
                  <TableRow key={row.label}>
                    <TableCell className="font-medium whitespace-normal">{row.label}</TableCell>
                    {row.values.map((value) => (
                      <TableCell key={value.label} className="font-mono">
                        {value.valueText}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <Unavailable
              title="Performance metrics unavailable"
              message={
                comparison.characteristics.status === "unavailable"
                  ? comparison.characteristics.message
                  : "Performance metrics are unavailable."
              }
            />
          )}
        </CardContent>
      </Card>
      <FundFactsComparisonTable fundNames={comparison.fundNames} rows={comparison.facts} />
      {comparison.portfolio.status === "ready" ? (
        <section className="mt-6">
          <div className="mb-4">
            <h2 className="text-xl font-semibold tracking-tight">
              Latest reported portfolio comparison
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {comparison.portfolio.data.reportDateText}
            </p>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <AllocationTable
              title="Sector allocation"
              rows={comparison.portfolio.data.sectorAllocation}
              fundNames={comparison.fundNames}
            />
            <AllocationTable
              title="Asset allocation"
              rows={comparison.portfolio.data.assetAllocation}
              fundNames={comparison.fundNames}
            />
            <AllocationTable
              title="Market-cap allocation"
              rows={comparison.portfolio.data.marketCapAllocation}
              fundNames={comparison.fundNames}
            />
          </div>
        </section>
      ) : (
        <div className="mt-6">
          <Unavailable
            title="Portfolio comparison unavailable"
            message={
              comparison.portfolio.status === "unavailable"
                ? comparison.portfolio.message
                : "Portfolio comparison is unavailable."
            }
          />
        </div>
      )}
    </>
  );
}

function Unavailable({ title, message }: { title: string; message: string }) {
  return (
    <Alert>
      <CircleAlertIcon />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
}
