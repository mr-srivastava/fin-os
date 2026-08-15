"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeftIcon, CircleAlertIcon, GitCompareArrowsIcon, XIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { FundSearch } from "@/components/fund-search";
import { SchemeAnalysisChart } from "@/components/scheme-analysis-chart";
import { OutcomeSummary } from "@/components/research/outcome-summary";
import { FundFactsComparisonTable } from "@/components/research/fund-facts";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Scheme } from "@/lib/fund-types";
import { type PerformanceRange } from "@/lib/analytics";
import { useComparisonScreenModel } from "@/lib/research-display/use-screen-models";
import type { ComparisonScreenModel } from "@/lib/research-display/types";
import { type ComparisonRouteState, toComparisonHref } from "@/lib/research-route-state";

interface AllocationComparisonProps {
  title: string;
  description: string;
  rows: readonly { name: string; leftText: string; rightText: string }[];
  leftFundName: string;
  rightFundName: string;
}

interface CompareViewProps {
  routeState: ComparisonRouteState;
}

function AllocationComparison({
  title,
  description,
  rows,
  leftFundName,
  rightFundName,
}: AllocationComparisonProps) {
  if (!rows.length) return null;
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Allocation</TableHead>
              <TableHead>{leftFundName}</TableHead>
              <TableHead>{rightFundName}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.name}>
                <TableCell className="font-medium">{row.name}</TableCell>
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

interface PortfolioMetricComparisonProps {
  leftFundName: string;
  rightFundName: string;
  leftValueText: string | null;
  rightValueText: string | null;
}

