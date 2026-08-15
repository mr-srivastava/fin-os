"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQueries } from "@tanstack/react-query";
import { ArrowLeftIcon, CircleAlertIcon, GitCompareArrowsIcon, XIcon } from "lucide-react";
import { FundSearch } from "@/components/fund-search";
import { SchemeAnalysisChart, type SchemeAnalysisSeries } from "@/components/scheme-analysis-chart";
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
import { isSchemeCode } from "@/lib/fund-input";
import type { FundPair, FundResearch, MetricKey, Scheme, WeightedItem } from "@/lib/fund-types";
import { isFundPair } from "@/lib/fund-types";
import { formatNumber, formatPercent } from "@/lib/utils";

type MetricRow = readonly [label: string, key: MetricKey];
type DisplayRow = readonly [label: string, value: (fund: FundResearch) => string];

interface AllocationComparisonProps {
  title: string;
  left: readonly WeightedItem[];
  right: readonly WeightedItem[];
}

interface CompareViewProps {
  initialFund?: string;
  initialAgainst?: string;
}

const factRows = [
  [
    "AUM",
    (fund: FundResearch) => (fund.facts.aum === null ? "—" : `₹${formatNumber(fund.facts.aum)} Cr`),
  ],
  ["Expense ratio", (fund: FundResearch) => formatNumber(fund.facts.expenseRatio, "%")],
  ["Portfolio turnover", (fund: FundResearch) => formatNumber(fund.facts.portfolioTurnover, "%")],
  ["Risk", (fund: FundResearch) => fund.facts.riskLabel ?? "—"],
] satisfies readonly DisplayRow[];

function AllocationComparison({ title, left, right }: AllocationComparisonProps) {
  const names = [...new Set([...left, ...right].map((item) => item.name))];
  if (!names.length) return null;
  const leftWeights = new Map(left.map((item) => [item.name, item.weight]));
  const rightWeights = new Map(right.map((item) => [item.name, item.weight]));
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Allocation</TableHead>
              <TableHead>{left.length ? "Fund 1" : "—"}</TableHead>
              <TableHead>{right.length ? "Fund 2" : "—"}</TableHead>
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

export function CompareView({ initialFund, initialAgainst }: CompareViewProps) {
  const router = useRouter();
  const selectedCodes = [initialFund, initialAgainst].filter((schemeCode): schemeCode is string =>
    Boolean(schemeCode && isSchemeCode(schemeCode)),
  );
  const comparisonQueries = useQueries({
    queries: selectedCodes.map((schemeCode) => ({
      ...fundQueryOptions(schemeCode),
      enabled: true,
    })),
  });

  const comparisonError = comparisonQueries.find((query) => query.isError && !query.data)?.error;
  const message = comparisonError instanceof Error ? comparisonError.message : "";
  const funds = comparisonQueries.flatMap((query) => (query.data ? [query.data] : []));

  function choose(scheme: Scheme) {
    if (selectedCodes.includes(scheme.schemeCode) || selectedCodes.length === 2) return;
    const nextCodes = [...selectedCodes, scheme.schemeCode];
    router.push(`/compare?fund=${nextCodes[0]}${nextCodes[1] ? `&against=${nextCodes[1]}` : ""}`);
  }

  function remove(index: number) {
    const nextCodes = selectedCodes.filter((_, selectedIndex) => selectedIndex !== index);
    router.push(nextCodes.length ? `/compare?fund=${nextCodes[0]}` : "/compare");
  }

  const selected = selectedCodes.flatMap((schemeCode) => {
    const fund = funds.find((item) => item.scheme.schemeCode === schemeCode);
    return fund ? [fund.scheme] : [];
  });
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
    ["1Y annualized", "oneYear"],
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
                {selected[index]?.schemeName ??
                  (selectedCodes[index] ? "Loading selected fund…" : "Choose a fund")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedCodes[index] ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  {comparisonQueries[index]?.isError
                    ? "This fund could not be loaded."
                    : "Selected"}
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
              <CardDescription>Total return over the selected period</CardDescription>
            </CardHeader>
            <CardContent>
              {historyReady ? (
                <SchemeAnalysisChart series={chartSeries} />
              ) : (
                <Alert>
                  <CircleAlertIcon />
                  <AlertTitle>NAV comparison unavailable</AlertTitle>
                  <AlertDescription>
                    Historical NAV data is unavailable for one or both funds, so performance
                    comparison cannot be shown.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Performance characteristics</CardTitle>
              <CardDescription>Calculated from NAV history</CardDescription>
            </CardHeader>
            <CardContent>
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
            </CardContent>
          </Card>
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Fund facts</CardTitle>
              <CardDescription>Fund details</CardDescription>
            </CardHeader>
            <CardContent>
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
                  {factRows.map(([label, value]) => (
                    <TableRow key={label}>
                      <TableCell className="font-medium">{label}</TableCell>
                      {displayedFunds.map((fund) => (
                        <TableCell key={fund.scheme.schemeCode}>{value(fund)}</TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          {portfolios ? (
            <section className="mt-6">
              <div className="mb-4">
                <h2 className="text-xl font-semibold tracking-tight">
                  Latest reported portfolio comparison
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {portfolios.left.asOf && portfolios.right.asOf
                    ? `Portfolio disclosure dates: ${portfolios.left.asOf} and ${portfolios.right.asOf}`
                    : "Portfolio report date unavailable for one or both funds."}
                </p>
              </div>
              <div className="grid gap-4 lg:grid-cols-2">
                <AllocationComparison
                  title="Sector allocation"
                  left={portfolios.left.sectors}
                  right={portfolios.right.sectors}
                />
                <AllocationComparison
                  title="Asset allocation"
                  left={portfolios.left.assetAllocation}
                  right={portfolios.right.assetAllocation}
                />
                <AllocationComparison
                  title="Market-cap allocation"
                  left={portfolios.left.marketCapAllocation}
                  right={portfolios.right.marketCapAllocation}
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
