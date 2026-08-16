"use client";

import { useQuery } from "@tanstack/react-query";
import { SearchIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useId, useState } from "react";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { InputGroupAddon } from "@/components/ui/input-group";
import { Spinner } from "@/components/ui/spinner";
import type { Scheme } from "@/lib/fund-types";
import { isSearchQuery } from "@/lib/fund-input";
import { schemeSearchQueryOptions } from "@/lib/fund-queries";
import { cn } from "@/lib/utils";

type FundSearchProps =
  | { compact?: boolean; onSelect: (scheme: Scheme) => void }
  | { compact?: boolean; onSelect?: never };

const SEARCH_DEBOUNCE_MS = 300;

export function FundSearch({ compact = false, onSelect }: FundSearchProps) {
  const inputId = useId();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const trimmedQuery = query.trim();

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedQuery(trimmedQuery), SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(timeout);
  }, [trimmedQuery]);

  const searchQuery = useQuery(schemeSearchQueryOptions(debouncedQuery));
  const canSearch = isSearchQuery(trimmedQuery);
  const isWaitingToSearch = canSearch && trimmedQuery !== debouncedQuery;
  const schemes = !isWaitingToSearch ? (searchQuery.data?.schemes ?? []) : [];
  const message = searchQuery.isError
    ? searchQuery.error.message
    : canSearch && !isWaitingToSearch && searchQuery.isSuccess && !schemes.length
      ? "No eligible Direct Growth equity schemes matched that search."
      : "";
  const isLoading = isWaitingToSearch || searchQuery.isFetching;

  function chooseScheme(scheme: Scheme) {
    if (onSelect) {
      onSelect(scheme);
      return;
    }
    router.push(`/fund/${scheme.schemeCode}`);
  }

  return (
    <div className={cn("w-full max-w-2xl", !compact && "mt-8")}>
      <FieldGroup>
        <Field orientation="horizontal" data-invalid={Boolean(message)}>
          <FieldLabel className="sr-only" htmlFor={inputId}>
            Search mutual funds
          </FieldLabel>
          <Combobox<Scheme>
            items={schemes}
            filter={null}
            inputValue={query}
            itemToStringLabel={(scheme) => scheme.schemeName}
            itemToStringValue={(scheme) => scheme.schemeCode}
            autoHighlight
            onInputValueChange={setQuery}
            onValueChange={(scheme) => {
              if (scheme) chooseScheme(scheme);
            }}
          >
            <ComboboxInput
              id={inputId}
              name="fund-search"
              type="search"
              placeholder="Search a mutual fund, e.g. Parag Parikh…"
              autoComplete="off"
              spellCheck={false}
              aria-invalid={Boolean(message)}
              showTrigger={false}
              className={cn("h-11", !compact && "text-base")}
            >
              <InputGroupAddon align="inline-start">
                <SearchIcon aria-hidden="true" />
              </InputGroupAddon>
            </ComboboxInput>
            {canSearch ? (
              <ComboboxContent>
                {isLoading ? (
                  <div className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground">
                    <Spinner aria-label="Searching funds" />
                    Searching funds…
                  </div>
                ) : (
                  <>
                    <ComboboxEmpty>No eligible schemes available.</ComboboxEmpty>
                    <ComboboxList>
                      {(scheme: Scheme) => (
                        <ComboboxItem key={scheme.schemeCode} value={scheme}>
                          <span className="flex flex-col items-start gap-0.5">
                            <span className="font-medium">{scheme.schemeName}</span>
                            <span className="text-xs text-muted-foreground">
                              {scheme.amc} · {scheme.category}
                            </span>
                          </span>
                        </ComboboxItem>
                      )}
                    </ComboboxList>
                  </>
                )}
              </ComboboxContent>
            ) : null}
          </Combobox>
        </Field>
        {message && <FieldError>{message}</FieldError>}
      </FieldGroup>
    </div>
  );
}