function PortfolioMetricComparison({
  leftFundName,
  rightFundName,
  leftValueText,
  rightValueText,
}: PortfolioMetricComparisonProps) {
  if (leftValueText === null && rightValueText === null) return null;
  return (
    <Card>
      <CardHeader>
        <CardTitle>Top-10 concentration</CardTitle>
        <CardDescription>
          Share of each reported portfolio held in its ten largest positions.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2">
        {(
          [
            [leftFundName, leftValueText],
            [rightFundName, rightValueText],
          ] as const
        ).map(([fundName, value]) => (
          <div key={fundName} className="min-w-0">
            <p className="truncate text-xs text-muted-foreground" title={fundName}>
              {fundName}
            </p>
            <p className="mt-1 font-mono text-2xl font-medium tabular-nums">{value ?? "—"}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function ComparisonScreen({
  routeState,
  performanceRange,
  screenModel,
  onChoose,
  onRemove,
  onRangeChange,
}: {
  routeState: ComparisonRouteState;
  performanceRange: PerformanceRange;
  screenModel: ComparisonScreenModel;
  onChoose: (scheme: Scheme) => void;
  onRemove: (index: number) => void;
  onRangeChange: (range: PerformanceRange) => void;
}) {
  const selectedCodes = routeState.schemeCodes;

  const comparison = screenModel.comparison.status === "ready" ? screenModel.comparison.data : null;
  return (
    <main id="main-content" className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      <Link href="/" className={buttonVariants({ variant: "ghost", size: "sm" })}>
        <ArrowLeftIcon data-icon="inline-start" />
        Back to research
      </Link>
      <header className="mt-10 max-w-3xl">
        <Badge variant="secondary">Two-fund comparison</Badge>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-5xl">
          Compare the return paths.
        </h1>
        <p className="mt-4 text-sm text-muted-foreground">
          Pick two active Direct Growth equity schemes. Compare performance, fund details, and
          reported portfolio allocations.
        </p>
      </header>
      <section className="mt-8 grid gap-4 md:grid-cols-2" aria-live="polite">
        {([0, 1] as const).map((index) => (
          <Card key={index}>
            <CardHeader>
              <CardDescription>Fund {index + 1}</CardDescription>
              <CardTitle>{screenModel.selections[index].title}</CardTitle>
              {screenModel.selections[index].subtitle ? (
                <p className="text-sm text-muted-foreground">
                  {screenModel.selections[index].subtitle}
                </p>
              ) : null}
            </CardHeader>
            <CardContent>
              {selectedCodes[index] ? (
                <div className="flex items-center justify-between gap-3 text-sm text-muted-foreground">
                  <p>{screenModel.selections[index].navText}</p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="ml-auto"
                    onClick={() => onRemove(index)}
                  >
                    <XIcon data-icon="inline-start" /> Change
                  </Button>
                </div>
              ) : (
                <FundSearch compact onSelect={onChoose} />
              )}
            </CardContent>
          </Card>
        ))}
      </section>
      {screenModel.requestError && (
        <Alert variant="destructive" className="mt-6">
          <CircleAlertIcon />
          <AlertTitle>Comparison unavailable</AlertTitle>
          <AlertDescription>{screenModel.requestError}</AlertDescription>
        </Alert>
      )}
      {screenModel.comparison.status === "loading" && (
        <Card className="mt-6">
          <CardContent className="flex flex-col gap-3 pt-0">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      )}
      {comparison && (
        <>
          <Card className="mt-6">
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
                    range={performanceRange}
                    onRangeChange={onRangeChange}
                  />
                </>
              ) : (
                <Alert>
                  <CircleAlertIcon />
                  <AlertTitle>NAV comparison unavailable</AlertTitle>
                  <AlertDescription>
                    {comparison.performance.status === "unavailable"
                      ? comparison.performance.message
                      : "Performance comparison is unavailable."}
                  </AlertDescription>
                </Alert>
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
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Metric</TableHead>
                      {comparison.fundNames.map((fundName) => (
                        <TableHead key={fundName}>{fundName}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {comparison.characteristics.data.map((row) => (
                      <TableRow key={row.label}>
                        <TableCell className="font-medium">{row.label}</TableCell>
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
                <Alert>
                  <CircleAlertIcon />
                  <AlertTitle>Performance metrics unavailable</AlertTitle>
                  <AlertDescription>
                    {comparison.characteristics.status === "unavailable"
                      ? comparison.characteristics.message
                      : "Performance metrics are unavailable."}
                  </AlertDescription>
                </Alert>
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
                <AllocationComparison
                  title="Sector allocation"
                  description="How each reported portfolio is distributed across sectors."
                  rows={comparison.portfolio.data.sectorAllocation}
                  leftFundName={comparison.fundNames[0]}
                  rightFundName={comparison.fundNames[1]}
                />
                <PortfolioMetricComparison
                  leftFundName={comparison.fundNames[0]}
                  rightFundName={comparison.fundNames[1]}
                  leftValueText={comparison.portfolio.data.concentration[0]}
                  rightValueText={comparison.portfolio.data.concentration[1]}
                />
                <AllocationComparison
                  title="Asset allocation"
                  description="How each reported portfolio is divided among equity, debt, cash, and other assets."
                  rows={comparison.portfolio.data.assetAllocation}
                  leftFundName={comparison.fundNames[0]}
                  rightFundName={comparison.fundNames[1]}
                />
                <AllocationComparison
                  title="Market-cap allocation"
                  description="How each reported equity allocation is spread across large-, mid-, and small-cap companies."
                  rows={comparison.portfolio.data.marketCapAllocation}
                  leftFundName={comparison.fundNames[0]}
                  rightFundName={comparison.fundNames[1]}
                />
              </div>
            </section>
          ) : (
            <Alert className="mt-6">
              <CircleAlertIcon />
              <AlertTitle>Portfolio comparison unavailable</AlertTitle>
              <AlertDescription>
                {comparison.portfolio.status === "unavailable"
                  ? comparison.portfolio.message
                  : "Portfolio comparison is unavailable."}
              </AlertDescription>
            </Alert>
          )}
          <Alert className="mt-6">
            <GitCompareArrowsIcon />
            <AlertTitle>Portfolio overlap is not available</AlertTitle>
            <AlertDescription>
              The reported portfolio data does not include the stable security identifiers and
              normalized security types needed for a trustworthy overlap analysis.
            </AlertDescription>
          </Alert>
        </>
      )}
    </main>
  );
}

export function ComparisonDataProvider({ routeState }: CompareViewProps) {
  const router = useRouter();
  const [performanceRange, setPerformanceRange] = useState<PerformanceRange>(routeState.range);
  useEffect(() => setPerformanceRange(routeState.range), [routeState]);
  const screenModel = useComparisonScreenModel({
    schemeCodes: routeState.schemeCodes,
    range: performanceRange,
  });
  function navigate(schemeCodes: readonly string[], range = performanceRange) {
    router.push(toComparisonHref({ schemeCodes, range }));
  }
  return (
    <ComparisonScreen
      routeState={routeState}
      performanceRange={performanceRange}
      screenModel={screenModel}
      onChoose={(scheme) => {
        if (
          !routeState.schemeCodes.includes(scheme.schemeCode) &&
          routeState.schemeCodes.length < 2
        )
          navigate([...routeState.schemeCodes, scheme.schemeCode]);
      }}
      onRemove={(index) =>
        navigate(routeState.schemeCodes.filter((_, itemIndex) => itemIndex !== index))
      }
      onRangeChange={(range) => {
        setPerformanceRange(range);
        navigate(routeState.schemeCodes, range);
      }}
    />
  );
}

export const CompareView = ComparisonDataProvider;
