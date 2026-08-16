"use client";

import { CircleAlertIcon } from "lucide-react";
import { OutcomeSummary } from "@/components/research/outcome-summary";
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

function ComparisonTable({
  title,
  description,
  rows,
  fundNames,
}: {
  title: string;
  description: string;
  rows: readonly { label: string; values: readonly string[] }[];
  fundNames: readonly [string, string];
}) {
  if (!rows.length) return null;
  return (
    <section>
      <h3 className="text-sm font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      <div className="mt-3 overflow-x-auto">
        <Table className="min-w-[36rem] table-fixed">
          <colgroup>
            <col className="w-1/5" />
            <col className="w-2/5" />
            <col className="w-2/5" />
          </colgroup>
          <TableHeader>
            <TableRow>
              <TableHead className="whitespace-normal">Measure</TableHead>
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
                  <TableCell key={`${row.label}-${fundNames[index]}`} className="font-mono">
                    {value}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </section>
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
          <CardTitle>Performance comparison</CardTitle>
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
          <CardTitle>How they differ</CardTitle>
          <CardDescription>
            Compare risk, costs, scale, and stated scheme characteristics after reviewing the return
            path.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-8">
            {comparison.characteristics.status === "ready" ? (
              <ComparisonTable
                title="Path risk"
                description="Calculated from available NAV history."
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
            <ComparisonTable
              title="Fund facts"
              description="Provider-supplied scheme characteristics."
              rows={comparison.facts}
              fundNames={comparison.fundNames}
            />
          </div>
        </CardContent>
      </Card>
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
