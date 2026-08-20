import { cookies } from "next/headers";
import { randomUUID } from "node:crypto";

export const DEVICE_ID_COOKIE = "nn_device_id";
const DEVICE_ID_MAX_AGE_SECONDS = 60 * 60 * 24 * 365 * 2;

/**
 * Reads the anonymous per-browser device id from the request cookie jar, generating and
 * persisting a new one via Set-Cookie when absent. Watchlists are scoped to this id - there is
 * no auth in this app, so it is the only identity boundary between devices.
 */
export async function getOrCreateDeviceId(): Promise<string> {
  const store = await cookies();
  const existing = store.get(DEVICE_ID_COOKIE)?.value;
  if (existing) return existing;

  const deviceId = randomUUID();
  store.set(DEVICE_ID_COOKIE, deviceId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: DEVICE_ID_MAX_AGE_SECONDS,
    path: "/",
  });
  return deviceId;
}
