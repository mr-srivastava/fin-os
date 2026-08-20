"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircleIcon,
  ArrowLeftIcon,
  BookmarkPlusIcon,
  CircleHelpIcon,
  DatabaseIcon,
  PieChartIcon,
  XIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
import { SchemeAnalysisChart } from "@/components/SchemeAnalysisChart";
import { FundComparison } from "@/components/FundComparison";
import { FundSearch } from "@/components/FundSearch";
import { WatchlistPicker } from "@/components/WatchlistPicker";
import { AllocationBar } from "@/components/research/AllocationBar";
import { FundFactsGrid } from "@/components/research/FundFacts";
import { PerformanceSummary } from "@/components/research/PerformanceSummary";
import { PortfolioConcentrationCard } from "@/components/research/PortfolioConcentration";
import { RelatedFundLinks } from "@/components/research/RelatedFundLinks";
import { RiskAndReturnConsistency } from "@/components/research/RiskReturnConsistency";
import { SectorHoldings } from "@/components/research/SectorHoldings";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { type PerformanceRange } from "@/lib/analytics";
import type { FundResearchReadyModel } from "@/lib/research-display/types";
import {
  useComparisonScreenModel,
  useFundResearchScreenModel,
} from "@/lib/research-display/useScreenModels";
import { type FundResearchRouteState, toFundResearchHref } from "@/lib/researchRouteState";

interface FundResearchViewProps {
  schemeCode: string;
  routeState: FundResearchRouteState;
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
            <EmptyMedia variant="negative">
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
        <h1 className="mt-4 font-heading text-3xl font-semibold tracking-tight sm:text-5xl">
          {model.header.title}
        </h1>
        <p className="mt-4 text-sm text-muted-foreground">{model.header.subtitle}</p>
      </header>
      <Card id="comparison-controls" className="mt-8" aria-live="polite">
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <CardTitle>
                {isComparing ? "Comparing with another fund" : "Compare with another fund"}
              </CardTitle>
              <CardDescription>
                {isComparing
                  ? "Research both funds side by side."
                  : "Search eligible Direct Growth schemes to compare their return path and reported data."}
              </CardDescription>
            </div>
            {isComparing ? (
              <Button
                variant="ghost"
                size="sm"
                className="shrink-0"
                onClick={() => onComparisonChange(null)}
              >
                <XIcon data-icon="inline-start" /> Remove
              </Button>
            ) : null}
          </div>
        </CardHeader>
        <CardContent>
          {isComparing ? (
            <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
              <p className="truncate font-medium">{comparisonModel.selections[1].title}</p>
              <p className="truncate text-xs text-muted-foreground">
                {comparisonModel.selections[1].navText}
              </p>
            </div>
          ) : (
            <FundSearch
              compact
              onSelect={(scheme) => {
                if (scheme.schemeCode !== schemeCode) onComparisonChange(scheme.schemeCode);
              }}
            />
          )}
        </CardContent>
      </Card>
      {!isComparing && (
        <div className="mt-6 grid gap-6 lg:grid-cols-[2fr_1fr] lg:items-stretch">
          <Card className="lg:row-span-2 lg:flex lg:flex-col">
            <CardHeader className="gap-4">
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                <div>
                  <div className="flex items-center gap-2">
                    <CardTitle>Performance vs benchmark</CardTitle>
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
                        Growth of ₹10,000 invested at the start of the selected period, based on the
                        NAV change. Excludes taxes and transaction costs.
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <CardDescription>
                    {performance?.periodLabel ?? performanceRange} total return
                  </CardDescription>
                </div>
                <div className="sm:text-right">
                  <p className="text-xs font-medium text-muted-foreground">Latest NAV</p>
                  <p className="mt-1 font-mono text-xl font-semibold tabular-nums">
                    {model.currentNav.valueText}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    As of {model.currentNav.dateText}
                  </p>
                </div>
              </div>
              <PerformanceSummary
                fund={performance?.outcomes[0]}
                benchmark={performance?.outcomes[1]}
                benchmarkName={model.benchmark?.name}
                showBenchmark={showBenchmark}
                hasBenchmark={model.benchmark !== null}
                onToggleBenchmark={(checked) => onChartState(performanceRange, checked)}
                toggleId={`show-benchmark-${schemeCode}`}
              />
            </CardHeader>
            <CardContent aria-live="polite" className="lg:flex-1">
              {model.performance.status === "ready" ? (
                <SchemeAnalysisChart
                  series={model.performance.data.series}
                  range={performanceRange}
                  onRangeChange={(range) => onChartState(range, showBenchmark)}
                  chartClassName="min-h-64 w-full lg:h-full lg:min-h-96"
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
          <RiskAndReturnConsistency
            riskMetrics={model.metricGroups.find((group) => group.title === "Risk")?.metrics ?? []}
            consistency={model.returnConsistency}
          />
          <FundFactsGrid facts={model.facts} />
        </div>
      )}
      <div aria-live="polite">
        {comparisonModel.requestError ? (
          <Alert className="mt-6" variant="destructive">
            <AlertCircleIcon />
            <AlertTitle>Comparison unavailable</AlertTitle>
            <AlertDescription>{comparisonModel.requestError}</AlertDescription>
          </Alert>
        ) : null}
        {isComparing && comparisonModel.comparison.status === "loading" ? (
          <Card className="mt-6" aria-busy="true">
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
      </div>
      {comparison ? (
        <FundComparison
          comparison={comparison}
          range={performanceRange}
          onRangeChange={(range) => onComparisonChange(comparisonSchemeCode, range)}
        />
      ) : null}
      {!comparison && (
        <>
          <section className="mt-6" aria-live="polite">
            <div className="mb-4 flex items-center gap-2">
              <PieChartIcon />
              <h2 className="font-heading text-xl font-semibold tracking-tight">
                Latest reported portfolio
              </h2>
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
                  <h2 className="font-heading text-lg font-semibold tracking-tight">
                    Explore related funds
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Eligible Direct Growth equity schemes supplied by FinAPI. These links are for
                    research, not recommendations.
                  </p>
                </div>
                <div className="mt-5 flex flex-col gap-6">
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
