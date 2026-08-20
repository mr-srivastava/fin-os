import Link from "next/link";
import { Separator } from "@/components/ui/separator";

export function SiteFooter() {
  return (
    <footer>
      <Separator />
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-6 text-xs leading-5 text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <p>For research only. Not investment advice.</p>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 sm:justify-end">
          <Link href="/data-and-limitations" className="font-medium text-foreground">
            Data &amp; limitations
          </Link>
        </div>
      </div>
    </footer>
  );
}
