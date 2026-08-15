import Link from "next/link";

const externalLinkClassName = "font-medium text-foreground underline underline-offset-4";

export function SiteFooter() {
  return (
    <footer className="border-t px-4 py-6 sm:px-6">
      <div className="mx-auto grid max-w-6xl gap-5 text-xs leading-5 text-muted-foreground md:grid-cols-[minmax(0,1fr)_minmax(0,1.35fr)_auto] md:gap-8">
        <div>
          <h2 className="font-medium text-foreground">What is included</h2>
          <p className="mt-1">
            TigZig NAV-derived returns, volatility, drawdowns, and NAV history; plus the latest
            FinAPI portfolio snapshot.
          </p>
        </div>
        <div>
          <h2 className="font-medium text-foreground">Public beta data boundary</h2>
          <p className="mt-1">
            NAV values and deterministic return/risk metrics use TigZig. Fund facts and portfolio
            figures use FinAPI; portfolio data is the latest supplied snapshot and may not carry a
            disclosure date. This beta does not include ratings, advice, rankings, recommendations,
            portfolio overlap, or portfolio-change claims.
          </p>
          <p className="mt-1">
            <a
              className={externalLinkClassName}
              href="https://www.tigzig.com/apis/mf-nav"
              target="_blank"
              rel="noreferrer"
            >
              TigZig NAV source
            </a>{" "}
            ·{" "}
            <a
              className={externalLinkClassName}
              href="https://finapi.upvaly.com/"
              target="_blank"
              rel="noreferrer"
            >
              FinAPI fund source
            </a>
          </p>
        </div>
        <div className="flex flex-col gap-1 md:text-right">
          <p>For research only. Not investment advice.</p>
          <Link href="/compare" className="font-medium text-foreground">
            Compare two funds →
          </Link>
        </div>
      </div>
    </footer>
  );
}
