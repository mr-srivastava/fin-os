"use client";

import { PlusIcon } from "lucide-react";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Spinner } from "@/components/ui/spinner";
import {
  addWatchlistItem,
  createWatchlist,
  removeWatchlistItem,
} from "@/lib/watchlist/watchlist.client";
import { watchlistsQueryOptions } from "@/lib/watchlist/watchlist.queries";

interface WatchlistPickerProps {
  /** One fund (card action) or several (selection-bar bulk add). */
  schemeCodes: readonly string[];
  children: React.ReactElement;
}

export function WatchlistPicker({ schemeCodes, children }: WatchlistPickerProps) {
  const queryClient = useQueryClient();
  const watchlistsQuery = useQuery(watchlistsQueryOptions);
  const [newListName, setNewListName] = useState("");
  const [addedTo, setAddedTo] = useState<Set<string>>(new Set());

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["watchlists"] });
    queryClient.invalidateQueries({ queryKey: ["watchlist"] });
  };

  const addMutation = useMutation({
    mutationFn: (watchlistId: string) =>
      Promise.all(schemeCodes.map((schemeCode) => addWatchlistItem(watchlistId, schemeCode))),
    onSuccess: (_result, watchlistId) => {
      setAddedTo((prev) => new Set(prev).add(watchlistId));
      invalidate();
    },
  });

  const removeMutation = useMutation({
    mutationFn: (watchlistId: string) =>
      Promise.all(schemeCodes.map((schemeCode) => removeWatchlistItem(watchlistId, schemeCode))),
    onSuccess: (_result, watchlistId) => {
      setAddedTo((prev) => {
        const next = new Set(prev);
        next.delete(watchlistId);
        return next;
      });
      invalidate();
    },
  });

  const createMutation = useMutation({
    mutationFn: (name: string) => createWatchlist(name),
    onSuccess: async (result) => {
      if (!result.ok) return;
      setNewListName("");
      invalidate();
      await addMutation.mutateAsync(result.data.watchlist.id);
    },
  });

  function toggle(watchlistId: string, checked: boolean) {
    if (checked) addMutation.mutate(watchlistId);
    else removeMutation.mutate(watchlistId);
  }

  const mutationError = addMutation.isError
    ? addMutation.error.message
    : removeMutation.isError
      ? removeMutation.error.message
      : createMutation.isError
        ? createMutation.error.message
        : null;

  return (
    <Popover>
      <PopoverTrigger render={children} />
      <PopoverContent className="w-80">
        <p className="text-sm font-medium">Add to watchlist</p>
        <p className="mt-1 text-xs text-muted-foreground">
          {schemeCodes.length > 1 ? `${schemeCodes.length} funds selected` : "This fund"} — for
          research triage, not investment recommendations.
        </p>
        {mutationError ? (
          <output className="mt-2 block text-xs text-negative">{mutationError}</output>
        ) : null}
        <div className="mt-3 flex max-h-56 flex-col gap-2 overflow-y-auto">
          {watchlistsQuery.isLoading ? (
            <div className="flex items-center gap-2 py-2 text-sm text-muted-foreground">
              <Spinner aria-label="Loading watchlists" /> Loading…
            </div>
          ) : watchlistsQuery.data?.watchlists.length ? (
            watchlistsQuery.data.watchlists.map((watchlist) => {
              const checked = addedTo.has(watchlist.id);
              return (
                <label
                  key={watchlist.id}
                  className="flex cursor-pointer items-center justify-between gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted"
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <Checkbox
                      checked={checked}
                      onCheckedChange={(next) => toggle(watchlist.id, next === true)}
                    />
                    <span className="truncate">{watchlist.name}</span>
                  </span>
                  <span className="shrink-0 text-xs text-muted-foreground">{watchlist.count}</span>
                </label>
              );
            })
          ) : (
            <p className="py-2 text-sm text-muted-foreground">
              No watchlists yet. Create one below.
            </p>
          )}
        </div>
        <form
          className="mt-3 flex items-center gap-2 border-t pt-3"
          onSubmit={(event) => {
            event.preventDefault();
            const name = newListName.trim();
            if (name) createMutation.mutate(name);
          }}
        >
          <Input
            value={newListName}
            onChange={(event) => setNewListName(event.target.value)}
            placeholder="New list name…"
            aria-label="New watchlist name"
            className="h-8"
          />
          <Button
            type="submit"
            size="icon-sm"
            variant="outline"
            disabled={!newListName.trim() || createMutation.isPending}
            aria-label="Create watchlist"
          >
            <PlusIcon />
          </Button>
        </form>
      </PopoverContent>
    </Popover>
  );
}
