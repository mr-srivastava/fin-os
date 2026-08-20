"use client";

import Link from "next/link";
import { useState } from "react";
import { CheckIcon, ListIcon, PencilIcon, TrashIcon, XIcon } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogClose,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { deleteWatchlist, renameWatchlist } from "@/lib/watchlist/watchlist.client";
import { watchlistsQueryOptions } from "@/lib/watchlist/watchlist.queries";
import { CreateWatchlistForm } from "@/components/CreateWatchlistForm";

export function WatchlistsIndex() {
  const query = useQuery(watchlistsQueryOptions);
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["watchlists"] });

  const renameMutation = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => renameWatchlist(id, name),
    onSuccess: () => {
      setEditingId(null);
      invalidate();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteWatchlist(id),
    onSuccess: invalidate,
  });

  const renameError = renameMutation.isError ? renameMutation.error.message : null;

  return (
    <main id="main-content" className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      <header>
        <p className="font-mono text-xs tracking-[0.18em] text-brand uppercase">
          Distributor lists
        </p>
        <h1 className="mt-2 font-heading text-3xl font-medium tracking-tight sm:text-4xl">
          Watchlists
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
          Named lists of funds for research triage - e.g. by client or mandate. Watchlists are
          neutral research shortlists, not investment recommendations.
        </p>
      </header>

      <div className="mt-8 max-w-sm">
        <CreateWatchlistForm />
      </div>

      <div className="mt-8">
        {deleteMutation.isError ? (
          <output className="mb-3 block text-sm text-negative">
            {deleteMutation.error.message}
          </output>
        ) : null}
        {query.isLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Spinner aria-label="Loading watchlists" /> Loading watchlists…
          </div>
        ) : query.isError ? (
          <p className="text-sm text-negative">{query.error.message}</p>
        ) : query.data?.watchlists.length ? (
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {query.data.watchlists.map((watchlist) => (
              <li key={watchlist.id}>
                <Card size="sm" className="h-full py-3">
                  <CardContent className="flex h-full flex-col gap-3">
                    {editingId === watchlist.id ? (
                      <div>
                        <form
                          className="flex items-center gap-2"
                          onSubmit={(event) => {
                            event.preventDefault();
                            const name = editingName.trim();
                            if (name) renameMutation.mutate({ id: watchlist.id, name });
                          }}
                        >
                          <Input
                            value={editingName}
                            onChange={(event) => setEditingName(event.target.value)}
                            aria-label="Watchlist name"
                            className="h-8"
                          />
                          <Button
                            type="submit"
                            size="icon-sm"
                            variant="outline"
                            aria-label="Save name"
                          >
                            <CheckIcon />
                          </Button>
                          <Button
                            type="button"
                            size="icon-sm"
                            variant="ghost"
                            aria-label="Cancel"
                            onClick={() => setEditingId(null)}
                          >
                            <XIcon />
                          </Button>
                        </form>
                        {renameError && editingId === watchlist.id ? (
                          <output className="mt-1.5 block text-xs text-negative">
                            {renameError}
                          </output>
                        ) : null}
                      </div>
                    ) : (
                      <div className="flex items-start justify-between gap-2">
                        <Link
                          href={`/watchlists/${watchlist.id}`}
                          className="min-w-0 flex-1 font-medium underline-offset-4 hover:underline"
                        >
                          {watchlist.name}
                        </Link>
                        <div className="flex shrink-0 items-center gap-1">
                          <Button
                            size="icon-sm"
                            variant="ghost"
                            aria-label={`Rename ${watchlist.name}`}
                            onClick={() => {
                              setEditingId(watchlist.id);
                              setEditingName(watchlist.name);
                            }}
                          >
                            <PencilIcon />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger
                              render={
                                <Button
                                  size="icon-sm"
                                  variant="ghost"
                                  aria-label={`Delete ${watchlist.name}`}
                                />
                              }
                            >
                              <TrashIcon />
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete “{watchlist.name}”?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This removes the list and its fund selections. This can’t be
                                  undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogClose>Cancel</AlertDialogClose>
                                <AlertDialogAction
                                  onClick={() => deleteMutation.mutate(watchlist.id)}
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {watchlist.count} {watchlist.count === 1 ? "fund" : "funds"}
                    </p>
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        ) : (
          <Empty className="min-h-40">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <ListIcon />
              </EmptyMedia>
              <EmptyTitle>No watchlists yet</EmptyTitle>
              <EmptyDescription>
                Create a list above, or select funds from Explore and add them to a new list.
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
    </main>
  );
}
