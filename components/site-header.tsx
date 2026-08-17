import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="border-b border-border/60 px-4 py-5 sm:px-6">
      <nav
        aria-label="Primary navigation"
        className="mx-auto flex max-w-6xl items-center justify-between"
      >
        <Link
          href="/"
          className="font-heading text-xl font-medium tracking-tight text-foreground italic"
        >
          navnote<span className="text-primary not-italic">.</span>
        </Link>
        <Link
          href="/#explore"
          className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          Explore funds
        </Link>
      </nav>
    </header>
  );
}
