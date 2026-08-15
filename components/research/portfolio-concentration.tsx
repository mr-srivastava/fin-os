import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPercent } from "@/lib/utils";

/** Percentage points, where 100 represents 100%. */
export type PercentagePoints = number;

export function PortfolioConcentrationCard({ value }: { value: PercentagePoints }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Top-10 concentration</CardTitle>
        <CardDescription>
          Share of the reported portfolio held in its ten largest positions.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="font-mono text-2xl font-medium">{formatPercent(value / 100)}</p>
      </CardContent>
    </Card>
  );
}
