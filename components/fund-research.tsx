"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  AlertCircleIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  CircleHelpIcon,
  DatabaseIcon,
  PieChartIcon,
  TrendingDownIcon,
  TrendingUpIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
import { SchemeAnalysisChart } from "@/components/scheme-analysis-chart";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { filterSeriesByRange, investmentOutcome, type PerformanceRange } from "@/lib/analytics";
import { fundQueryOptions } from "@/lib/fund-queries";
import type { AllocationItem, PortfolioItem } from "@/lib/fund-types";
import {
  formatFullDate,
  formatNumber,
  formatPercent,
  formatRupees,
  formatSignedPercent,
} from "@/lib/utils";

const allocationColors = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];
interface PerformanceRangeOption {
  value: PerformanceRange;
  label: string;
}

type MetricRow = readonly [label: string, value: number | null];

interface AllocationBarProps {
  title: string;
  items: readonly AllocationItem[];
}

interface SectorHoldingsProps {
  holdings: readonly PortfolioItem[];
  sectors: readonly AllocationItem[];
}

interface MetricGroupProps {
  title: string;
  metrics: readonly MetricRow[];
  semantic: "return" | "risk";
}

interface FundResearchViewProps {
  schemeCode: string;
  initialRange?: string;
  initialShowBenchmark?: boolean;
}

const performanceRanges = [
  { value: "6m", label: "6M" },
  { value: "1y", label: "1Y" },
  { value: "3y", label: "3Y" },
  { value: "5y", label: "5Y" },
  { value: "max", label: "Max" },
] satisfies readonly PerformanceRangeOption[];

