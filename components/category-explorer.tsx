"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { FundCard } from "@/components/fund-card";
import { SelectionBar } from "@/components/selection-bar";
import { WatchlistToggleButton } from "@/components/watchlist-toggle-button";
import { EQUITY_CATEGORIES } from "@/lib/fund-categories";
import { categoryFundsQueryOptions } from "@/lib/fund-queries";

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
          <p className="font-mono text-xs tracking-[0.18em] text-primary uppercase">
            Research index
          </p>
          <h2
            id="category-explorer-title"
            className="mt-2 font-heading text-2xl font-medium tracking-tight"
          >
            Browse the eligible equity universe.
          </h2>
        </div>
        <Badge variant="outline">Direct Growth schemes only</Badge>
      </div>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
        Select a category to view eligible Direct Growth schemes, or select funds below to compare
        or add them to a watchlist. Results are alphabetical, not a performance ranking.
      </p>
      <div className="mt-6 flex flex-wrap gap-2" aria-label="Equity categories">
        {EQUITY_CATEGORIES.map((category) => {
          const isSelected = category === selectedCategory;
          return (
            <Button
              key={category}
              variant={isSelected ? "default" : "outline"}
              className="h-9 px-3"
              aria-pressed={isSelected}
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </Button>
          );
        })}
      </div>
      <div className="mt-8" aria-live="polite" aria-busy={categoryQuery.isLoading}>
        <Separator />
        <div className="pt-6">
          {categoryQuery.data ? (
            <p className="text-sm text-muted-foreground">
              {categoryQuery.data.schemes.length} shown · alphabetical
            </p>
          ) : null}
          {categoryQuery.isLoading ? (
            <div className="mt-5 flex items-center gap-2 text-sm text-muted-foreground">
              <Spinner aria-label={`Loading ${selectedCategory} schemes`} /> Loading schemes…
            </div>
          ) : categoryQuery.isError ? (
            <p className="mt-5 text-sm text-destructive">{categoryQuery.error.message}</p>
          ) : categoryQuery.data?.schemes.length ? (
            <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {categoryQuery.data.schemes.map((scheme) => (
                <li key={scheme.schemeCode}>
                  <FundCard
                    fund={scheme}
                    density="compact"
                    selectable
                    selected={selectedSchemeCodes.has(scheme.schemeCode)}
                    onSelectChange={(selected) => toggleSelection(scheme.schemeCode, selected)}
                    watchlistAction={<WatchlistToggleButton schemeCode={scheme.schemeCode} />}
                  />
                </li>
              ))}
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
