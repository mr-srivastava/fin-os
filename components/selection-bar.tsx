"use client";

import { useRouter } from "next/navigation";
import { GitCompareArrowsIcon, ListPlusIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WatchlistPicker } from "@/components/watchlist-picker";

/**
 * Sticky bulk-action bar for a set of selected funds. Compare is a UI entry point into the
 * existing `/fund/[schemeCode]?against=` comparison mechanism (2 funds only, per
 * research-route-state.ts) - not a new N-way comparison feature.
 */
export function SelectionBar({
  selectedSchemeCodes,
  onClear,
}: {
  selectedSchemeCodes: readonly string[];
  onClear: () => void;
}) {
  const router = useRouter();
  if (selectedSchemeCodes.length === 0) return null;

  const canCompare = selectedSchemeCodes.length === 2;

  return (
    <div className="fixed inset-x-0 bottom-4 z-40 flex justify-center px-4">
      <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-2.5 shadow-lg ring-1 ring-foreground/10">
        <span className="text-sm font-medium">{selectedSchemeCodes.length} selected</span>
        <Button
          variant="outline"
          size="sm"
          disabled={!canCompare}
          title={canCompare ? undefined : "Select exactly 2 funds to compare"}
          onClick={() => {
            if (!canCompare) return;
            const [fund, against] = selectedSchemeCodes;
            router.push(`/compare?codes=${fund},${against}`);
          }}
        >
          <GitCompareArrowsIcon data-icon="inline-start" />
          Compare
        </Button>
        <WatchlistPicker schemeCodes={selectedSchemeCodes}>
          <Button variant="outline" size="sm">
            <ListPlusIcon data-icon="inline-start" />
            Watchlist
          </Button>
        </WatchlistPicker>
        <Button variant="ghost" size="sm" onClick={onClear}>
          <XIcon data-icon="inline-start" />
          Clear
        </Button>
      </div>
    </div>
  );
}
