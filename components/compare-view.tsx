"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQueries } from "@tanstack/react-query";
import { ArrowLeftIcon, CircleAlertIcon, GitCompareArrowsIcon, XIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { FundSearch } from "@/components/fund-search";
import { SchemeAnalysisChart, type SchemeAnalysisSeries } from "@/components/scheme-analysis-chart";
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
import { fundQueryOptions } from "@/lib/fund-queries";
import type { FundPair, FundResearch, MetricKey, Scheme, WeightedItem } from "@/lib/fund-types";
import { isFundPair } from "@/lib/fund-types";
import { filterSeriesByRange, investmentOutcome, type PerformanceRange } from "@/lib/analytics";
import { type ComparisonRouteState, toComparisonHref } from "@/lib/research-route-state";
import { formatFullDate, formatPercent, formatRupees } from "@/lib/utils";

type MetricRow = readonly [label: string, key: MetricKey];

interface AllocationComparisonProps {
  title: string;
  description: string;
  left: readonly WeightedItem[];
  right: readonly WeightedItem[];
  leftFundName: string;
  rightFundName: string;
}

interface CompareViewProps {
  routeState: ComparisonRouteState;
}

function AllocationComparison({
  title,
  description,
  left,
  right,
  leftFundName,
  rightFundName,
}: AllocationComparisonProps) {
  const names = [...new Set([...left, ...right].map((item) => item.name))];
  if (!names.length) return null;
  const leftWeights = new Map(left.map((item) => [item.name, item.weight]));
  const rightWeights = new Map(right.map((item) => [item.name, item.weight]));
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
              <TableHead>{left.length ? leftFundName : "—"}</TableHead>
              <TableHead>{right.length ? rightFundName : "—"}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {names.map((name) => (
              <TableRow key={name}>
                <TableCell className="font-medium">{name}</TableCell>
                <TableCell className="font-mono">
                  {formatPercent(leftWeights.get(name) ?? null)}
                </TableCell>
                <TableCell className="font-mono">
                  {formatPercent(rightWeights.get(name) ?? null)}
                </TableCell>
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
  leftValue: number | null;
  rightValue: number | null;
}

function PortfolioMetricComparison({
  leftFundName,
  rightFundName,
  leftValue,
  rightValue,
}: PortfolioMetricComparisonProps) {
  if (leftValue === null && rightValue === null) return null;
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
            [leftFundName, leftValue],
            [rightFundName, rightValue],
          ] as const
        ).map(([fundName, value]) => (
          <div key={fundName} className="min-w-0">
            <p className="truncate text-xs text-muted-foreground" title={fundName}>
              {fundName}
            </p>
            <p className="mt-1 font-mono text-2xl font-medium tabular-nums">
              {formatPercent(typeof value === "number" ? value / 100 : null)}
            </p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function CompareView({ routeState }: CompareViewProps) {
  const router = useRouter();
  const [performanceRange, setPerformanceRange] = useState<PerformanceRange>(routeState.range);
  useEffect(() => setPerformanceRange(routeState.range), [routeState]);
  const selectedCodes = routeState.schemeCodes;
  const comparisonQueries = useQueries({
    queries: selectedCodes.map((schemeCode) => ({
      ...fundQueryOptions(schemeCode),
      enabled: true,
    })),
  });

  const comparisonError = comparisonQueries.find((query) => query.isError && !query.data)?.error;
  const message = comparisonError instanceof Error ? comparisonError.message : "";
  const funds = comparisonQueries.flatMap((query) => (query.data ? [query.data] : []));

  function updateSelection(nextCodes: readonly string[], nextRange = performanceRange) {
    router.push(toComparisonHref({ schemeCodes: nextCodes, range: nextRange }));
  }

  function choose(scheme: Scheme) {
    if (selectedCodes.includes(scheme.schemeCode) || selectedCodes.length === 2) return;
    updateSelection([...selectedCodes, scheme.schemeCode]);
  }

  function remove(index: number) {
    updateSelection(selectedCodes.filter((_, selectedIndex) => selectedIndex !== index));
  }

  function updatePerformanceRange(nextRange: PerformanceRange) {
    setPerformanceRange(nextRange);
    updateSelection(selectedCodes, nextRange);
  }

  const selectedFunds = selectedCodes.map((schemeCode) =>
    funds.find((item) => item.scheme.schemeCode === schemeCode),
  );
  const selected = selectedFunds.flatMap((fund) => (fund ? [fund.scheme] : []));
  const displayedFunds: FundPair<FundResearch> | null =
    funds.length === 2 &&
    selectedCodes.length === 2 &&
    funds.every((fund, index) => fund.scheme.schemeCode === selectedCodes[index]) &&
    isFundPair(funds)
      ? funds
      : null;
  const chartSeries: readonly SchemeAnalysisSeries[] = (displayedFunds ?? []).map(
    (fund, index) => ({
      name: fund.scheme.schemeName,
      color: index === 0 ? "foreground" : "chart-3",
      points: fund.nav,
    }),
  );
  const rows = [
    ["1Y return", "oneYear"],
    ["3Y annualized", "threeYear"],
    ["5Y annualized", "fiveYear"],
    ["1Y volatility", "volatility"],
    ["Max drawdown", "maxDrawdown"],
  ] satisfies readonly MetricRow[];
  const leftPortfolio = displayedFunds?.[0].portfolio;
  const rightPortfolio = displayedFunds?.[1].portfolio;
  const portfolios =
    leftPortfolio && rightPortfolio ? { left: leftPortfolio, right: rightPortfolio } : null;
  const historyReady =
    displayedFunds?.every((fund) => fund.availability.navHistory.available) ?? false;
  const unavailableNavFunds = (displayedFunds ?? [])
    .filter((fund) => !fund.availability.navHistory.available)
    .map((fund) => fund.scheme.schemeName);
  const selectedOutcomes = (displayedFunds ?? []).map((fund) =>
    investmentOutcome(filterSeriesByRange(fund.nav, performanceRange)),
  );
  return (
    <main id="main-content" className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
      <Link href="/" className={buttonVariants({ variant: "ghost", size: "sm" })}>
        <ArrowLeftIcon data-icon="inline-start" />
        Search funds
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
        {[0, 1].map((index) => (
          <Card key={index}>
            <CardHeader>
              <CardDescription>Fund {index + 1}</CardDescription>
              <CardTitle>
                {selectedFunds[index]?.scheme.schemeName ??
                  (selectedCodes[index] ? "Loading selected fund…" : "Choose a fund")}
              </CardTitle>
              {selectedFunds[index] ? (
                <p className="text-sm text-muted-foreground">
                  {selectedFunds[index].scheme.amc} · {selectedFunds[index].scheme.category} ·{" "}
                  {selectedFunds[index].scheme.plan} {selectedFunds[index].scheme.option}
                </p>
              ) : null}
            </CardHeader>
            <CardContent>
              {selectedCodes[index] ? (
                <div className="flex items-center justify-between gap-3 text-sm text-muted-foreground">
                  <p>
                    {comparisonQueries[index]?.isError
                      ? "This fund could not be loaded."
                      : selectedFunds[index]?.currentNav
                        ? `Latest NAV ${formatRupees(selectedFunds[index].currentNav.nav)} · ${formatFullDate(selectedFunds[index].currentNav.date)}`
                        : "Latest NAV unavailable."}
                  </p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="ml-auto"
                    onClick={() => remove(index)}
                  >
                    <XIcon data-icon="inline-start" /> Change
                  </Button>
                </div>
              ) : (
                <FundSearch compact onSelect={choose} />
              )}
            </CardContent>
          </Card>
        ))}
      </section>
      {message && (
        <Alert variant="destructive" className="mt-6">
          <CircleAlertIcon />
          <AlertTitle>Comparison unavailable</AlertTitle>
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      )}
      {selected.length === 2 && !displayedFunds && !message && (
        <Card className="mt-6">
          <CardContent className="flex flex-col gap-3 pt-0">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      )}
      {displayedFunds && (
        <>
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Relative performance</CardTitle>
              <CardDescription>
                Each fund’s return from the start of the selected period.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {historyReady ? (
                <>
                  <div className="mb-6 grid gap-3 rounded-lg border bg-muted/20 p-3 sm:grid-cols-2">
                    {displayedFunds.map((fund, index) => (
                      <OutcomeSummary
                        key={fund.scheme.schemeCode}
                        name={fund.scheme.schemeName}
                        colorClassName={index === 0 ? "bg-foreground" : "bg-(--chart-3)"}
                        outcome={selectedOutcomes[index] ?? null}
                      />
                    ))}
                  </div>
                  <SchemeAnalysisChart
                    series={chartSeries}
                    range={performanceRange}
                    onRangeChange={updatePerformanceRange}
                  />
                </>
              ) : (
                <Alert>
                  <CircleAlertIcon />
                  <AlertTitle>NAV comparison unavailable</AlertTitle>
                  <AlertDescription>
                    Historical NAV data is unavailable for {unavailableNavFunds.join(" and ")}, so
                    performance comparison cannot be shown.
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
              {historyReady ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Metric</TableHead>
                      {displayedFunds.map((fund) => (
                        <TableHead key={fund.scheme.schemeCode}>{fund.scheme.schemeName}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map(([label, key]) => (
                      <TableRow key={key}>
                        <TableCell className="font-medium">{label}</TableCell>
                        {displayedFunds.map((fund) => (
                          <TableCell key={fund.scheme.schemeCode} className="font-mono">
                            {formatPercent(fund.metrics[key].value)}
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
                    Historical NAV data is unavailable for {unavailableNavFunds.join(" and ")}, so
                    return and risk measures cannot be compared.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
          <FundFactsComparisonTable funds={displayedFunds} />
          {portfolios ? (
            <section className="mt-6">
              <div className="mb-4">
                <h2 className="text-xl font-semibold tracking-tight">
                  Latest reported portfolio comparison
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {portfolios.left.asOf && portfolios.right.asOf
                    ? `Reported as of ${formatFullDate(portfolios.left.asOf)} and ${formatFullDate(portfolios.right.asOf)}.`
                    : "Portfolio report date unavailable for one or both funds."}
                </p>
              </div>
              <div className="grid gap-4 lg:grid-cols-2">
                <AllocationComparison
                  title="Sector allocation"
                  description="How each reported portfolio is distributed across sectors."
                  left={portfolios.left.sectors}
                  right={portfolios.right.sectors}
                  leftFundName={displayedFunds[0].scheme.schemeName}
                  rightFundName={displayedFunds[1].scheme.schemeName}
                />
                <PortfolioMetricComparison
                  leftFundName={displayedFunds[0].scheme.schemeName}
                  rightFundName={displayedFunds[1].scheme.schemeName}
                  leftValue={portfolios.left.topTenConcentration}
                  rightValue={portfolios.right.topTenConcentration}
                />
                <AllocationComparison
                  title="Asset allocation"
                  description="How each reported portfolio is divided among equity, debt, cash, and other assets."
                  left={portfolios.left.assetAllocation}
                  right={portfolios.right.assetAllocation}
                  leftFundName={displayedFunds[0].scheme.schemeName}
                  rightFundName={displayedFunds[1].scheme.schemeName}
                />
                <AllocationComparison
                  title="Market-cap allocation"
                  description="How each reported equity allocation is spread across large-, mid-, and small-cap companies."
                  left={portfolios.left.marketCapAllocation}
                  right={portfolios.right.marketCapAllocation}
                  leftFundName={displayedFunds[0].scheme.schemeName}
                  rightFundName={displayedFunds[1].scheme.schemeName}
                />
              </div>
            </section>
          ) : (
            <Alert className="mt-6">
              <CircleAlertIcon />
              <AlertTitle>Portfolio comparison unavailable</AlertTitle>
              <AlertDescription>
                A reported portfolio is not available for both funds, so portfolio comparison cannot
                be shown.
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
