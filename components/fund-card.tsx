"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRightIcon } from "lucide-react";
import { AmcLogo } from "@/components/amc-logo";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { cn, statusColorClass } from "@/lib/utils";

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

interface FundCardProps {
  fund: FundCardData;
  density?: "compact" | "comparison";
  selectable?: boolean;
  selected?: boolean;
  onSelectChange?: (selected: boolean) => void;
  /** Slot for a watchlist toggle action (typically a `WatchlistPicker`-wrapped icon button). */
  watchlistAction?: ReactNode;
  className?: string;
}

export function FundCard({
  fund,
  density = "compact",
  selectable = false,
  selected = false,
  onSelectChange,
  watchlistAction,
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
      <CardContent className="pointer-events-none relative z-10 flex h-full flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            {selectable ? (
              <Checkbox
                className="pointer-events-auto"
                aria-label={`Select ${fund.schemeName}`}
                checked={selected}
                onCheckedChange={(checked) => onSelectChange?.(checked === true)}
              />
            ) : null}
            <Badge variant="outline">{fund.category}</Badge>
            {fund.riskLabel ? <Badge variant="secondary">{fund.riskLabel}</Badge> : null}
          </div>
          {watchlistAction ? <span className="pointer-events-auto">{watchlistAction}</span> : null}
        </div>

        <div className="flex min-w-0 flex-1 items-start gap-2">
          <AmcLogo amc={fund.amc} size="sm" className="mt-0.5" />
          <div className="min-w-0">
            <p className="font-medium">{fund.schemeName}</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">{fund.amc}</p>
          </div>
        </div>

        {returnText || aumText ? (
          <div className="flex items-center gap-4 text-sm">
            {returnText ? (
              <span>
                <span
                  className={cn(
                    "font-mono font-semibold tabular-nums",
                    statusColorClass(returnStatus),
                  )}
                >
                  {returnText}
                </span>{" "}
                <span className="text-xs text-muted-foreground">{returnLabel}</span>
              </span>
            ) : null}
            {aumText ? <span className="text-xs text-muted-foreground">{aumText}</span> : null}
          </div>
        ) : null}

        <span className="mt-auto inline-flex items-center gap-1 text-xs font-medium text-foreground">
          View details <ArrowRightIcon className="size-3" aria-hidden="true" />
        </span>
      </CardContent>
    </Card>
  );
}
