"use client";

import { BookmarkPlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WatchlistPicker } from "@/components/WatchlistPicker";

/** Small icon-button entry point into `WatchlistPicker` for a single fund, used on `FundCard`. */
export function WatchlistToggleButton({ schemeCode }: { schemeCode: string }) {
  return (
    <WatchlistPicker schemeCodes={[schemeCode]}>
      <Button variant="ghost" size="icon-sm" aria-label="Add to watchlist">
        <BookmarkPlusIcon />
      </Button>
    </WatchlistPicker>
  );
}
