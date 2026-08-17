"use client";

import Link from "next/link";
import { ArrowRightIcon } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { EQUITY_CATEGORIES } from "@/lib/fund-categories";
import { categoryFundsQueryOptions } from "@/lib/fund-queries";

export function CategoryExplorer() {
  const [selectedCategory, setSelectedCategory] = useState<
    (typeof EQUITY_CATEGORIES)[number] | null
  >("Flexi Cap");
  const categoryQuery = useQuery(categoryFundsQueryOptions(selectedCategory));

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
        Select a category to view eligible Direct Growth schemes. Results are alphabetical, not a
        performance ranking.
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
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <h3 className="text-lg font-semibold tracking-tight">{selectedCategory} schemes</h3>
            {categoryQuery.data ? (
              <p className="text-sm text-muted-foreground">
                {categoryQuery.data.schemes.length} shown · alphabetical
              </p>
            ) : null}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Active Direct Growth schemes with currently available provider data.
          </p>
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
                  <Link
                    href={`/fund/${scheme.schemeCode}`}
                    className="group block h-full rounded-xl focus-visible:outline-2 focus-visible:outline-ring"
                  >
                    <Card
                      size="sm"
                      className="h-full py-3 transition-colors group-hover:bg-muted/50"
                    >
                      <CardContent className="flex h-full flex-col">
                        <span className="font-medium underline-offset-4 group-hover:underline">
                          {scheme.schemeName}
                        </span>
                        <p className="mt-2 text-xs leading-5 text-muted-foreground">{scheme.amc}</p>
                        <span className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-foreground">
                          Open research <ArrowRightIcon className="size-3" aria-hidden="true" />
                        </span>
                      </CardContent>
                    </Card>
                  </Link>
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
    </section>
  );
}
