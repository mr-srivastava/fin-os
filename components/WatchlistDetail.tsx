"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeftIcon, ListXIcon } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { buttonVariants } from "@/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Spinner } from "@/components/ui/spinner";
import { FundCard } from "@/components/FundCard";
import { SelectionBar } from "@/components/SelectionBar";
import { removeWatchlistItem } from "@/lib/watchlist/watchlist.client";
import { watchlistDetailQueryOptions } from "@/lib/watchlist/watchlist.queries";
import { Button } from "@/components/ui/button";

export function WatchlistDetail({ id }: { id: string }) {
  const query = useQuery(watchlistDetailQueryOptions(id));
  const queryClient = useQueryClient();
  const [selectedSchemeCodes, setSelectedSchemeCodes] = useState<Set<string>>(new Set());

  const removeMutation = useMutation({
    mutationFn: (schemeCode: string) => removeWatchlistItem(id, schemeCode),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["watchlist", id] });
      queryClient.invalidateQueries({ queryKey: ["watchlists"] });
    },
  });

  function toggleSelection(schemeCode: string, selected: boolean) {
    setSelectedSchemeCodes((prev) => {
      const next = new Set(prev);
      if (selected) next.add(schemeCode);
      else next.delete(schemeCode);
      return next;
    });
  }

  return (
    <main id="main-content" className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      <Link href="/watchlists" className={buttonVariants({ variant: "ghost", size: "sm" })}>
        <ArrowLeftIcon data-icon="inline-start" />
        Back to watchlists
      </Link>

      {query.isLoading ? (
        <div className="mt-8 flex items-center gap-2 text-sm text-muted-foreground">
          <Spinner aria-label="Loading watchlist" /> Loading watchlist…
        </div>
      ) : query.isError ? (
        <Empty aria-live="polite" className="mt-8 min-h-40">
          <EmptyHeader>
            <EmptyTitle>Watchlist unavailable</EmptyTitle>
            <EmptyDescription>{query.error.message}</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : query.data ? (
        <>
          <header className="mt-6">
            <h1 className="font-heading text-3xl font-medium tracking-tight sm:text-4xl">
              {query.data.watchlist.name}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {query.data.watchlist.count} {query.data.watchlist.count === 1 ? "fund" : "funds"}
              {query.data.unavailableSchemeCodes.length
                ? ` · ${query.data.unavailableSchemeCodes.length} temporarily unavailable`
                : ""}
            </p>
            {removeMutation.isError ? (
              <output className="mt-2 block text-sm text-negative">
                {removeMutation.error.message}
              </output>
            ) : null}
          </header>
          <div className="mt-6">
            {query.data.funds.length ? (
              <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {query.data.funds.map((fund) => (
                  <li key={fund.schemeCode}>
                    <FundCard
                      fund={fund}
                      density="compact"
                      selectable
                      selected={selectedSchemeCodes.has(fund.schemeCode)}
                      onSelectChange={(selected) => toggleSelection(fund.schemeCode, selected)}
                      watchlistAction={
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`Remove ${fund.schemeName} from this watchlist`}
                          onClick={() => removeMutation.mutate(fund.schemeCode)}
                        >
                          <ListXIcon />
                        </Button>
                      }
                    />
                  </li>
                ))}
              </ul>
            ) : (
              <Empty className="min-h-40">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <ListXIcon />
                  </EmptyMedia>
                  <EmptyTitle>No funds in this list yet</EmptyTitle>
                  <EmptyDescription>
                    Select funds from Explore and add them to this watchlist.
                  </EmptyDescription>
                </EmptyHeader>
                <Link
                  href="/"
                  className="text-sm font-medium text-link underline-offset-4 hover:text-link-hover hover:underline"
                >
                  Go to Explore
                </Link>
              </Empty>
            )}
          </div>
          <SelectionBar
            selectedSchemeCodes={[...selectedSchemeCodes]}
            onClear={() => setSelectedSchemeCodes(new Set())}
          />
        </>
      ) : null}
    </main>
  );
}
