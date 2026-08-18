import Link from "next/link";
import { GitCompareArrowsIcon } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { toFundResearchHref } from "@/lib/research-route-state";

export function RelatedFundLinks({
  title,
  funds,
  primarySchemeCode,
}: {
  title: string;
  funds: readonly { schemeCode: string; schemeName: string; amc: string; category: string }[];
  primarySchemeCode: string;
}) {
  return (
    <section aria-label={title}>
      <h2 className="text-sm font-semibold">{title}</h2>
      <ul className="mt-3 flex flex-col gap-3">
        {funds.map((fund) => (
          <li key={fund.schemeCode} className="rounded-lg border bg-muted/20 p-3">
            <Link
              className="text-sm font-medium underline-offset-4 hover:underline"
              href={`/fund/${fund.schemeCode}`}
            >
              {fund.schemeName}
            </Link>
            <p className="mt-1 text-xs text-muted-foreground">
              {fund.amc} · {fund.category}
            </p>
            <Link
              className={buttonVariants({ variant: "outline", size: "sm", className: "mt-3" })}
              href={toFundResearchHref(primarySchemeCode, {
                range: "3y",
                showBenchmark: false,
                against: fund.schemeCode,
              })}
            >
              <GitCompareArrowsIcon data-icon="inline-start" />
              Compare
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
