import { useState } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { SectorDisplay } from "@/lib/research-display/types";

const VISIBLE_HOLDINGS = 6;

function HoldingsList({
  sectorName,
  holdings,
}: {
  sectorName: string;
  holdings: SectorDisplay["holdings"];
}) {
  const [expanded, setExpanded] = useState(false);
  if (!holdings.length)
    return (
      <p className="text-sm text-muted-foreground">No holdings were supplied for this sector.</p>
    );
  const visible = expanded ? holdings : holdings.slice(0, VISIBLE_HOLDINGS);
  const hiddenCount = holdings.length - visible.length;
  const topWeight = Math.max(...holdings.map((holding) => holding.weight));
  return (
    <div>
      <div className="flex flex-col gap-2">
        {visible.map((holding) => (
          <div key={`${sectorName}-${holding.name}`} className="flex items-center gap-3 text-sm">
            <span className="min-w-0 flex-1 truncate" title={holding.name}>
              {holding.name}
            </span>
            <div className="h-1.5 w-16 shrink-0 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-foreground/60"
                style={{ width: `${topWeight > 0 ? (holding.weight / topWeight) * 100 : 0}%` }}
              />
            </div>
            <span className="w-14 shrink-0 text-right font-mono text-muted-foreground tabular-nums">
              {holding.weightText}
            </span>
          </div>
        ))}
      </div>
      {hiddenCount > 0 || expanded ? (
        <Button
          variant="link"
          size="sm"
          className="mt-2 h-auto p-0 text-xs"
          onClick={() => setExpanded((current) => !current)}
        >
          {expanded ? "Show fewer" : `Show ${hiddenCount} more`}
        </Button>
      ) : null}
    </div>
  );
}

export function SectorHoldings({ sectors }: { sectors: readonly SectorDisplay[] }) {
  if (!sectors.length) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sector allocation and holdings</CardTitle>
        <CardDescription>
          Largest reported sector exposures, with the holdings within each sector.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Accordion multiple>
          {sectors.map((sector) => {
            return (
              <AccordionItem
                key={sector.name}
                value={sector.name}
                className="border-b last:border-b-0"
              >
                <AccordionTrigger className="items-center gap-3 py-3 hover:no-underline">
                  <span className="min-w-0 flex-1">{sector.name}</span>
                  <span className="font-mono text-muted-foreground">{sector.weightText}</span>
                </AccordionTrigger>
                <AccordionContent className="pb-3">
                  <HoldingsList sectorName={sector.name} holdings={sector.holdings} />
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </CardContent>
    </Card>
  );
}
