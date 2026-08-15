import Link from "next/link";
import { ArrowRightIcon } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

export function SiteHeader() {
  return (
    <header className="px-4 py-6 sm:px-6">
      <nav
        aria-label="Primary navigation"
        className="mx-auto flex max-w-6xl items-center justify-between"
      >
        <Link href="/" className="text-lg font-semibold tracking-tight">
          navnote
        </Link>
        <Link href="/compare" className={buttonVariants({ variant: "ghost", size: "sm" })}>
          Compare funds <ArrowRightIcon data-icon="inline-end" />
        </Link>
      </nav>
    </header>
  );
}
