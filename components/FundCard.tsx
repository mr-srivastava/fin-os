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
import { cn, formatRupees, statusColorClass, type MetricStatus } from "@/lib/utils";

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
  return `₹${value.toLocaleString("en-IN", { maximumFractionDigits: 0 })} Cr`;
}

/**
 * Splits a scheme name like "DSP Focused Fund - Direct Plan - Growth" into a shorter
 * `title` and a `meta` string ("Direct · Growth"). Every scheme in the catalogue repeats
 * the same handful of plan/option suffixes, so leaving them in the title just makes every
 * card's headline the same length without adding anything to scan by. Falls back to the
 * untouched name (and `meta: null`) when the pattern isn't recognized, rather than mangling
 * unfamiliar naming.
 */
function parseSchemeName(name: string): { title: string; meta: string | null } {
  let title = name;

  const planMatch = title.match(/(Direct|Regular)\s*Plan\b/i);
  const plan = planMatch
    ? planMatch[1]!.charAt(0).toUpperCase() + planMatch[1]!.slice(1).toLowerCase()
    : null;
  if (planMatch) title = title.replace(planMatch[0]!, "");

  const optionMatch = title.match(/(Growth|IDCW|Dividend|Bonus)\s*(Option)?\b/i);
  const option = optionMatch
    ? optionMatch[1]!.charAt(0).toUpperCase() + optionMatch[1]!.slice(1).toLowerCase()
    : null;
  if (optionMatch) title = title.replace(optionMatch[0]!, "");

  title = title
    .replace(/\s*-\s*-\s*/g, " - ")
    .replace(/^[\s-]+|[\s-]+$/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();

  if (!title || !(plan || option)) return { title: name, meta: null };
  return { title, meta: [plan, option].filter(Boolean).join(" · ") };
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
  const returnStatus: MetricStatus =
    returnValue === null || returnValue === undefined
      ? "neutral"
      : returnValue > 0
        ? "gain"
        : returnValue < 0
          ? "loss"
          : "neutral";
  const aumText = formatAum(fund.aum);
  const navText = fund.navPoint ? formatRupees(fund.navPoint.nav) : null;
  const { title, meta } = parseSchemeName(fund.schemeName);

  const metrics = [
    returnText ? { value: returnText, label: returnLabel, status: returnStatus } : null,
    navText
      ? { value: navText, label: "NAV", status: "neutral" as const, help: TERM_DEFINITIONS.NAV }
      : null,
    aumText ? { value: aumText, label: "AUM", status: "neutral" as const } : null,
  ].filter((metric): metric is NonNullable<typeof metric> => metric !== null);

  return (
    <Card
      size="sm"
      data-density={density}
      className={cn(
        "group relative h-full py-3 ring-foreground/6 transition-[box-shadow,background-color,--tw-ring-color] duration-200 hover:bg-muted/40 hover:shadow-raised hover:ring-foreground/15",
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
            <p className="line-clamp-2 text-sm font-medium leading-snug" title={fund.schemeName}>
              {title}
            </p>
            <p className="mt-1 truncate text-xs leading-5 text-muted-foreground">
              {fund.amc}
              {meta ? <span className="text-muted-foreground/70"> · {meta}</span> : null}
            </p>
          </div>
          {watchlistAction ? (
            <span className="pointer-events-auto shrink-0">{watchlistAction}</span>
          ) : null}
        </div>

        {(showCategory && fund.category) || fund.riskLabel ? (
          <div className="flex flex-wrap items-center gap-1.5">
            {showCategory && fund.category ? (
              equityCategoryDefinition(fund.category) ? (
                <TermHelp
                  definition={equityCategoryDefinition(fund.category)!}
                  render={<Badge variant="outline" className="pointer-events-auto" />}
                >
                  {fund.category}
                </TermHelp>
              ) : (
                <Badge variant="outline">{fund.category}</Badge>
              )
            ) : null}
            {fund.riskLabel ? (
              riskLabelDefinition(fund.riskLabel) ? (
                <TermHelp
                  definition={riskLabelDefinition(fund.riskLabel)!}
                  render={<Badge variant="secondary" className="pointer-events-auto" />}
                >
                  {fund.riskLabel}
                </TermHelp>
              ) : (
                <Badge variant="secondary">{fund.riskLabel}</Badge>
              )
            ) : null}
          </div>
        ) : null}

        {metrics.length > 0 ? (
          <div className="mt-auto grid grid-cols-3 gap-2 border-t border-border/60 pt-2.5">
            {metrics.map((metric) => (
              <div key={metric.label} className="min-w-0">
                <p
                  className={cn(
                    "truncate font-mono text-sm leading-tight font-semibold tabular-nums",
                    metric.status !== "neutral"
                      ? statusColorClass(metric.status)
                      : "text-foreground",
                  )}
                >
                  {metric.value}
                </p>
                {metric.help ? (
                  <TermHelp
                    definition={metric.help}
                    className="pointer-events-auto text-[11px] leading-tight text-muted-foreground"
                  >
                    {metric.label}
                  </TermHelp>
                ) : (
                  <p className="text-[11px] leading-tight text-muted-foreground">
                    {metric.label === returnLabel ? `${returnLabel} Return` : metric.label}
                  </p>
                )}
              </div>
            ))}
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
