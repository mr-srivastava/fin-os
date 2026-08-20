import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
export function PortfolioConcentrationCard({ valueText }: { valueText: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Top-10 concentration</CardTitle>
        <CardDescription>
          Share of the reported portfolio held in its ten largest positions.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="font-mono text-xl font-semibold tabular-nums">{valueText}</p>
      </CardContent>
    </Card>
  );
}
