"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircleIcon,
  ArrowLeftIcon,
  BookmarkPlusIcon,
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
import { WatchlistPicker } from "@/components/watchlist-picker";
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
import { Field, FieldLabel } from "@/components/ui/field";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
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
        <Separator />
        <Accordion multiple>
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
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Badge variant="secondary">{isComparing ? "Fund comparison" : "Fund research"}</Badge>
          <WatchlistPicker schemeCodes={[schemeCode]}>
            <Button variant="outline" size="sm">
              <BookmarkPlusIcon data-icon="inline-start" />
              Add to watchlist
            </Button>
          </WatchlistPicker>
        </div>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-5xl">
          {model.header.title}
        </h1>
        <p className="mt-4 text-sm text-muted-foreground">{model.header.subtitle}</p>
      </header>
      <Card id="comparison-controls" className="mt-8" aria-live="polite">
        <CardHeader>
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
        </CardHeader>
        <CardContent className="grid items-stretch gap-3 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
          <div className="rounded-lg border bg-muted/20 p-3">
            <p className="text-xs font-medium text-muted-foreground">Primary fund</p>
            <p className="mt-1 truncate font-medium">{model.header.title}</p>
            <p className="mt-1 truncate text-xs text-muted-foreground">{model.header.subtitle}</p>
          </div>
          <div className="grid place-items-center text-muted-foreground" aria-hidden="true">
            <GitCompareArrowsIcon className="size-5" />
          </div>
          {isComparing ? (
            <div className="rounded-lg border bg-muted/20 p-3">
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
                  Remove
                </Button>
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-dashed bg-muted/20 p-3">
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
        </CardContent>
      </Card>
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
                showBenchmark && model.benchmark
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
              {showBenchmark && model.benchmark ? (
                <div className="border-t pt-3 sm:border-t-0 sm:border-l sm:pt-0 sm:pl-4">
                  <OutcomeSummary
                    name={model.benchmark.name}
                    colorClassName="bg-(--chart-3)"
                    returnText={performance?.outcomes[1]?.returnText ?? "—"}
                    valueText={performance?.outcomes[1]?.valueText ?? "—"}
                    status={performance?.outcomes[1]?.status ?? "neutral"}
                  />
                </div>
              ) : null}
              <div className="flex flex-wrap items-center gap-3">
                {model.benchmark ? (
                  <Field orientation="horizontal" className="w-auto">
                    <Switch
                      id={`show-benchmark-${schemeCode}`}
                      checked={showBenchmark}
                      onCheckedChange={(checked) => onChartState(performanceRange, checked)}
                    />
                    <FieldLabel htmlFor={`show-benchmark-${schemeCode}`}>
                      Show total-return benchmark
                    </FieldLabel>
                  </Field>
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
          <RiskAndReturnConsistency
            riskMetrics={model.metricGroups.find((group) => group.title === "Risk")?.metrics ?? []}
            consistency={model.returnConsistency}
          />
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
          {model.relatedFunds.peers.length || model.relatedFunds.fromAmc.length ? (
            <section className="mt-8">
              <Separator />
              <div className="pt-6">
                <div>
                  <h2 className="text-lg font-semibold tracking-tight">Explore related funds</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Eligible Direct Growth equity schemes supplied by FinAPI. These links are for
                    research, not recommendations.
                  </p>
                </div>
                <div className="mt-5 grid gap-6 sm:grid-cols-2">
                  {model.relatedFunds.peers.length ? (
                    <RelatedFundLinks
                      title="Similar funds"
                      funds={model.relatedFunds.peers}
                      primarySchemeCode={schemeCode}
                    />
                  ) : null}
                  {model.relatedFunds.fromAmc.length ? (
                    <RelatedFundLinks
                      title="More from this AMC"
                      funds={model.relatedFunds.fromAmc}
                      primarySchemeCode={schemeCode}
                    />
                  ) : null}
                </div>
              </div>
            </section>
          ) : null}
        </>
      )}
    </main>
  );
}

function RiskAndReturnConsistency({
  riskMetrics,
  consistency,
}: {
  riskMetrics: readonly { label: string; valueText: string; status: "gain" | "loss" | "neutral" }[];
  consistency: FundResearchReadyModel["returnConsistency"];
}) {
  if (!riskMetrics.length && !consistency) return null;
  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Risk &amp; return consistency</CardTitle>
        <CardDescription>
          Path risk is calculated from available NAV history. Rolling-return figures are reported by
          FinAPI and describe historical outcomes, not recommendations.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        {riskMetrics.length ? (
          <section aria-labelledby="path-risk-title">
            <h2 id="path-risk-title" className="text-sm font-semibold">
              Path risk
            </h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {riskMetrics.map((metric) => (
                <div key={metric.label} className="rounded-lg bg-muted/20 px-3 py-3">
                  <p className="text-xs text-muted-foreground">{metric.label}</p>
                  <p className="mt-1 font-mono text-xl font-semibold tabular-nums">
                    {metric.valueText}
                  </p>
                </div>
              ))}
            </div>
          </section>
        ) : null}
        {consistency ? (
          <section aria-labelledby="return-consistency-title" className="lg:border-l lg:pl-6">
            <h2 id="return-consistency-title" className="text-sm font-semibold">
              {consistency.timeframe} rolling returns
            </h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {consistency.rows.map((row) => (
                <div key={row.label}>
                  <p className="text-xs text-muted-foreground">{row.label}</p>
                  <p className="mt-1 font-mono text-sm font-medium tabular-nums">{row.valueText}</p>
                </div>
              ))}
            </div>
          </section>
        ) : null}
      </CardContent>
    </Card>
  );
}

function RelatedFundLinks({
  title,
  funds,
  primarySchemeCode,
}: {
  title: string;
  funds: readonly { schemeCode: string; schemeName: string; amc: string; category: string }[];
  primarySchemeCode: string;
}) {
  return (
    <section aria-label={title}>
      <h2 className="text-sm font-semibold">{title}</h2>
      <ul className="mt-3 flex flex-col gap-3">
        {funds.map((fund) => (
          <li key={fund.schemeCode} className="rounded-lg border bg-muted/20 p-3">
            <Link
              className="text-sm font-medium underline-offset-4 hover:underline"
              href={`/fund/${fund.schemeCode}`}
            >
              {fund.schemeName}
            </Link>
            <p className="mt-1 text-xs text-muted-foreground">
              {fund.amc} · {fund.category}
            </p>
            <Link
              className={buttonVariants({ variant: "outline", size: "sm", className: "mt-3" })}
              href={toFundResearchHref(primarySchemeCode, {
                range: "3y",
                showBenchmark: false,
                against: fund.schemeCode,
              })}
            >
              <GitCompareArrowsIcon data-icon="inline-start" />
              Compare
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
