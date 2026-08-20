"use client";

import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { useMemo } from "react";
import type { PerformanceRange } from "@/lib/shared/analytics";
import { fundQueryOptions, relatedSnapshotsQueryOptions } from "@/lib/fund/fund.queries";
import type { FundResearchView, RelatedSnapshot } from "@/lib/fund/fund.schema";
import {
  formatFullDate,
  formatNumber,
  formatPercent,
  formatRupees,
  formatSignedPercent,
  lookup,
} from "@/lib/shared/utils";
import { labels } from "./metricLabels";
import type { FundResearchScreenModel } from "./fundResearch.types";

const PLAIN_NUMBER_METRIC_IDS = new Set(["informationRatio"]);
const PERCENT_METRIC_IDS = new Set(["volatility", "trackingError"]);
const CAPTURE_METRIC_IDS = new Set(["upsideCapture", "downsideCapture"]);

function withSnapshot(
  fund: FundResearchView["relatedFunds"]["peers"][number],
  snapshots: Record<string, RelatedSnapshot>,
) {
  const snapshot = snapshots[fund.schemeCode];
  return snapshot ? { ...fund, ...snapshot } : fund;
}

function fundModel(
  view: FundResearchView,
  range: PerformanceRange,
  benchmark: boolean,
  relatedSnapshots: Record<string, RelatedSnapshot>,
) {
  const performance =
    view.performance.status === "ready"
      ? (() => {
          const selected = view.performance.data[range];
          const count = benchmark ? selected.series.length : 1;
          return {
            status: "ready" as const,
            data: {
              range,
              periodLabel: selected.label,
              series: selected.series.slice(0, count).map((series, index) => ({
                name: series.name,
                color: index ? ("chart-3" as const) : ("chart-1" as const),
                points: series.points,
              })),
              outcomes: selected.outcomes.slice(0, count).map((outcome, index) => ({
                name: outcome.name,
                color: index ? ("benchmark" as const) : ("fund" as const),
                returnPercent: outcome.returnPercent,
                returnText: formatSignedPercent(outcome.returnPercent),
                valueText: formatRupees(outcome.endingValue),
                status: outcome.tone,
              })),
            },
          };
        })()
      : view.performance;
  const portfolio =
    view.portfolio.status === "ready"
      ? {
          status: "ready" as const,
          data: {
            reportDateText: view.portfolio.data.asOf
              ? `Portfolio as of ${formatFullDate(view.portfolio.data.asOf)}`
              : "Portfolio report date unavailable.",
            sectors: view.portfolio.data.sectors.map((sector) => ({
              name: sector.name,
              weightText: formatPercent(sector.weight),
              holdings: sector.holdings.map((holding) => ({
                name: holding.name,
                weight: holding.weight,
                weightText: formatPercent(holding.weight),
              })),
            })),
            assetAllocation: view.portfolio.data.assetAllocation.map((item, index) => ({
              ...item,
              weightText: formatPercent(item.weight),
              color: `var(--chart-${(index % 5) + 1})`,
            })),
            marketCapAllocation: view.portfolio.data.marketCapAllocation.map((item, index) => ({
              ...item,
              weightText: formatPercent(item.weight),
              color: `var(--chart-${(index % 5) + 1})`,
            })),
            concentrationText:
              view.portfolio.data.topTenConcentration === null
                ? null
                : formatPercent(view.portfolio.data.topTenConcentration / 100),
          },
        }
      : view.portfolio;
  return {
    schemeCode: view.scheme.schemeCode,
    header: {
      title: view.scheme.schemeName,
      subtitle: `${view.scheme.amc} · ${view.scheme.category} · ${view.scheme.plan} ${view.scheme.option}`,
    },
    currentNav: {
      valueText: formatRupees(view.currentNav?.nav ?? null),
      dateText: view.currentNav ? formatFullDate(view.currentNav.date) : "—",
    },
    benchmark: view.benchmark,
    performance,
    metricGroups: view.metricGroups.map((group) => ({
      title:
        group.id === "returns"
          ? "Annualised returns"
          : group.id === "risk"
            ? "Risk"
            : "Vs benchmark",
      metrics: group.metrics.map((metric) => ({
        label: lookup(labels, metric.id) ?? metric.id,
        valueText: PLAIN_NUMBER_METRIC_IDS.has(metric.id)
          ? formatNumber(metric.value)
          : CAPTURE_METRIC_IDS.has(metric.id)
            ? formatNumber(metric.value, "%")
            : PERCENT_METRIC_IDS.has(metric.id)
              ? formatPercent(metric.value)
              : formatSignedPercent(metric.value),
        status: metric.tone,
      })),
    })),
    rollingBenchmarkComparison: view.rollingBenchmarkComparison
      ? {
          timeframeYears: view.rollingBenchmarkComparison.timeframeYears,
          hitRateText: `Beat benchmark in ${formatPercent(view.rollingBenchmarkComparison.hitRate)} of rolling ${view.rollingBenchmarkComparison.timeframeYears}-year windows (${view.rollingBenchmarkComparison.windowCount} windows)`,
          windowCount: view.rollingBenchmarkComparison.windowCount,
        }
      : null,
    returnConsistency: view.returnConsistency
      ? {
          timeframe: view.returnConsistency.timeframe,
          averageReturn: view.returnConsistency.averageReturn,
          medianReturn: view.returnConsistency.medianReturn,
          minReturn: view.returnConsistency.minReturn,
          maxReturn: view.returnConsistency.maxReturn,
          positiveRatio: view.returnConsistency.positiveRatio,
          negativeRatio: view.returnConsistency.negativeRatio,
          consistencyScore: view.returnConsistency.consistencyScore,
        }
      : null,
    relatedFunds: {
      peers: view.relatedFunds.peers.map((fund) => withSnapshot(fund, relatedSnapshots)),
      fromAmc: view.relatedFunds.fromAmc.map((fund) => withSnapshot(fund, relatedSnapshots)),
    },
    facts: [
      {
        label: "AUM",
        valueText: view.facts.aum === null ? "—" : `₹${formatNumber(view.facts.aum)} Cr`,
        numeric: true,
      },
      {
        label: "Expense ratio",
        valueText:
          view.facts.expenseRatio === null ? "—" : `${formatNumber(view.facts.expenseRatio)}%`,
        numeric: true,
      },
      {
        label: "Portfolio turnover",
        valueText:
          view.facts.portfolioTurnover === null
            ? "—"
            : `${formatNumber(view.facts.portfolioTurnover)}%`,
        numeric: true,
      },
      ...(view.facts.benchmark ? [{ label: "Benchmark", valueText: view.facts.benchmark }] : []),
      ...(view.facts.riskLabel ? [{ label: "Risk", valueText: view.facts.riskLabel }] : []),
      ...(view.facts.managers.length
        ? [{ label: "Fund managers", valueText: view.facts.managers.join(", ") }]
        : []),
    ],
    portfolio,
  };
}

