"use client";

import { useQueries, useQuery, type UseQueryResult } from "@tanstack/react-query";
import { useMemo } from "react";
import type { PerformanceRange } from "@/lib/analytics";
import { fundQueryOptions } from "@/lib/fund-queries";
import type { FundPair, FundResearch } from "@/lib/fund-types";
import { isFundPair } from "@/lib/fund-types";
import {
  toComparisonAllocationDisplay,
  toComparisonFactsDisplay,
  toComparisonMetricDisplay,
  toComparisonPortfolioReportDate,
  toComparisonPerformanceDisplay,
} from "@/lib/research-display/comparison";
import {
  toFundFactsDisplay,
  toFundHeaderDisplay,
  toCurrentNavDisplay,
  toFundMetricGroups,
  toPercentagePointsText,
  toPerformanceDisplay,
  toPortfolioDisplay,
} from "@/lib/research-display/fund-research";
import type { ComparisonScreenModel, FundResearchScreenModel } from "@/lib/research-display/types";

export function useFundResearchResource(schemeCode: string): UseQueryResult<FundResearch, Error> {
  return useQuery(fundQueryOptions(schemeCode));
}

export function useComparisonResources(
  schemeCodes: readonly string[],
): readonly UseQueryResult<FundResearch, Error>[] {
  return useQueries({
    queries: schemeCodes.map(fundQueryOptions),
  });
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
  return useMemo(() => {
    if (resource.isError && !resource.data)
      return { status: "error" as const, message: resource.error.message };
    if (!resource.data) return { status: "loading" as const };
    const fund = resource.data;
    const performance = fund.availability.navHistory.available
      ? { status: "ready" as const, data: toPerformanceDisplay(fund, range, showBenchmark) }
      : {
          status: "unavailable" as const,
          message:
            fund.availability.navHistory.reason ?? "Historical NAV data is unavailable right now.",
        };
    const portfolio = toPortfolioDisplay(fund);
    return {
      status: "ready" as const,
      data: {
        schemeCode,
        header: toFundHeaderDisplay(fund),
        currentNav: toCurrentNavDisplay(fund),
        benchmarkName: fund.benchmark?.name ?? null,
        performance,
        metricGroups: toFundMetricGroups(fund),
        facts: toFundFactsDisplay(fund),
        portfolio: portfolio
          ? { status: "ready" as const, data: portfolio }
          : {
              status: "unavailable" as const,
              message: !fund.availability.portfolio.available
                ? fund.availability.portfolio.reason
                : "Portfolio data is unavailable right now.",
            },
      },
    };
  }, [range, resource.data, resource.error, resource.isError, schemeCode, showBenchmark]);
}

function toPair(
  schemeCodes: readonly string[],
  resources: readonly UseQueryResult<FundResearch, Error>[],
): FundPair<FundResearch> | null {
  const funds = schemeCodes.map((schemeCode, index) =>
    resources[index]?.data?.scheme.schemeCode === schemeCode ? resources[index].data : undefined,
  );
  return funds.length === 2 && funds.every(Boolean) && isFundPair(funds)
    ? (funds as FundPair<FundResearch>)
    : null;
}

export function useComparisonScreenModel({
  schemeCodes,
  range,
}: {
  schemeCodes: readonly string[];
  range: PerformanceRange;
}): ComparisonScreenModel {
  const resources = useComparisonResources(schemeCodes);
  return useMemo(() => {
    const selectionFor = (index: 0 | 1) => {
      const schemeCode = schemeCodes[index] ?? null;
      const resource = resources[index];
      if (!schemeCode)
        return {
          schemeCode: null,
          title: "Choose a fund",
          subtitle: null,
          navText: "",
          status: "empty" as const,
        };
      if (resource?.isError && !resource.data)
        return {
          schemeCode,
          title: "Loading selected fund…",
          subtitle: null,
          navText: "This fund could not be loaded.",
          status: "error" as const,
        };
      if (!resource?.data)
        return {
          schemeCode,
          title: "Loading selected fund…",
          subtitle: null,
          navText: "",
          status: "loading" as const,
        };
      const fund = resource.data;
      return {
        schemeCode,
        title: fund.scheme.schemeName,
        subtitle: `${fund.scheme.amc} · ${fund.scheme.category} · ${fund.scheme.plan} ${fund.scheme.option}`,
        navText: fund.currentNav
          ? `Latest NAV ${toCurrentNavDisplay(fund).valueText} · ${toCurrentNavDisplay(fund).dateText}`
          : "Latest NAV unavailable.",
        status: "ready" as const,
      };
    };
    const selections: ComparisonScreenModel["selections"] = [selectionFor(0), selectionFor(1)];
    const requestError =
      resources.find((resource) => resource.isError && !resource.data)?.error?.message ?? null;
    const funds = toPair(schemeCodes, resources);
    if (!funds) {
      return {
        selections,
        requestError,
        comparison:
          schemeCodes.length === 2 && !requestError
            ? { status: "loading" as const }
            : {
                status: "unavailable" as const,
                message: requestError ?? "Choose two funds to compare.",
              },
      };
    }
    const unavailableNavNames = funds
      .filter((fund) => !fund.availability.navHistory.available)
      .map((fund) => fund.scheme.schemeName);
    const performance = unavailableNavNames.length
      ? {
          status: "unavailable" as const,
          message: `Historical NAV data is unavailable for ${unavailableNavNames.join(" and ")}, so performance comparison cannot be shown.`,
        }
      : {
          status: "ready" as const,
          data: { range, ...toComparisonPerformanceDisplay(funds, range) },
        };
    const portfolio =
      funds[0].portfolio && funds[1].portfolio
        ? {
            status: "ready" as const,
            data: {
              reportDateText: toComparisonPortfolioReportDate(funds),
              sectorAllocation: toComparisonAllocationDisplay(
                funds[0].portfolio.sectors,
                funds[1].portfolio.sectors,
              ),
              assetAllocation: toComparisonAllocationDisplay(
                funds[0].portfolio.assetAllocation,
                funds[1].portfolio.assetAllocation,
              ),
              marketCapAllocation: toComparisonAllocationDisplay(
                funds[0].portfolio.marketCapAllocation,
                funds[1].portfolio.marketCapAllocation,
              ),
              concentration: [
                funds[0].portfolio.topTenConcentration === null
                  ? null
                  : toPercentagePointsText(funds[0].portfolio.topTenConcentration),
                funds[1].portfolio.topTenConcentration === null
                  ? null
                  : toPercentagePointsText(funds[1].portfolio.topTenConcentration),
              ] as const,
            },
          }
        : {
            status: "unavailable" as const,
            message:
              "A reported portfolio is not available for both funds, so portfolio comparison cannot be shown.",
          };
    return {
      selections,
      requestError,
      comparison: {
        status: "ready" as const,
        data: {
          fundNames: [funds[0].scheme.schemeName, funds[1].scheme.schemeName],
          performance,
          characteristics: unavailableNavNames.length
            ? {
                status: "unavailable" as const,
                message: `Historical NAV data is unavailable for ${unavailableNavNames.join(" and ")}, so return and risk measures cannot be compared.`,
              }
            : { status: "ready" as const, data: toComparisonMetricDisplay(funds) },
          facts: toComparisonFactsDisplay(funds),
          portfolio,
        },
      },
    };
  }, [range, resources, schemeCodes]);
}
