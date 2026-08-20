import Link from "next/link";
import { GitCompareArrowsIcon } from "lucide-react";
import { FundCard, majorityRiskLabel } from "@/components/FundCard";
import { buttonVariants } from "@/components/ui/button";
import type { RelatedFundDisplay } from "@/lib/research-display/types";
import { toFundResearchHref } from "@/lib/researchRouteState";

export function RelatedFundLinks({
  title,
  funds,
  primarySchemeCode,
}: {
  title: string;
  funds: readonly RelatedFundDisplay[];
  primarySchemeCode: string;
}) {
  const commonRisk = majorityRiskLabel(funds);
  return (
    <section aria-label={title}>
      <h2 className="text-sm font-semibold">{title}</h2>
      <ul className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {funds.map((fund) => (
          <li key={fund.schemeCode} className="relative">
            <FundCard
              fund={{
                schemeCode: fund.schemeCode,
                schemeName: fund.schemeName,
                amc: fund.amc,
                category: fund.category,
                riskLabel: fund.riskLabel === commonRisk ? null : fund.riskLabel,
                aum: fund.aum,
                navPoint: fund.nav,
              }}
              density="compact"
            />
            <Link
              className={buttonVariants({
                variant: "ghost",
                size: "icon-sm",
                className: "pointer-events-auto absolute top-3 right-3 z-10",
              })}
              href={toFundResearchHref(primarySchemeCode, {
                range: "3y",
                showBenchmark: false,
                against: fund.schemeCode,
              })}
              aria-label={`Compare with ${fund.schemeName}`}
            >
              <GitCompareArrowsIcon />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
