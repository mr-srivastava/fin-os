import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t px-4 py-6 sm:px-6">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 text-xs leading-5 text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p>For research only. Not investment advice.</p>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 sm:justify-end">
          <Link href="/data-and-limitations" className="font-medium text-foreground">
            Data &amp; limitations
          </Link>
          <Link href="/compare" className="font-medium text-foreground">
            Compare two funds →
          </Link>
        </div>
      </div>
    </footer>
  );
}
