"use client";

import { CategoryExplorer } from "@/components/category-explorer";
import { FundSearch } from "@/components/fund-search";
import { Separator } from "@/components/ui/separator";

export function ResearchStart() {
  return (
    <main id="main-content" className="mx-auto max-w-6xl px-4 sm:px-6">
      <section className="max-w-3xl py-14 sm:py-20">
        <h1 className="mt-5 max-w-3xl text-4xl font-semibold tracking-tight sm:text-6xl">
          Understand a fund’s return path.
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground">
          Look up a known fund or browse the eligible equity universe. navnote helps you research
          data; it does not rate, rank, or recommend funds.
        </p>

        <div className="mt-8">
          <h2 className="text-sm font-medium">Search a specific fund</h2>
          <FundSearch />
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <span>Examples:</span>
          {["Parag Parikh", "HDFC Flexi Cap", "SBI Contra"].map((example) => (
            <span key={example}>{example}</span>
          ))}
        </div>
      </section>
      <Separator />
      <section id="explore" className="scroll-mt-6 py-12 sm:py-16">
        <CategoryExplorer />
      </section>
    </main>
  );
}
