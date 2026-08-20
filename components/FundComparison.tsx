"use client";

import { CircleAlertIcon } from "lucide-react";
import { ComparisonAllocationBars } from "@/components/research/ComparisonAllocationBars";
import { ComparisonMetricList } from "@/components/research/ComparisonMetricList";
import { ComparisonSummary } from "@/components/research/PerformanceSummary";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SchemeAnalysisChart } from "@/components/SchemeAnalysisChart";
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
        <div className="overflow-x-auto">
          <Table className="min-w-[28rem] table-fixed">
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
        </div>
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
      <div className="mt-8 grid gap-6 lg:grid-cols-[2fr_1fr] lg:items-stretch">
        <Card className="lg:row-span-2 lg:flex lg:flex-col">
          <CardHeader>
            <CardTitle>Performance comparison</CardTitle>
            <CardDescription>
              Each fund’s return from the start of the selected period.
            </CardDescription>
          </CardHeader>
          <CardContent className="lg:flex-1">
            {comparison.performance.status === "ready" ? (
              <>
                <ComparisonSummary outcomes={comparison.performance.data.outcomes} />
                <div className="mt-4">
                  <SchemeAnalysisChart
                    series={comparison.performance.data.series}
                    range={range}
                    onRangeChange={onRangeChange}
                    chartClassName="min-h-64 w-full lg:h-full lg:min-h-96"
                  />
                </div>
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
        <Card className="h-full">
          <CardHeader>
            <CardTitle>Path risk</CardTitle>
            <CardDescription>Calculated from available NAV history.</CardDescription>
          </CardHeader>
          <CardContent>
            {comparison.characteristics.status === "ready" ? (
              <ComparisonMetricList
                rows={comparison.characteristics.data.map((row) => ({
                  label: row.label,
                  values: row.values.map((value) => value.valueText),
                }))}
                fundNames={comparison.fundNames}
              />
            ) : (
              <Unavailable
                title="Risk measures unavailable"
                message={
                  comparison.characteristics.status === "unavailable"
                    ? comparison.characteristics.message
                    : "Risk measures are unavailable."
                }
              />
            )}
          </CardContent>
        </Card>
        <Card className="h-full">
          <CardHeader>
            <CardTitle>Fund facts</CardTitle>
            <CardDescription>Provider-supplied scheme characteristics.</CardDescription>
          </CardHeader>
          <CardContent>
            <ComparisonMetricList rows={comparison.facts} fundNames={comparison.fundNames} />
          </CardContent>
        </Card>
      </div>
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
            <ComparisonAllocationBars
              title="Asset allocation"
              description="How each reported portfolio is divided among equity, debt, cash, and other assets."
              items={comparison.portfolio.data.assetAllocation}
              fundNames={comparison.fundNames}
            />
            <ComparisonAllocationBars
              title="Market-cap allocation"
              description="How each reported equity allocation is spread across large-, mid-, and small-cap companies."
              items={comparison.portfolio.data.marketCapAllocation}
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
