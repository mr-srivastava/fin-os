"use client";

import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { useMemo } from "react";
import type { PerformanceRange } from "@/lib/analytics";
import { comparisonQueryOptions, fundQueryOptions } from "@/lib/fund-queries";
import type { FundResearchView } from "@/lib/research-view/types";
import {
  formatFullDate,
  formatNumber,
  formatPercent,
  formatRupees,
  formatSignedPercent,
} from "@/lib/utils";
import type { ComparisonScreenModel, FundResearchScreenModel } from "./types";

const labels: Record<string, string> = {
  oneYear: "1Y return",
  threeYear: "3Y annualised",
  fiveYear: "5Y annualised",
  volatility: "Volatility",
  maxDrawdown: "Max drawdown",
};
const comparisonLabels: Record<string, string> = {
  ...labels,
  threeYear: "3Y annualized",
  fiveYear: "5Y annualized",
  volatility: "1Y volatility",
};

function fundModel(view: FundResearchView, range: PerformanceRange, benchmark: boolean) {
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
      title: group.id === "returns" ? "Annualised returns" : "Risk",
      metrics: group.metrics.map((metric) => ({
        label: labels[metric.id] ?? metric.id,
        valueText:
          metric.id === "volatility"
            ? formatPercent(metric.value)
            : formatSignedPercent(metric.value),
        status: metric.tone,
      })),
    })),
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
  return useMemo(
    () =>
      resource.isError && !resource.data
        ? { status: "error" as const, message: resource.error.message }
        : !resource.data
          ? { status: "loading" as const }
          : { status: "ready" as const, data: fundModel(resource.data, range, showBenchmark) },
    [range, resource.data, resource.error, resource.isError, showBenchmark],
  );
}

export function useComparisonScreenModel({
  schemeCodes,
  range,
}: {
  schemeCodes: readonly string[];
  range: PerformanceRange;
}): ComparisonScreenModel {
  const resource = useQuery(comparisonQueryOptions(schemeCodes[0], schemeCodes[1]));
  return useMemo(() => {
    const empty = {
      schemeCode: null,
      title: "Choose a fund",
      subtitle: null,
      navText: "",
      status: "empty" as const,
    };
    if (schemeCodes.length < 2)
      return {
        selections: [empty, empty],
        requestError: null,
        comparison: { status: "unavailable" as const, message: "Choose two funds to compare." },
      };
    if (resource.isError && !resource.data)
      return {
        selections: [empty, empty],
        requestError: resource.error.message,
        comparison: { status: "unavailable" as const, message: resource.error.message },
      };
    if (!resource.data)
      return {
        selections: schemeCodes.map((schemeCode) => ({
          schemeCode,
          title: "Loading selected fund…",
          subtitle: null,
          navText: "",
          status: "loading" as const,
        })) as unknown as ComparisonScreenModel["selections"],
        requestError: null,
        comparison: { status: "loading" as const },
      };
    const view = resource.data;
    const selections = view.selections.map((selection) =>
      selection.status === "ready"
        ? {
            schemeCode: selection.scheme.schemeCode,
            title: selection.scheme.schemeName,
            subtitle: `${selection.scheme.amc} · ${selection.scheme.category} · ${selection.scheme.plan} ${selection.scheme.option}`,
            navText: selection.currentNav
              ? `Latest NAV ${formatRupees(selection.currentNav.nav)} · ${formatFullDate(selection.currentNav.date)}`
              : "Latest NAV unavailable.",
            status: "ready" as const,
          }
        : {
            schemeCode: selection.schemeCode,
            title: "Fund unavailable",
            subtitle: null,
            navText: selection.message,
            status: "error" as const,
          },
    ) as unknown as ComparisonScreenModel["selections"];
    if (view.comparison.status === "unavailable")
      return { selections, requestError: null, comparison: view.comparison };
    const data = view.comparison.data;
    const performance =
      data.performance.status === "ready"
        ? {
            status: "ready" as const,
            data: {
              range,
              series: data.performance.data[range].series.map((series, index) => ({
                name: series.name,
                color: index ? ("chart-3" as const) : ("foreground" as const),
                points: series.points,
              })),
              outcomes: data.performance.data[range].outcomes.map((outcome, index) => ({
                name: outcome.name,
                color: index ? ("comparison-b" as const) : ("comparison-a" as const),
                returnText: formatSignedPercent(outcome.returnPercent),
                valueText: formatRupees(outcome.endingValue),
                status: outcome.tone,
              })),
            },
          }
        : data.performance;
    const characteristics =
      data.metrics.status === "ready"
        ? {
            status: "ready" as const,
            data: data.metrics.data.map((row) => ({
              label: comparisonLabels[row.id] ?? row.id,
              values: row.values.map((value, index) => ({
                label: data.fundNames[index]!,
                valueText:
                  row.id === "volatility"
                    ? formatPercent(value.value)
                    : formatSignedPercent(value.value),
                status: value.tone,
              })),
            })),
          }
        : data.metrics;
    const facts = data.facts.map((row) => ({
      label:
        {
          aum: "AUM",
          expenseRatio: "Expense ratio",
          portfolioTurnover: "Portfolio turnover",
          riskLabel: "Risk",
        }[row.id] ?? row.id,
      values: row.values.map((value) =>
        row.id === "aum"
          ? value === null
            ? "—"
            : `₹${formatNumber(value as number)} Cr`
          : row.id === "expenseRatio" || row.id === "portfolioTurnover"
            ? value === null
              ? "—"
              : `${formatNumber(value as number)}%`
            : ((value as string) ?? "—"),
      ),
    }));
    const portfolio =
      data.portfolio.status === "ready"
        ? {
            status: "ready" as const,
            data: {
              reportDateText: data.portfolio.data.reportDates.every(Boolean)
                ? `Reported as of ${formatFullDate(data.portfolio.data.reportDates[0]!)} and ${formatFullDate(data.portfolio.data.reportDates[1]!)}.`
                : "Portfolio report date unavailable for one or both funds.",
              sectorAllocation: data.portfolio.data.sectorAllocation.map((item) => ({
                name: item.name,
                leftText: formatPercent(item.weights[0]),
                rightText: formatPercent(item.weights[1]),
              })),
              assetAllocation: data.portfolio.data.assetAllocation.map((item) => ({
                name: item.name,
                leftText: formatPercent(item.weights[0]),
                rightText: formatPercent(item.weights[1]),
              })),
              marketCapAllocation: data.portfolio.data.marketCapAllocation.map((item) => ({
                name: item.name,
                leftText: formatPercent(item.weights[0]),
                rightText: formatPercent(item.weights[1]),
              })),
              concentration: [
                data.portfolio.data.concentration[0] === null
                  ? null
                  : formatPercent(data.portfolio.data.concentration[0]! / 100),
                data.portfolio.data.concentration[1] === null
                  ? null
                  : formatPercent(data.portfolio.data.concentration[1]! / 100),
              ] as const,
            },
          }
        : data.portfolio;
    return {
      selections,
      requestError: null,
      comparison: {
        status: "ready" as const,
        data: { fundNames: data.fundNames, performance, characteristics, facts, portfolio },
      },
    };
  }, [range, resource.data, resource.error, resource.isError, schemeCodes]);
}
