import Link from "next/link";

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
      </nav>
    </header>
  );
}
