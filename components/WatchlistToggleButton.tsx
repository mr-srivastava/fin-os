"use client";

import { BookmarkIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WatchlistPicker } from "@/components/WatchlistPicker";

/** Entry point into `WatchlistPicker` for a single fund. Icon-only by default (used on `FundCard`); pass `label` for a labeled button (used on `FundResearch`). */
export function WatchlistToggleButton({
  schemeCode,
  label,
}: {
  schemeCode: string;
  label?: string;
}) {
  return (
    <WatchlistPicker schemeCodes={[schemeCode]}>
      {label ? (
        <Button variant="outline" size="sm">
          <BookmarkIcon data-icon="inline-start" />
          {label}
        </Button>
      ) : (
        <Button variant="ghost" size="icon-sm" aria-label="Add to watchlist">
          <BookmarkIcon />
        </Button>
      )}
    </WatchlistPicker>
  );
}
