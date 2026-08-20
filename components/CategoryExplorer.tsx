"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { FundCard, FundCardSkeleton, majorityRiskLabel } from "@/components/FundCard";
import { SelectionBar } from "@/components/SelectionBar";
import { TermHelp } from "@/components/TermHelp";
import { WatchlistToggleButton } from "@/components/WatchlistToggleButton";
import { EQUITY_CATEGORIES } from "@/lib/fundCategories";
import { TERM_DEFINITIONS, equityCategoryDefinition } from "@/lib/glossary";
import { categoryFundsQueryOptions } from "@/lib/fund.queries";

export function CategoryExplorer() {
  const [selectedCategory, setSelectedCategory] = useState<
    (typeof EQUITY_CATEGORIES)[number] | null
  >("Flexi Cap");
  const categoryQuery = useQuery(categoryFundsQueryOptions(selectedCategory));
  const [selectedSchemeCodes, setSelectedSchemeCodes] = useState<Set<string>>(new Set());

  function toggleSelection(schemeCode: string, selected: boolean) {
    setSelectedSchemeCodes((prev) => {
      const next = new Set(prev);
      if (selected) next.add(schemeCode);
      else next.delete(schemeCode);
      return next;
    });
  }

  return (
    <section aria-labelledby="category-explorer-title">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <p className="font-mono text-xs tracking-[0.18em] text-brand uppercase">Research index</p>
          <h2
            id="category-explorer-title"
            className="mt-2 font-heading text-2xl font-medium tracking-tight"
          >
            Browse the eligible equity universe.
          </h2>
        </div>
        <TermHelp
          definition={TERM_DEFINITIONS["Direct Growth"]}
          render={<Badge variant="outline" />}
        >
          Direct Growth schemes only
        </TermHelp>
      </div>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
        Select a category to view eligible Direct Growth schemes, or select funds below to compare
        or add them to a watchlist. Results are alphabetical, not a performance ranking.
      </p>
      <div
        className="mt-6 inline-flex flex-wrap gap-1 rounded-lg border bg-muted/20 p-1"
        aria-label="Equity categories"
      >
        {EQUITY_CATEGORIES.map((category) => {
          const isSelected = category === selectedCategory;
          const definition = equityCategoryDefinition(category);
          const buttonProps = {
            variant: isSelected ? ("default" as const) : ("ghost" as const),
            size: "sm" as const,
            className: "h-8 px-3",
            "aria-pressed": isSelected,
            onClick: () => setSelectedCategory(category),
          };
          return definition ? (
            <TermHelp key={category} definition={definition} render={<Button {...buttonProps} />}>
              {category}
            </TermHelp>
          ) : (
            <Button key={category} {...buttonProps}>
              {category}
            </Button>
          );
        })}
      </div>
      <div className="mt-8" aria-live="polite" aria-busy={categoryQuery.isLoading}>
        <div>
          {categoryQuery.data ? (
            <p className="text-sm text-muted-foreground">
              {categoryQuery.data.schemes.length} shown · alphabetical
            </p>
          ) : categoryQuery.isLoading ? (
            <Skeleton className="h-5 w-32" />
          ) : null}
          {categoryQuery.isLoading ? (
            <ul
              className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
              aria-label={`Loading ${selectedCategory} schemes`}
            >
              {Array.from({ length: 9 }, (_, index) => (
                <li key={index}>
                  <FundCardSkeleton selectable showWatchlistAction />
                </li>
              ))}
            </ul>
          ) : categoryQuery.isError ? (
            <p className="mt-5 text-sm text-negative">{categoryQuery.error.message}</p>
          ) : categoryQuery.data?.schemes.length ? (
            <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {(() => {
                const commonRisk = majorityRiskLabel(categoryQuery.data.schemes);
                return categoryQuery.data.schemes.map((scheme) => (
                  <li key={scheme.schemeCode}>
                    <FundCard
                      fund={{
                        schemeCode: scheme.schemeCode,
                        schemeName: scheme.schemeName,
                        amc: scheme.amc,
                        category: scheme.category,
                        riskLabel: scheme.riskLabel === commonRisk ? null : scheme.riskLabel,
                        aum: scheme.aum,
                        navPoint: scheme.nav,
                        oneYearReturn: scheme.oneYearReturn,
                        threeYearReturn: scheme.threeYearReturn,
                      }}
                      density="compact"
                      selectable
                      showCategory={false}
                      showLogo={false}
                      selected={selectedSchemeCodes.has(scheme.schemeCode)}
                      onSelectChange={(selected) => toggleSelection(scheme.schemeCode, selected)}
                      watchlistAction={<WatchlistToggleButton schemeCode={scheme.schemeCode} />}
                    />
                  </li>
                ));
              })()}
            </ul>
          ) : (
            <Empty className="mt-5 min-h-32">
              <EmptyHeader>
                <EmptyTitle>No schemes available</EmptyTitle>
                <EmptyDescription>
                  No eligible schemes are available for this category right now.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}
        </div>
      </div>
      <SelectionBar
        selectedSchemeCodes={[...selectedSchemeCodes]}
        onClear={() => setSelectedSchemeCodes(new Set())}
      />
    </section>
  );
}
