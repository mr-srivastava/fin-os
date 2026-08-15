import { FundSearch } from "@/components/fund-search";
import { Badge } from "@/components/ui/badge";

export default function Home() {
  return (
    <main id="main-content" className="mx-auto flex max-w-6xl flex-col px-4 py-6 sm:px-6">
      <section className="flex flex-1 flex-col justify-center py-20 sm:py-28">
        <Badge variant="secondary" className="w-fit">
          India mutual fund research · V0
        </Badge>
        <h1 className="mt-5 max-w-3xl text-4xl font-semibold tracking-tight sm:text-6xl">
          Understand a fund’s return path.
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground">
          Live NAV research for active Direct Growth equity funds. Search a scheme, inspect its
          performance history, then compare two funds side by side.
        </p>
        <FundSearch />
        <div className="mt-5 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <span>Try a fund house or scheme:</span>
          {["Parag Parikh", "HDFC Flexi Cap", "SBI Contra"].map((example) => (
            <Badge key={example} variant="outline">
              {example}
            </Badge>
          ))}
        </div>
      </section>
    </main>
  );
}
