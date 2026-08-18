import Link from "next/link";
import { redirect } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { parseComparisonSearchParams, toFundResearchHref } from "@/lib/research-route-state";

/**
 * `/compare` is not a nav destination - it's reached only via selecting funds elsewhere
 * (`?codes=A,B` from the Explore/Watchlist selection bar, or the legacy `?fund=&against=`
 * shape). It's a thin redirect into the existing `/fund/[schemeCode]?against=` comparison
 * mechanism, which supports exactly two funds.
 */
export default async function ComparePage({ searchParams }: PageProps<"/compare">) {
  const routeState = parseComparisonSearchParams(await searchParams);
  const [fund, against] = routeState.schemeCodes;
  if (fund && against) {
    redirect(
      toFundResearchHref(fund, {
        range: routeState.range,
        showBenchmark: false,
        against,
      }),
    );
  }

  return (
    <main className="mx-auto grid min-h-screen max-w-6xl place-items-center px-4 sm:px-6">
      <Empty className="max-w-lg">
        <EmptyHeader>
          <EmptyTitle>No funds selected to compare</EmptyTitle>
          <EmptyDescription>
            Select exactly two funds from Explore or a watchlist, then choose Compare.
          </EmptyDescription>
        </EmptyHeader>
        <Link href="/" className={buttonVariants({ variant: "outline" })}>
          Back to Explore
        </Link>
      </Empty>
    </main>
  );
}
