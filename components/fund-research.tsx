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
} from "lucide-react";
import { useEffect, useState } from "react";
import { SchemeAnalysisChart } from "@/components/scheme-analysis-chart";
import { MetricCardGroup, type MetricCardValue } from "@/components/research/metric-card-group";
import { FundFactsGrid } from "@/components/research/fund-facts";
import { OutcomeSummary } from "@/components/research/outcome-summary";
import { PortfolioConcentrationCard } from "@/components/research/portfolio-concentration";
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
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { type PerformanceRange } from "@/lib/analytics";
import { fundQueryOptions } from "@/lib/fund-queries";
import type { AllocationItem, FundResearch, PortfolioItem } from "@/lib/fund-types";
import type { AllocationDisplay } from "@/lib/research-display/types";
import { type FundResearchRouteState, toFundResearchHref } from "@/lib/research-route-state";
import { formatFullDate, formatPercent, formatSignedPercent } from "@/lib/utils";
import {
  toAllocationDisplay,
  toFundFactsDisplay,
  toPercentagePointsText,
  toPerformanceDisplay,
} from "@/lib/research-display/fund-research";

interface AllocationBarProps {
  title: string;
  description: string;
  items: readonly AllocationDisplay[];
}

interface SectorHoldingsProps {
  holdings: readonly PortfolioItem[];
  sectors: readonly AllocationItem[];
}

interface FundResearchViewProps {
  schemeCode: string;
  routeState: FundResearchRouteState;
}

