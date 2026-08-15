"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { SearchIcon } from "lucide-react";
import { useId, useState } from "react";
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

export function FundSearch({ compact = false, onSelect }: FundSearchProps) {
  const inputId = useId();
  const [query, setQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [validationMessage, setValidationMessage] = useState("");
  const searchQuery = useQuery(schemeSearchQueryOptions(submittedQuery));
  const schemes = searchQuery.data?.schemes ?? [];
  const message =
    validationMessage ||
    (searchQuery.isError
      ? searchQuery.error.message
      : submittedQuery && searchQuery.isSuccess && !schemes.length
        ? "No eligible Direct Growth equity schemes matched that search."
        : "");

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const term = query.trim();
    if (!isSearchQuery(term)) return setValidationMessage("Enter 2–80 characters to search funds.");
    setValidationMessage("");
    if (term === submittedQuery) void searchQuery.refetch();
    else setSubmittedQuery(term);
  }

  return (
    <div className={cn("w-full max-w-2xl", !compact && "mt-8")}>
      <form onSubmit={submit}>
        <FieldGroup>
          <Field orientation="horizontal" data-invalid={Boolean(message)}>
            <label className="sr-only" htmlFor={inputId}>
              Search mutual funds
            </label>
            <Input
              id={inputId}
              name="fund-search"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setValidationMessage("");
              }}
              placeholder="Search a mutual fund, e.g. Parag Parikh…"
              autoComplete="off"
              spellCheck={false}
              aria-invalid={Boolean(message)}
              className={cn("h-11", !compact && "text-base")}
            />
            <Button type="submit" disabled={searchQuery.isFetching} className="h-11 shrink-0">
              {searchQuery.isFetching ? (
                <Spinner data-icon="inline-start" />
              ) : (
                <SearchIcon data-icon="inline-start" />
              )}
              Search
            </Button>
          </Field>
          {message && <FieldError>{message}</FieldError>}
        </FieldGroup>
      </form>
      {schemes.length > 0 && (
        <div className="mt-3 flex flex-col gap-1 rounded-lg border p-1">
          {schemes.map((scheme) =>
            onSelect ? (
              <Button
                key={scheme.schemeCode}
                variant="ghost"
                className="h-auto justify-start px-3 py-2 text-left"
                onClick={() => onSelect(scheme)}
                type="button"
              >
                <span className="flex flex-col items-start gap-0.5">
                  <span className="font-medium">{scheme.schemeName}</span>
                  <span className="text-xs text-muted-foreground">
                    {scheme.amc} · {scheme.category}
                  </span>
                </span>
              </Button>
            ) : (
              <Link
                key={scheme.schemeCode}
                className={cn(
                  buttonVariants({ variant: "ghost" }),
                  "h-auto justify-start px-3 py-2 text-left",
                )}
                href={`/fund/${scheme.schemeCode}`}
              >
                <span className="flex flex-col items-start gap-0.5">
                  <span className="font-medium">{scheme.schemeName}</span>
                  <span className="text-xs text-muted-foreground">
                    {scheme.amc} · {scheme.category}
                  </span>
                </span>
              </Link>
            ),
          )}
        </div>
      )}
    </div>
  );
}
