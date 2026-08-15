"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircleIcon,
  ArrowLeftIcon,
  CircleHelpIcon,
  DatabaseIcon,
  GitCompareArrowsIcon,
  PieChartIcon,
  XIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
import { SchemeAnalysisChart } from "@/components/scheme-analysis-chart";
import { FundComparison } from "@/components/fund-comparison";
import { FundSearch } from "@/components/fund-search";
import { MetricCardGroup } from "@/components/research/metric-card-group";
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
import type {
  AllocationDisplay,
  FundResearchReadyModel,
  SectorDisplay,
} from "@/lib/research-display/types";
import {
  useComparisonScreenModel,
  useFundResearchScreenModel,
} from "@/lib/research-display/use-screen-models";
import { type FundResearchRouteState, toFundResearchHref } from "@/lib/research-route-state";

interface AllocationBarProps {
  title: string;
  description: string;
  items: readonly AllocationDisplay[];
}

interface SectorHoldingsProps {
  sectors: readonly SectorDisplay[];
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

function SectorHoldings({ sectors }: SectorHoldingsProps) {
  if (!sectors.length) return null;

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
          {sectors.map((sector) => {
            return (
              <AccordionItem
                key={sector.name}
                value={sector.name}
                className="border-b last:border-b-0"
              >
                <AccordionTrigger className="items-center gap-3 py-3 hover:no-underline">
                  <span className="min-w-0 flex-1">{sector.name}</span>
                  <span className="font-mono text-muted-foreground">{sector.weightText}</span>
                </AccordionTrigger>
                <AccordionContent className="pb-3">
                  {sector.holdings.length ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Holding</TableHead>
                          <TableHead className="text-right">Weight</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sector.holdings.map((holding) => (
                          <TableRow key={`${sector.name}-${holding.name}-${holding.weightText}`}>
                            <TableCell className="font-medium">{holding.name}</TableCell>
                            <TableCell className="text-right font-mono">
                              {holding.weightText}
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
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
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
      toFundResearchHref(schemeCode, {
        range: nextRange,
        showBenchmark: nextShowBenchmark,
        against: routeState.against,
      }),
      { scroll: false },
    );
  }

  const screenModel = useFundResearchScreenModel({
    schemeCode,
    range: performanceRange,
    showBenchmark,
  });
  const comparisonModel = useComparisonScreenModel({
    schemeCodes: routeState.against ? [schemeCode, routeState.against] : [],
    range: performanceRange,
  });
  function updateComparison(against: string | null, range = performanceRange) {
    router.push(toFundResearchHref(schemeCode, { range, showBenchmark, against }), {
      scroll: false,
    });
  }
  if (screenModel.status === "error")
    return (
      <main className="mx-auto grid min-h-screen max-w-6xl place-items-center px-4 sm:px-6">
        <Empty className="max-w-lg">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <AlertCircleIcon />
            </EmptyMedia>
            <EmptyTitle>Fund unavailable</EmptyTitle>
            <EmptyDescription>{screenModel.message}</EmptyDescription>
          </EmptyHeader>
          <Link href="/" className={buttonVariants({ variant: "outline" })}>
            Search another fund
          </Link>
        </Empty>
      </main>
    );
  if (screenModel.status === "loading") return <FundLoading />;
  return (
    <FundResearchScreen
      schemeCode={schemeCode}
      model={screenModel.data}
      performanceRange={performanceRange}
      showBenchmark={showBenchmark}
      onChartState={updateChartState}
      comparisonModel={comparisonModel}
      comparisonSchemeCode={routeState.against}
      onComparisonChange={updateComparison}
    />
  );
}

export const FundResearchView = FundResearchDataProvider;

function FundResearchScreen({
  schemeCode,
  model,
  performanceRange,
  showBenchmark,
  onChartState,
  comparisonModel,
  comparisonSchemeCode,
  onComparisonChange,
}: {
  schemeCode: string;
  model: FundResearchReadyModel;
  performanceRange: PerformanceRange;
  showBenchmark: boolean;
  onChartState: (range: PerformanceRange, showBenchmark: boolean) => void;
  comparisonModel: ReturnType<typeof useComparisonScreenModel>;
  comparisonSchemeCode: string | null;
  onComparisonChange: (against: string | null, range?: PerformanceRange) => void;
}) {
  const performance = model.performance.status === "ready" ? model.performance.data : null;
  const comparison =
    comparisonModel.comparison.status === "ready" ? comparisonModel.comparison.data : null;
  const isComparing = comparisonSchemeCode !== null;
  return (
    <main id="main-content" className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      <Link href="/" className={buttonVariants({ variant: "ghost", size: "sm" })}>
        <ArrowLeftIcon data-icon="inline-start" />
        Back to research
      </Link>
      <header className="mt-10 max-w-4xl">
        <Badge variant="secondary">{isComparing ? "Fund comparison" : "Fund research"}</Badge>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-5xl">
          {model.header.title}
        </h1>
        <p className="mt-4 text-sm text-muted-foreground">{model.header.subtitle}</p>
      </header>
      <section
        id="comparison-controls"
        className="mt-8 rounded-xl border bg-card p-4 shadow-sm sm:p-5"
        aria-live="polite"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Comparison set
            </p>
            <h2 className="mt-1 text-lg font-semibold tracking-tight">
              {isComparing ? "Two funds, one research view" : "Add context to this fund"}
            </h2>
          </div>
          {isComparing ? (
            <Button variant="ghost" size="sm" onClick={() => onComparisonChange(null)}>
              <XIcon data-icon="inline-start" /> Remove
            </Button>
          ) : null}
        </div>
        <div className="mt-4 grid items-stretch gap-3 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
          <div className="rounded-lg border bg-muted/20 p-3">
            <p className="text-xs font-medium text-muted-foreground">Primary fund</p>
            <p className="mt-1 truncate font-medium">{model.header.title}</p>
            <p className="mt-1 truncate text-xs text-muted-foreground">{model.header.subtitle}</p>
          </div>
          <div className="grid place-items-center text-muted-foreground" aria-hidden="true">
            <GitCompareArrowsIcon className="size-5" />
          </div>
          {isComparing ? (
            <div className="rounded-lg border border-chart-3/30 bg-chart-3/5 p-3">
              <p className="text-xs font-medium text-muted-foreground">Comparison fund</p>
              <p className="mt-1 truncate font-medium">{comparisonModel.selections[1].title}</p>
              <div className="mt-2 flex items-center justify-between gap-2">
                <p className="truncate text-xs text-muted-foreground">
                  {comparisonModel.selections[1].navText}
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="shrink-0"
                  onClick={() => onComparisonChange(null)}
                >
                  Change
                </Button>
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-dashed bg-muted/10 p-3">
              <p className="text-xs font-medium text-muted-foreground">Comparison fund</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Search eligible Direct Growth schemes to compare their return path and reported
                data.
              </p>
              <div className="mt-3">
                <FundSearch
                  compact
                  onSelect={(scheme) => {
                    if (scheme.schemeCode !== schemeCode) onComparisonChange(scheme.schemeCode);
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </section>
      {!isComparing && (
        <Card className="mt-6">
          <CardHeader className="gap-6">
            <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
              <div>
                <div className="flex items-center gap-2">
                  <CardTitle>Growth of ₹10,000</CardTitle>
                  <Tooltip>
                    <TooltipTrigger
                      render={
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label="About this calculation"
                        />
                      }
                    >
                      <CircleHelpIcon />
                    </TooltipTrigger>
                    <TooltipContent
                      side="bottom"
                      align="start"
                      className="w-64 text-pretty leading-5"
                    >
                      Based on the NAV change over the selected period. Excludes taxes and
                      transaction costs.
                    </TooltipContent>
                  </Tooltip>
                </div>
                <CardDescription>If you had invested at the start of this period</CardDescription>
                <p className="mt-2 text-xs font-medium text-muted-foreground">
                  Selected period: {performance?.periodLabel ?? performanceRange}
                  {" total return"}
                </p>
              </div>
              <div className="sm:text-right">
                <p className="text-xs font-medium text-muted-foreground">Latest NAV</p>
                <p className="mt-1 font-mono text-2xl font-semibold tabular-nums">
                  {model.currentNav.valueText}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  As of {model.currentNav.dateText}
                </p>
              </div>
            </div>
            <div
              className={`grid gap-3 rounded-lg border bg-muted/20 p-3 sm:items-end ${
                showBenchmark && model.benchmarkName
                  ? "sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]"
                  : "sm:grid-cols-[minmax(0,1fr)_auto]"
              }`}
            >
              <OutcomeSummary
                name="This fund"
                colorClassName="bg-(--chart-1)"
                returnText={performance?.outcomes[0]?.returnText ?? "—"}
                valueText={performance?.outcomes[0]?.valueText ?? "—"}
                status={performance?.outcomes[0]?.status ?? "neutral"}
              />
              {showBenchmark && model.benchmarkName ? (
                <div className="border-t pt-3 sm:border-t-0 sm:border-l sm:pt-0 sm:pl-4">
                  <OutcomeSummary
                    name={model.benchmarkName}
                    colorClassName="bg-(--chart-3)"
                    returnText={performance?.outcomes[1]?.returnText ?? "—"}
                    valueText={performance?.outcomes[1]?.valueText ?? "—"}
                    status={performance?.outcomes[1]?.status ?? "neutral"}
                  />
                </div>
              ) : null}
              <div className="flex flex-wrap items-center gap-3">
                {model.benchmarkName ? (
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
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {model.performance.status === "ready" ? (
              <SchemeAnalysisChart
                series={model.performance.data.series}
                range={performanceRange}
                onRangeChange={(range) => onChartState(range, showBenchmark)}
              />
            ) : (
              <Alert>
                <DatabaseIcon />
                <AlertTitle>NAV history unavailable</AlertTitle>
                <AlertDescription>
                  {model.performance.status === "unavailable"
                    ? model.performance.message
                    : "Historical NAV data is unavailable right now."}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}
      {comparisonModel.requestError ? (
        <Alert className="mt-6" variant="destructive">
          <AlertCircleIcon />
          <AlertTitle>Comparison unavailable</AlertTitle>
          <AlertDescription>{comparisonModel.requestError}</AlertDescription>
        </Alert>
      ) : null}
      {isComparing && comparisonModel.comparison.status === "loading" ? (
        <Card className="mt-6">
          <CardHeader>
            <Skeleton className="h-5 w-44" />
            <Skeleton className="h-4 w-72 max-w-full" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      ) : null}
      {isComparing &&
      comparisonModel.comparison.status === "unavailable" &&
      !comparisonModel.requestError ? (
        <Alert className="mt-6">
          <AlertCircleIcon />
          <AlertTitle>Comparison unavailable</AlertTitle>
          <AlertDescription>{comparisonModel.comparison.message}</AlertDescription>
        </Alert>
      ) : null}
      {comparison ? (
        <FundComparison
          comparison={comparison}
          range={performanceRange}
          onRangeChange={(range) => onComparisonChange(comparisonSchemeCode, range)}
        />
      ) : null}
      {!comparison && (
        <>
          <section className="mt-4 grid gap-4 lg:grid-cols-[3fr_2fr]">
            {model.metricGroups.map((group) => (
              <MetricCardGroup key={group.title} title={group.title} metrics={group.metrics} />
            ))}
          </section>
          <div className="mt-6">
            <FundFactsGrid facts={model.facts} />
          </div>
          <section className="mt-6">
            <div className="mb-4 flex items-center gap-2">
              <PieChartIcon />
              <h2 className="text-xl font-semibold tracking-tight">Latest reported portfolio</h2>
            </div>
            {model.portfolio.status === "ready" ? (
              <>
                <div className="mb-4 flex flex-wrap items-center gap-2">
                  <Badge variant="outline">Reported portfolio</Badge>
                  <p className="text-sm text-muted-foreground">
                    {model.portfolio.data.reportDateText}
                  </p>
                </div>
                <SectorHoldings sectors={model.portfolio.data.sectors} />
                <div className="mt-4 grid gap-4 lg:grid-cols-2">
                  <AllocationBar
                    title="Asset allocation"
                    description="How the reported portfolio is divided among equity, debt, cash, and other assets."
                    items={model.portfolio.data.assetAllocation}
                  />
                  <AllocationBar
                    title="Market-cap allocation"
                    description="How the reported equity allocation is spread across large-, mid-, and small-cap companies."
                    items={model.portfolio.data.marketCapAllocation}
                  />
                  {model.portfolio.data.concentrationText !== null && (
                    <PortfolioConcentrationCard
                      valueText={model.portfolio.data.concentrationText}
                    />
                  )}
                </div>
              </>
            ) : (
              <Alert>
                <PieChartIcon />
                <AlertTitle>Latest portfolio unavailable</AlertTitle>
                <AlertDescription>
                  {model.portfolio.status === "unavailable"
                    ? model.portfolio.message
                    : "Portfolio data is unavailable right now."}
                </AlertDescription>
              </Alert>
            )}
          </section>
        </>
      )}
    </main>
  );
}