function AllocationBar({ title, description, items }: AllocationBarProps) {
  if (!items.length) return null;
  const visibleItems = items.filter((item) => item.weight > 0);
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div
          className="flex h-3 overflow-hidden rounded-full bg-muted"
          aria-label={`${title}: ${visibleItems.map((item) => `${item.name} ${item.weightText}`).join(", ")}`}
        >
          {visibleItems.map((item) => {
            return (
              <div
                key={item.name}
                className="min-w-px first:rounded-l-full last:rounded-r-full"
                style={{
                  backgroundColor: item.color,
                  flex: item.weight,
                }}
              />
            );
          })}
        </div>
        <div className="mt-4 flex flex-col gap-2.5">
          {items.map((item) => (
            <div
              key={item.name}
              className="flex items-center justify-between gap-3 text-sm tabular-nums"
            >
              <span className="flex min-w-0 items-center gap-2">
                <span
                  aria-hidden="true"
                  className="size-2 shrink-0 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span className="truncate">{item.name}</span>
              </span>
              <span className="font-mono text-muted-foreground">{item.weightText}</span>
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
        <CardDescription>
          Largest reported sector exposures, with the holdings within each sector.
        </CardDescription>
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

export function FundResearchDataProvider({ schemeCode, routeState }: FundResearchViewProps) {
  const router = useRouter();
  const fundQuery = useQuery(fundQueryOptions(schemeCode));
  const [performanceRange, setPerformanceRange] = useState<PerformanceRange>(routeState.range);
  const [showBenchmark, setShowBenchmark] = useState(routeState.showBenchmark);

  useEffect(() => {
    setPerformanceRange(routeState.range);
    setShowBenchmark(routeState.showBenchmark);
  }, [routeState]);

  function updateChartState(nextRange: PerformanceRange, nextShowBenchmark: boolean) {
    setPerformanceRange(nextRange);
    setShowBenchmark(nextShowBenchmark);
    router.push(
      toFundResearchHref(schemeCode, { range: nextRange, showBenchmark: nextShowBenchmark }),
      { scroll: false },
    );
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
  return (
    <FundResearchScreen
      schemeCode={schemeCode}
      fund={fundQuery.data}
      performanceRange={performanceRange}
      showBenchmark={showBenchmark}
      onChartState={updateChartState}
    />
  );
}

export const FundResearchView = FundResearchDataProvider;

function FundResearchScreen({
  schemeCode,
  fund,
  performanceRange,
  showBenchmark,
  onChartState,
}: {
  schemeCode: string;
  fund: FundResearch;
  performanceRange: PerformanceRange;
  showBenchmark: boolean;
  onChartState: (range: PerformanceRange, showBenchmark: boolean) => void;
}) {
  const performance = toPerformanceDisplay(fund, performanceRange, showBenchmark);
  const returns = [
    {
      label: "1Y return",
      valueText: formatSignedPercent(fund.metrics.oneYear.value),
      status:
        fund.metrics.oneYear.value === null
          ? "neutral"
          : fund.metrics.oneYear.value > 0
            ? "gain"
            : fund.metrics.oneYear.value < 0
              ? "loss"
              : "neutral",
    },
    {
      label: "3Y annualised",
      valueText: formatSignedPercent(fund.metrics.threeYear.value),
      status:
        fund.metrics.threeYear.value === null
          ? "neutral"
          : fund.metrics.threeYear.value > 0
            ? "gain"
            : fund.metrics.threeYear.value < 0
              ? "loss"
              : "neutral",
    },
    {
      label: "5Y annualised",
      valueText: formatSignedPercent(fund.metrics.fiveYear.value),
      status:
        fund.metrics.fiveYear.value === null
          ? "neutral"
          : fund.metrics.fiveYear.value > 0
            ? "gain"
            : fund.metrics.fiveYear.value < 0
              ? "loss"
              : "neutral",
    },
  ] satisfies readonly MetricCardValue[];
  const risks = [
    {
      label: "Volatility",
      valueText: formatPercent(fund.metrics.volatility.value),
      status: "neutral",
    },
    {
      label: "Max drawdown",
      valueText: formatSignedPercent(fund.metrics.maxDrawdown.value),
      status: "neutral",
    },
  ] satisfies readonly MetricCardValue[];
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
                Selected period: {performance.periodLabel}
                {" total return"}
              </p>
            </div>
            <div className="sm:text-right">
              <p className="text-xs font-medium text-muted-foreground">Latest NAV</p>
              <p className="mt-1 font-mono text-2xl font-semibold tabular-nums">
                {performance.latestNavText}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                As of {performance.latestNavDateText}
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
            <OutcomeSummary
              name="This fund"
              colorClassName="bg-(--chart-1)"
              returnText={performance.outcomes[0]?.returnText ?? "—"}
              valueText={performance.outcomes[0]?.valueText ?? "—"}
              status={performance.outcomes[0]?.status ?? "neutral"}
            />
            {showBenchmark && fund.benchmark ? (
              <div className="border-t pt-3 sm:border-t-0 sm:border-l sm:pt-0 sm:pl-4">
                <OutcomeSummary
                  name={fund.benchmark.name}
                  colorClassName="bg-(--chart-3)"
                  returnText={performance.outcomes[1]?.returnText ?? "—"}
                  valueText={performance.outcomes[1]?.valueText ?? "—"}
                  status={performance.outcomes[1]?.status ?? "neutral"}
                />
              </div>
            ) : null}
            <div className="flex flex-wrap items-center gap-3">
              {fund.benchmark ? (
                <div className="flex items-center gap-2">
                  <Switch
                    id={`show-benchmark-${schemeCode}`}
                    checked={showBenchmark}
                    onCheckedChange={(checked) => onChartState(performanceRange, checked)}
                  />
                  <label
                    htmlFor={`show-benchmark-${schemeCode}`}
                    className="text-sm font-medium leading-none"
                  >
                    Show benchmark
                  </label>
                </div>
              ) : null}
              <Link
                href={`/compare?fund=${schemeCode}`}
                className={buttonVariants({ variant: "outline", size: "default" })}
              >
                Compare this fund <ArrowRightIcon data-icon="inline-end" />
              </Link>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {fund.availability.navHistory.available ? (
            <SchemeAnalysisChart
              series={performance.series}
              range={performanceRange}
              onRangeChange={(range) => onChartState(range, showBenchmark)}
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
        <MetricCardGroup title="Annualised returns" metrics={returns} />
        <MetricCardGroup title="Risk" metrics={risks} />
      </section>
      <div className="mt-6">
        <FundFactsGrid facts={toFundFactsDisplay(fund)} />
      </div>
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
              <AllocationBar
                title="Asset allocation"
                description="How the reported portfolio is divided among equity, debt, cash, and other assets."
                items={toAllocationDisplay(fund.portfolio.assetAllocation)}
              />
              <AllocationBar
                title="Market-cap allocation"
                description="How the reported equity allocation is spread across large-, mid-, and small-cap companies."
                items={toAllocationDisplay(fund.portfolio.marketCapAllocation)}
              />
              {fund.portfolio.topTenConcentration !== null && (
                <PortfolioConcentrationCard
                  valueText={toPercentagePointsText(fund.portfolio.topTenConcentration)}
                />
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
