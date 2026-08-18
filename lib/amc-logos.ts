/**
 * Maps AMC names (as reported by FinAPI's `fundHouse`/`companyName` fields, which vary in
 * casing and suffix — "HDFC Mutual Fund", "HDFC Asset Management Company Ltd.") to a local
 * logo asset under `public/amc-logos/`. Coverage is partial by design: AMCs without a sourced
 * logo fall back to an initials badge (see `components/amc-logo.tsx`) rather than blocking on
 * a full asset pipeline.
 */

/** Strips legal-entity noise so "HDFC Mutual Fund" and "HDFC Asset Management Co. Ltd" collapse to one key. */
function slugify(amc: string): string {
  return amc
    .toLowerCase()
    .replace(
      /\b(mutual fund|asset management( company)?( pvt\.?| private)?( ltd\.?| limited)?|amc|co\.?)\b/g,
      "",
    )
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Only list a slug here once `public/amc-logos/{slug}.svg` actually exists — this set drives
 * whether `AmcLogo` attempts to render a local file at all, so an entry without a matching file
 * would render a broken image instead of falling back to the initials badge.
 */
const AMC_LOGO_SLUGS = new Set<string>([]);

/** Slug aliases for AMCs whose FinAPI name doesn't collapse cleanly to their logo file's slug. */
const SLUG_ALIASES: Record<string, string> = {
  kotak: "kotak-mahindra",
  "aditya-birla-sunlife": "aditya-birla-sun-life",
};

export function amcLogoPath(amc: string): string | null {
  const raw = slugify(amc);
  const slug = SLUG_ALIASES[raw] ?? raw;
  return AMC_LOGO_SLUGS.has(slug) ? `/amc-logos/${slug}.svg` : null;
}

export function amcInitials(amc: string): string {
  const words = amc
    .replace(
      /\b(mutual fund|asset management( company)?( pvt\.?| private)?( ltd\.?| limited)?|amc)\b/gi,
      "",
    )
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (words.length === 0) return "?";
  if (words.length === 1) return words[0]!.slice(0, 2).toUpperCase();
  return words
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}