export function useFundResearchResource(
  schemeCode: string,
): UseQueryResult<FundResearchView, Error> {
  return useQuery(fundQueryOptions(schemeCode));
}

export function useFundResearchScreenModel({
  schemeCode,
  range,
  showBenchmark,
}: {
  schemeCode: string;
  range: PerformanceRange;
  showBenchmark: boolean;
}): FundResearchScreenModel {
  const resource = useFundResearchResource(schemeCode);
  const relatedCodes = useMemo(
    () =>
      resource.data
        ? [
            ...resource.data.relatedFunds.peers.map((fund) => fund.schemeCode),
            ...resource.data.relatedFunds.fromAmc.map((fund) => fund.schemeCode),
          ]
        : [],
    [resource.data],
  );
  const snapshotsResource = useQuery(relatedSnapshotsQueryOptions(relatedCodes));
  return useMemo(
    () =>
      resource.isError && !resource.data
        ? { status: "error" as const, message: resource.error.message }
        : !resource.data
          ? { status: "loading" as const }
          : {
              status: "ready" as const,
              data: fundModel(
                resource.data,
                range,
                showBenchmark,
                snapshotsResource.data?.snapshots ?? {},
              ),
            },
    [range, resource.data, resource.error, resource.isError, showBenchmark, snapshotsResource.data],
  );
}
