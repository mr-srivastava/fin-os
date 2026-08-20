"use client";

import { useState } from "react";
import { PlusIcon } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { createWatchlist } from "@/lib/watchlist/watchlist.client";

export function CreateWatchlistForm() {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const mutation = useMutation({
    mutationFn: (value: string) => createWatchlist(value),
    onSuccess: (result) => {
      if (!result.ok) return;
      setName("");
      queryClient.invalidateQueries({ queryKey: ["watchlists"] });
    },
  });

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        const trimmed = name.trim();
        if (trimmed) mutation.mutate(trimmed);
      }}
    >
      <FieldGroup>
        <Field orientation="horizontal">
          <FieldLabel className="sr-only" htmlFor="new-watchlist-name">
            New watchlist name
          </FieldLabel>
          <Input
            id="new-watchlist-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="e.g. Client: Sharma family"
          />
          <Button type="submit" disabled={!name.trim() || mutation.isPending}>
            <PlusIcon data-icon="inline-start" />
            New list
          </Button>
        </Field>
      </FieldGroup>
    </form>
  );
}
