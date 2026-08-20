"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { AmcLogo } from "@/components/AmcLogo";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { TermHelp } from "@/components/TermHelp";
import { TERM_DEFINITIONS, equityCategoryDefinition, riskLabelDefinition } from "@/lib/glossary";
import { cn, formatRupees, statusColorClass } from "@/lib/utils";

/**
 * The card-displayable shape a fund can be rendered from. Financial metrics are optional
 * because the Explore grid is backed by the catalogue (`Scheme` - name/AMC/category only); the
 * Watchlist grid is backed by resolved `FundResearch` summaries that do carry them. A card
 * renders whichever fields it's given rather than requiring a richer shape than its data source
 * can supply.
 */
export interface FundCardData {
  schemeCode: string;
  schemeName: string;
  amc: string;
  category: string;
  riskLabel?: string | null;
  aum?: number | null;
  oneYearReturn?: number | null;
  threeYearReturn?: number | null;
  navPoint?: { nav: number; date: string } | null;
}

function formatPercent(value: number | null | undefined) {
  if (value === null || value === undefined) return null;
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(1)}%`;
}

function formatAum(value: number | null | undefined) {
  if (value === null || value === undefined) return null;
  return `₹${value.toLocaleString("en-IN", { maximumFractionDigits: 0 })} Cr AUM`;
}

/**
 * The risk label most funds in `schemes` share, or `null` if there's no clear majority (e.g. an
 * even split, or too few schemes to call it). Grids with many same-category funds - the equity
 * categories this app covers are almost all "Very High Risk" - can pass this to
 * {@link FundCard}'s `riskLabel` as `null` for the majority case, surfacing the badge only on
 * funds whose risk actually differs from their peers instead of repeating it on every card.
 */
export function majorityRiskLabel(
  schemes: readonly { riskLabel?: string | null }[],
): string | null {
  const counts = new Map<string, number>();
  for (const scheme of schemes) {
    if (scheme.riskLabel) counts.set(scheme.riskLabel, (counts.get(scheme.riskLabel) ?? 0) + 1);
  }
  let majority: string | null = null;
  let majorityCount = 0;
  for (const [label, count] of counts) {
    if (count > majorityCount) {
      majority = label;
      majorityCount = count;
    }
  }
  return majorityCount >= 2 ? majority : null;
}

interface FundCardProps {
  fund: FundCardData;
  density?: "compact" | "comparison";
  selectable?: boolean;
  selected?: boolean;
  onSelectChange?: (selected: boolean) => void;
  /** Slot for a watchlist toggle action (typically a `WatchlistPicker`-wrapped icon button). */
  watchlistAction?: ReactNode;
  /** Hide the category badge, e.g. when the surrounding grid is already filtered to one category. */
  showCategory?: boolean;
  /** Hide the AMC logo avatar, e.g. in dense grids where the AMC name below is enough. */
  showLogo?: boolean;
  className?: string;
}

export function FundCard({
  fund,
  density = "compact",
  selectable = false,
  selected = false,
  onSelectChange,
  watchlistAction,
  showCategory = true,
  showLogo = true,
  className,
}: FundCardProps) {
  const returnValue = fund.oneYearReturn ?? fund.threeYearReturn;
  const returnText = formatPercent(returnValue);
  const returnLabel = fund.oneYearReturn !== undefined && fund.oneYearReturn !== null ? "1Y" : "3Y";
  const returnStatus =
    returnValue === null || returnValue === undefined
      ? "neutral"
      : returnValue > 0
        ? "gain"
        : returnValue < 0
          ? "loss"
          : "neutral";
  const aumText = formatAum(fund.aum);
  const navText = fund.navPoint ? formatRupees(fund.navPoint.nav) : null;

  return (
    <Card
      size="sm"
      data-density={density}
      className={cn(
        "group relative h-full py-3 transition-[box-shadow,background-color] duration-200 hover:bg-muted/40 hover:shadow-raised",
        density === "comparison" && "min-w-[16rem]",
        className,
      )}
    >
      <Link
        href={`/fund/${fund.schemeCode}`}
        className="absolute inset-0 z-0 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label={fund.schemeName}
      />
      <CardContent className="pointer-events-none relative z-10 flex h-full flex-col gap-2.5">
        <div className="flex min-w-0 items-start gap-2">
          {selectable ? (
            <Checkbox
              className="pointer-events-auto mt-1 shrink-0"
              aria-label={`Select ${fund.schemeName}`}
              checked={selected}
              onCheckedChange={(checked) => onSelectChange?.(checked === true)}
            />
          ) : null}
          {showLogo ? <AmcLogo amc={fund.amc} size="sm" className="mt-0.5 shrink-0" /> : null}
          <div className="min-w-0 flex-1">
            <p className="line-clamp-2 font-medium" title={fund.schemeName}>
              {fund.schemeName}
            </p>
            <p className="mt-1 truncate text-xs leading-5 text-muted-foreground">{fund.amc}</p>
          </div>
          {watchlistAction ? (
            <span className="pointer-events-auto shrink-0">{watchlistAction}</span>
          ) : null}
        </div>

        {(showCategory && fund.category) || fund.riskLabel ? (
          <div className="flex flex-wrap items-center gap-1.5">
            {showCategory && fund.category ? (
              <span className="pointer-events-auto inline-flex items-center gap-1">
                <Badge variant="outline">{fund.category}</Badge>
                {equityCategoryDefinition(fund.category) ? (
                  <TermHelp
                    definition={equityCategoryDefinition(fund.category)!}
                    label={fund.category}
                  />
                ) : null}
              </span>
            ) : null}
            {fund.riskLabel ? (
              <span className="pointer-events-auto inline-flex items-center gap-1">
                <Badge variant="secondary">{fund.riskLabel}</Badge>
                {riskLabelDefinition(fund.riskLabel) ? (
                  <TermHelp
                    definition={riskLabelDefinition(fund.riskLabel)!}
                    label={fund.riskLabel}
                  />
                ) : null}
              </span>
            ) : null}
          </div>
        ) : null}

        {navText || returnText || aumText ? (
          <div className="space-y-0.5">
            {navText ? (
              <p className="font-mono text-base leading-tight font-semibold tabular-nums">
                {navText}
                <span className="pointer-events-auto ml-1.5 inline-flex items-center gap-1 text-xs font-normal text-muted-foreground">
                  NAV
                  <TermHelp definition={TERM_DEFINITIONS.NAV} label="NAV" />
                </span>
              </p>
            ) : returnText ? (
              <p
                className={cn(
                  "font-mono text-base leading-tight font-semibold tabular-nums",
                  statusColorClass(returnStatus),
                )}
              >
                {returnText}
                <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                  {returnLabel}
                </span>
              </p>
            ) : null}
            {(navText && returnText) || aumText ? (
              <p className="flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
                {navText && returnText ? (
                  <span>
                    <span className={statusColorClass(returnStatus)}>{returnText}</span>{" "}
                    {returnLabel}
                  </span>
                ) : null}
                {aumText ? <span>{aumText}</span> : null}
              </p>
            ) : null}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

/** Placeholder matching FundCard's layout, sized for the reduced (no logo, no category) explore-grid variant. */
export function FundCardSkeleton({
  selectable = false,
  showLogo = false,
  showWatchlistAction = false,
}: {
  selectable?: boolean;
  showLogo?: boolean;
  showWatchlistAction?: boolean;
}) {
  return (
    <Card size="sm" className="h-full py-3" aria-hidden="true">
      <CardContent className="flex h-full flex-col gap-2.5">
        <div className="flex min-w-0 items-start gap-2">
          {selectable ? <Skeleton className="mt-1 size-4 shrink-0 rounded-sm" /> : null}
          {showLogo ? <Skeleton className="mt-0.5 size-8 shrink-0 rounded-full" /> : null}
          <div className="min-w-0 flex-1 space-y-2 py-0.5">
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="h-3 w-2/5" />
          </div>
          {showWatchlistAction ? <Skeleton className="size-8 shrink-0 rounded-md" /> : null}
        </div>
      </CardContent>
    </Card>
  );
}
