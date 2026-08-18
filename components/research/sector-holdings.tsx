import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { SectorDisplay } from "@/lib/research-display/types";

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
        <Separator />
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
                  {sector.holdings.length ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Holding</TableHead>
                          <TableHead className="text-right">Weight</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sector.holdings.map((holding) => (
                          <TableRow key={`${sector.name}-${holding.name}-${holding.weightText}`}>
                            <TableCell className="font-medium">{holding.name}</TableCell>
                            <TableCell className="text-right font-mono">
                              {holding.weightText}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <p className="px-3 text-sm text-muted-foreground">
                      No holdings were supplied for this sector.
                    </p>
                  )}
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </CardContent>
    </Card>
  );
}
