"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { SearchIcon } from "lucide-react";
import { useEffect, useId, useState } from "react";
import type { Scheme } from "@/lib/fund-types";
import { isSearchQuery } from "@/lib/fund-input";
import { schemeSearchQueryOptions } from "@/lib/fund-queries";
import { Button, buttonVariants } from "@/components/ui/button";
import { Field, FieldError, FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

type FundSearchProps =
  | { compact?: boolean; onSelect: (scheme: Scheme) => void }
  | { compact?: boolean; onSelect?: never };

const SEARCH_DEBOUNCE_MS = 300;

export function FundSearch({ compact = false, onSelect }: FundSearchProps) {
  const inputId = useId();
  const listboxId = useId();
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const trimmedQuery = query.trim();

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedQuery(trimmedQuery), SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(timeout);
  }, [trimmedQuery]);

  const searchQuery = useQuery(schemeSearchQueryOptions(debouncedQuery));
  const canSearch = isSearchQuery(trimmedQuery);
  const isWaitingToSearch = canSearch && trimmedQuery !== debouncedQuery;
  const schemes = !isWaitingToSearch ? (searchQuery.data?.schemes ?? []) : [];
  const hasSuggestions =
    isOpen && canSearch && (isWaitingToSearch || searchQuery.isFetching || schemes.length > 0);
  const resultStatus =
    canSearch && !isWaitingToSearch && searchQuery.isSuccess
      ? schemes.length
        ? `${schemes.length} eligible ${schemes.length === 1 ? "scheme" : "schemes"} available.`
        : "No eligible schemes available."
      : "";
  const message = searchQuery.isError
    ? searchQuery.error.message
    : canSearch && !isWaitingToSearch && searchQuery.isSuccess && !schemes.length
      ? "No eligible Direct Growth equity schemes matched that search."
      : "";

  function chooseScheme(scheme: Scheme) {
    setIsOpen(false);
    setActiveIndex(-1);
    onSelect?.(scheme);
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      setIsOpen(false);
      setActiveIndex(-1);
      return;
    }
    if (!schemes.length) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setIsOpen(true);
      setActiveIndex((index) => (index + 1) % schemes.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setIsOpen(true);
      setActiveIndex((index) => (index <= 0 ? schemes.length - 1 : index - 1));
    } else if (event.key === "Enter" && activeIndex >= 0) {
      event.preventDefault();
      const scheme = schemes[activeIndex];
      if (scheme) chooseScheme(scheme);
    }
  }

  return (
    <div className={cn("w-full max-w-2xl", !compact && "mt-8")}>
      <FieldGroup>
        <Field orientation="horizontal" data-invalid={Boolean(message)}>
          <label className="sr-only" htmlFor={inputId}>
            Search mutual funds
          </label>
          <div
            className="relative w-full"
            onBlur={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget)) {
                setIsOpen(false);
                setActiveIndex(-1);
              }
            }}
          >
            <SearchIcon
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              id={inputId}
              name="fund-search"
              type="search"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setIsOpen(true);
                setActiveIndex(-1);
              }}
              onFocus={() => setIsOpen(true)}
              onKeyDown={onKeyDown}
              placeholder="Search a mutual fund, e.g. Parag Parikh…"
              autoComplete="off"
              spellCheck={false}
              aria-controls={hasSuggestions ? listboxId : undefined}
              aria-expanded={hasSuggestions}
              aria-invalid={Boolean(message)}
              className={cn("h-11 pl-9", !compact && "text-base")}
            />
            {hasSuggestions && (
              <ul
                id={listboxId}
                aria-label="Fund suggestions"
                className="absolute z-10 mt-1 flex w-full list-none flex-col gap-1 rounded-lg border bg-background p-1 shadow-sm"
              >
                {isWaitingToSearch || searchQuery.isFetching ? (
                  <li className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground">
                    <Spinner aria-label="Searching funds" />
                    Searching funds…
                  </li>
                ) : (
                  schemes.map((scheme, index) => {
                    const content = (
                      <span className="flex flex-col items-start gap-0.5">
                        <span className="font-medium">{scheme.schemeName}</span>
                        <span className="text-xs text-muted-foreground">
                          {scheme.amc} · {scheme.category}
                        </span>
                      </span>
                    );
                    const className = cn(
                      "h-auto justify-start px-3 py-2 text-left",
                      activeIndex === index && "bg-accent text-accent-foreground",
                    );

                    return (
                      <li key={scheme.schemeCode}>
                        {onSelect ? (
                          <Button
                            id={`${listboxId}-${index}`}
                            variant="ghost"
                            className={className}
                            onClick={() => chooseScheme(scheme)}
                            type="button"
                          >
                            {content}
                          </Button>
                        ) : (
                          <Link
                            id={`${listboxId}-${index}`}
                            className={cn(buttonVariants({ variant: "ghost" }), className)}
                            href={`/fund/${scheme.schemeCode}`}
                            onClick={() => setIsOpen(false)}
                          >
                            {content}
                          </Link>
                        )}
                      </li>
                    );
                  })
                )}
              </ul>
            )}
          </div>
        </Field>
        {message && <FieldError>{message}</FieldError>}
      </FieldGroup>
      <p className="sr-only" aria-live="polite" aria-atomic="true">
        {resultStatus}
      </p>
    </div>
  );
}
