/** Shared request-body parsing for the app's API route handlers. */
import * as v from "valibot";

/** Parses a route handler's JSON request body against `schema`, returning `null` on invalid
 * JSON or a schema mismatch so callers can fall back to their own validation message. */
export async function parseJsonBody<T>(
  request: Request,
  schema: v.GenericSchema<T>,
): Promise<T | null> {
  const body: unknown = await request.json().catch(() => null);
  const result = v.safeParse(schema, body, { abortEarly: true });
  return result.success ? result.output : null;
}
