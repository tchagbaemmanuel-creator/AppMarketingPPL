import { cookies } from "next/headers";
import { getSessionSecret } from "@/lib/session-utils";

export const SESSION_COOKIE = "ppl_employee_session";

function sessionSecret(): string {
  return getSessionSecret();
}

async function signPayload(payload: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(sessionSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function createSessionToken(userId: string): Promise<string> {
  const signature = await signPayload(userId);
  return `${userId}.${signature}`;
}

export async function verifySessionToken(token: string): Promise<string | null> {
  const dotIndex = token.lastIndexOf(".");
  if (dotIndex <= 0) return null;

  const userId = token.slice(0, dotIndex);
  const signature = token.slice(dotIndex + 1);
  const expected = await signPayload(userId);

  if (signature.length !== expected.length) return null;

  let mismatch = 0;
  for (let i = 0; i < signature.length; i++) {
    mismatch |= signature.charCodeAt(i) ^ expected.charCodeAt(i);
  }

  return mismatch === 0 ? userId : null;
}

export async function setSession(userId: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, await createSessionToken(userId), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function getSessionUserId(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export async function getSessionUserIdFromRequest(request: {
  cookies: { get: (name: string) => { value: string } | undefined };
}): Promise<string | null> {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}