function AllocationBar({ title, items }: AllocationBarProps) {
  if (!items.length) return null;
  const sortedItems = [...items].sort((left, right) => right.weight - left.weight);
  const visibleItems = sortedItems.filter((item) => item.weight > 0);
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>Latest reported composition</CardDescription>
      </CardHeader>
      <CardContent>
        <div
          className="flex h-3 overflow-hidden rounded-full bg-muted"
          aria-label={`${title}: ${visibleItems.map((item) => `${item.name} ${formatPercent(item.weight)}`).join(", ")}`}
        >
          {visibleItems.map((item, index) => {
            return (
              <div
                key={item.name}
                className="min-w-px first:rounded-l-full last:rounded-r-full"
                style={{
                  backgroundColor: allocationColors[index % allocationColors.length],
                  flex: item.weight,
                }}
              />
            );
          })}
        </div>
        <div className="mt-4 flex flex-col gap-2.5">
          {sortedItems.map((item, index) => (
            <div
              key={item.name}
              className="flex items-center justify-between gap-3 text-sm tabular-nums"
            >
              <span className="flex min-w-0 items-center gap-2">
                <span
                  aria-hidden="true"
                  className="size-2 shrink-0 rounded-full"
                  style={{ backgroundColor: allocationColors[index % allocationColors.length] }}
                />
                <span className="truncate">{item.name}</span>
              </span>
              <span className="font-mono text-muted-foreground">{formatPercent(item.weight)}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function SectorHoldings({ holdings, sectors }: SectorHoldingsProps) {
  const holdingsBySector = new Map<string, PortfolioItem[]>();
  for (const holding of holdings) {
    const sector = holding.sector?.trim() || "Unclassified";
    const sectorHoldings = holdingsBySector.get(sector) ?? [];
    sectorHoldings.push(holding);
    holdingsBySector.set(sector, sectorHoldings);
  }

  const sectorsByName = new Map(sectors.map((sector) => [sector.name, sector]));
  const displayedSectors = [
    ...sectors,
    ...[...holdingsBySector.entries()]
      .filter(([name]) => !sectorsByName.has(name))
      .map(([name, sectorHoldings]) => ({
        name,
        weight: sectorHoldings.reduce((total, holding) => total + holding.weight, 0),
      })),
  ];

  if (!displayedSectors.length) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sector allocation and holdings</CardTitle>
        <CardDescription>Expand a sector to see its reported holdings</CardDescription>
      </CardHeader>
      <CardContent>
        <Accordion className="border-t" multiple>
          {displayedSectors.map((sector) => {
            const sectorHoldings = holdingsBySector.get(sector.name) ?? [];
            return (
              <AccordionItem
                key={sector.name}
                value={sector.name}
                className="border-b last:border-b-0"
              >
                <AccordionTrigger className="items-center gap-3 py-3 hover:no-underline">
                  <span className="min-w-0 flex-1">{sector.name}</span>
                  <span className="font-mono text-muted-foreground">
                    {formatPercent(sector.weight)}
                  </span>
                </AccordionTrigger>
                <AccordionContent className="pb-3">
                  {sectorHoldings.length ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Holding</TableHead>
                          <TableHead className="text-right">Weight</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sectorHoldings.map((holding) => (
                          <TableRow key={`${sector.name}-${holding.name}-${holding.weight}`}>
                            <TableCell className="font-medium">{holding.name}</TableCell>
                            <TableCell className="text-right font-mono">
                              {formatPercent(holding.weight)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <p className="px-3 text-sm text-muted-foreground">
                      No holdings were supplied for this sector.
                    </p>
                  )}
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </CardContent>
    </Card>
  );
}

function MetricGroup({ title, metrics, semantic }: MetricGroupProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent
        className={`grid gap-3 ${metrics.length === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}
      >
        {metrics.map(([label, value]) => {
          const isLoss =
            value !== null && (label === "Max drawdown" || (semantic === "return" && value < 0));
          const isGain = value !== null && semantic === "return" && value > 0;
          const valueClass = isLoss
            ? "text-negative"
            : isGain
              ? "text-positive"
              : "text-foreground";
          const displayValue =
            semantic === "return" || label === "Max drawdown"
              ? formatSignedPercent(value)
              : formatPercent(value);
          return (
            <div key={label} className="min-w-0 rounded-lg bg-muted/35 px-3 py-3">
              <p className="text-xs text-muted-foreground">{label}</p>
              <p
                className={`mt-1 flex items-center gap-1.5 font-mono text-xl font-semibold tabular-nums ${valueClass}`}
              >
                {isGain ? <TrendingUpIcon className="size-4" aria-hidden="true" /> : null}
                {isLoss ? <TrendingDownIcon className="size-4" aria-hidden="true" /> : null}
                {displayValue}
              </p>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

function FundLoading() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <Skeleton className="mb-12 h-5 w-32" />
      <div className="flex flex-col gap-4">
        <Skeleton className="h-5 w-36" />
        <Skeleton className="h-14 w-3/4" />
        <Skeleton className="h-5 w-96 max-w-full" />
        <Skeleton className="mt-8 h-32 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    </main>
  );
}

function isPerformanceRange(value: string | undefined): value is PerformanceRange {
  return performanceRanges.some((range) => range.value === value);
}

export function FundResearchView({
  schemeCode,
  initialRange,
  initialShowBenchmark,
}: FundResearchViewProps) {
  const router = useRouter();
  const fundQuery = useQuery(fundQueryOptions(schemeCode));
  const [performanceRange, setPerformanceRange] = useState<PerformanceRange>(
    isPerformanceRange(initialRange) ? initialRange : "3y",
  );
  const [showBenchmark, setShowBenchmark] = useState(initialShowBenchmark ?? false);

  useEffect(() => {
    setPerformanceRange(isPerformanceRange(initialRange) ? initialRange : "3y");
    setShowBenchmark(initialShowBenchmark ?? false);
  }, [initialRange, initialShowBenchmark]);

  function updateChartState(nextRange: PerformanceRange, nextShowBenchmark: boolean) {
    setPerformanceRange(nextRange);
    setShowBenchmark(nextShowBenchmark);
    const params = new URLSearchParams();
    if (nextRange !== "3y") params.set("range", nextRange);
    if (nextShowBenchmark) params.set("benchmark", "1");
    const query = params.toString();
    router.push(`/fund/${schemeCode}${query ? `?${query}` : ""}`, { scroll: false });
  }

  if (fundQuery.isError && !fundQuery.data)
    return (
      <main className="mx-auto grid min-h-screen max-w-5xl place-items-center px-4 sm:px-6">
        <Empty className="max-w-lg">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <AlertCircleIcon />
            </EmptyMedia>
            <EmptyTitle>Fund unavailable</EmptyTitle>
            <EmptyDescription>{fundQuery.error.message}</EmptyDescription>
          </EmptyHeader>
          <Link href="/" className={buttonVariants({ variant: "outline" })}>
            Search another fund
          </Link>
        </Empty>
      </main>
    );
  if (!fundQuery.data) return <FundLoading />;
  const fund = fundQuery.data;
  const selectedOutcome = investmentOutcome(filterSeriesByRange(fund.nav, performanceRange));
  const selectedBenchmarkOutcome = investmentOutcome(
    filterSeriesByRange(fund.benchmark?.nav ?? [], performanceRange),
  );
  const returns = [
    ["1Y return", fund.metrics.oneYear.value],
    ["3Y annualised", fund.metrics.threeYear.value],
    ["5Y annualised", fund.metrics.fiveYear.value],
  ] satisfies readonly MetricRow[];
  const risks = [
    ["Volatility", fund.metrics.volatility.value],
    ["Max drawdown", fund.metrics.maxDrawdown.value],
  ] satisfies readonly MetricRow[];
  const factCards = [
    ["AUM", fund.facts.aum === null ? "—" : `₹${formatNumber(fund.facts.aum)} Cr`],
    [
      "Expense ratio",
      fund.facts.expenseRatio === null ? "—" : `${formatNumber(fund.facts.expenseRatio)}%`,
    ],
    [
      "Portfolio turnover",
      fund.facts.portfolioTurnover === null
        ? "—"
        : `${formatNumber(fund.facts.portfolioTurnover)}%`,
    ],
  ];
  return (
    <main id="main-content" className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
      <Link href="/" className={buttonVariants({ variant: "ghost", size: "sm" })}>
        <ArrowLeftIcon data-icon="inline-start" />
        Search funds
      </Link>
      <header className="mt-10 max-w-4xl">
        <Badge variant="secondary">Fund research</Badge>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-5xl">
          {fund.scheme.schemeName}
        </h1>
        <p className="mt-4 text-sm text-muted-foreground">
          {fund.scheme.amc} · {fund.scheme.category} · {fund.scheme.plan} {fund.scheme.option}
        </p>
      </header>
      <Card className="mt-8">
        <CardHeader className="gap-6">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
            <div>
              <div className="flex items-center gap-2">
                <CardTitle>Growth of ₹10,000</CardTitle>
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <Button variant="ghost" size="icon-sm" aria-label="About this calculation" />
                    }
                  >
                    <CircleHelpIcon />
                  </TooltipTrigger>
                  <TooltipContent
                    side="bottom"
                    align="start"
                    className="w-64 text-pretty leading-5"
                  >
                    Based on the NAV change over the selected period. Excludes taxes and transaction
                    costs.
                  </TooltipContent>
                </Tooltip>
              </div>
              <CardDescription>If you had invested at the start of this period</CardDescription>
              <p className="mt-2 text-xs font-medium text-muted-foreground">
                Selected period:{" "}
                {performanceRanges.find((range) => range.value === performanceRange)?.label}
                {" total return"}
              </p>
            </div>
            <div className="sm:text-right">
              <p className="text-xs font-medium text-muted-foreground">Latest NAV</p>
              <p className="mt-1 font-mono text-2xl font-semibold tabular-nums">
                {formatRupees(fund.currentNav?.nav ?? null)}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                As of {fund.currentNav?.date ? formatFullDate(fund.currentNav.date) : "—"}
              </p>
            </div>
          </div>
          <div
            className={`grid gap-3 rounded-lg border bg-muted/20 p-3 sm:items-end ${
              showBenchmark && fund.benchmark
                ? "sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]"
                : "sm:grid-cols-[minmax(0,1fr)_auto]"
            }`}
          >
            <div className="min-w-0">
              <div>
                <p className="flex items-center gap-2 text-sm font-medium">
                  <span aria-hidden="true" className="size-2 rounded-full bg-(--chart-1)" />
                  This fund
                </p>
                <div className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <p
                    className={`font-mono text-xl font-semibold tabular-nums ${
                      (selectedOutcome?.returnPercent ?? 0) < 0 ? "text-negative" : "text-positive"
                    }`}
                  >
                    {selectedOutcome ? formatSignedPercent(selectedOutcome.returnPercent) : "—"}
                  </p>
                  <p className="font-mono text-sm font-medium text-muted-foreground tabular-nums">
                    {selectedOutcome ? formatRupees(selectedOutcome.value) : "—"}
                    <span className="ml-1 font-sans text-xs">ending value</span>
                  </p>
                </div>
              </div>
            </div>
            {showBenchmark && fund.benchmark ? (
              <div className="min-w-0 border-t pt-3 sm:border-t-0 sm:border-l sm:pt-0 sm:pl-4">
                <div>
                  <p className="flex items-center gap-2 text-sm font-medium">
                    <span aria-hidden="true" className="size-2 rounded-full bg-(--chart-3)" />
                    {fund.benchmark.name}
                  </p>
                  <div className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <p
                      className={`font-mono text-xl font-semibold tabular-nums ${
                        (selectedBenchmarkOutcome?.returnPercent ?? 0) < 0
                          ? "text-negative"
                          : "text-positive"
                      }`}
                    >
                      {selectedBenchmarkOutcome
                        ? formatSignedPercent(selectedBenchmarkOutcome.returnPercent)
                        : "—"}
                    </p>
                    <p className="font-mono text-sm font-medium text-muted-foreground tabular-nums">
                      {selectedBenchmarkOutcome
                        ? formatRupees(selectedBenchmarkOutcome.value)
                        : "—"}
                      <span className="ml-1 font-sans text-xs">ending value</span>
                    </p>
                  </div>
                </div>
              </div>
            ) : null}
            <Link
              href={`/compare?fund=${schemeCode}`}
              className={buttonVariants({ variant: "outline", size: "default" })}
            >
              Compare this fund <ArrowRightIcon data-icon="inline-end" />
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {fund.availability.navHistory.available ? (
            <SchemeAnalysisChart
              series={[
                { name: "This fund", color: "chart-1", points: fund.nav },
                ...(fund.benchmark
                  ? [
                      {
                        name: fund.benchmark.name,
                        color: "chart-3" as const,
                        points: fund.benchmark.nav,
                      },
                    ]
                  : []),
              ]}
              initialRange={performanceRange}
              onRangeChange={(range) => updateChartState(range, showBenchmark)}
              {...(fund.benchmark
                ? {
                    comparisonToggle: {
                      initialPressed: showBenchmark,
                      label: "benchmark",
                      onPressedChange: (pressed: boolean) =>
                        updateChartState(performanceRange, pressed),
                    },
                  }
                : {})}
            />
          ) : (
            <Alert>
              <DatabaseIcon />
              <AlertTitle>NAV history unavailable</AlertTitle>
              <AlertDescription>
                {fund.availability.navHistory.reason ??
                  "Historical NAV data is unavailable right now."}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
      <section className="mt-4 grid gap-4 lg:grid-cols-[3fr_2fr]">
        <MetricGroup title="Annualised returns" metrics={returns} semantic="return" />
        <MetricGroup title="Risk" metrics={risks} semantic="risk" />
      </section>
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Fund facts</CardTitle>
          <CardDescription>Fund details</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {factCards.map(([label, value]) => (
            <div key={label}>
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="mt-1 font-mono text-sm font-medium">{value}</p>
            </div>
          ))}
          {fund.facts.benchmark && (
            <div>
              <p className="text-xs text-muted-foreground">Benchmark</p>
              <p className="mt-1 text-sm font-medium">{fund.facts.benchmark}</p>
            </div>
          )}
          {fund.facts.riskLabel && (
            <div>
              <p className="text-xs text-muted-foreground">Risk</p>
              <p className="mt-1 text-sm font-medium">{fund.facts.riskLabel}</p>
            </div>
          )}
          {fund.facts.managers.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground">Fund managers</p>
              <p className="mt-1 text-sm font-medium">{fund.facts.managers.join(", ")}</p>
            </div>
          )}
        </CardContent>
      </Card>
      <section className="mt-6">
        <div className="mb-4 flex items-center gap-2">
          <PieChartIcon />
          <h2 className="text-xl font-semibold tracking-tight">Latest reported portfolio</h2>
        </div>
        {fund.portfolio ? (
          <>
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <Badge variant="outline">Reported portfolio</Badge>
              <p className="text-sm text-muted-foreground">
                {fund.portfolio.asOf
                  ? `Portfolio as of ${formatFullDate(fund.portfolio.asOf)}`
                  : "Portfolio report date unavailable."}
              </p>
            </div>
            <SectorHoldings holdings={fund.portfolio.holdings} sectors={fund.portfolio.sectors} />
            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              <AllocationBar title="Asset allocation" items={fund.portfolio.assetAllocation} />
              <AllocationBar
                title="Market-cap allocation"
                items={fund.portfolio.marketCapAllocation}
              />
              {fund.portfolio.topTenConcentration !== null && (
                <Card>
                  <CardHeader>
                    <CardTitle>Top-10 concentration</CardTitle>
                    <CardDescription>Reported portfolio concentration</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="font-mono text-2xl font-medium">
                      {formatPercent(fund.portfolio.topTenConcentration / 100)}
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </>
        ) : (
          <Alert>
            <PieChartIcon />
            <AlertTitle>Latest portfolio unavailable</AlertTitle>
            <AlertDescription>
              {!fund.availability.portfolio.available
                ? fund.availability.portfolio.reason
                : "Portfolio data is unavailable right now."}
            </AlertDescription>
          </Alert>
        )}
      </section>
    </main>
  );
}
