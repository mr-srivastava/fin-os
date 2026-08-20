import { Temporal } from "@js-temporal/polyfill";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Parses the calendar-date strings used by fund providers without introducing a time zone. */
export function parseIsoDate(value: string): Temporal.PlainDate | null {
  if (!ISO_DATE.test(value)) return null;
  try {
    const date = Temporal.PlainDate.from(value);
    return date.toString() === value ? date : null;
  } catch {
    return null;
  }
}

// oxlint-disable-next-line anti-slop/no-unknown-parameters -- doubles as a valibot `v.custom`
// check, whose signature requires `(input: unknown) => boolean`; narrowing happens inside.
export function isIsoDate(value: unknown): value is string {
  return typeof value === "string" && parseIsoDate(value) !== null;
}

export function isoDateYearsAgo(years: number) {
  return Temporal.Now.plainDateISO("UTC").subtract({ years }).toString();
}

export function formatIsoDate(value: string, options: Intl.DateTimeFormatOptions) {
  const date = parseIsoDate(value);
  return date ? date.toLocaleString("en-IN", options) : value;
}
