import { getSessionSecret } from "@/lib/session-utils";

const APPROVAL_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 jours

async function signPayload(payload: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(getSessionSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function createApprovalToken(userId: string): Promise<string> {
  const expires = Date.now() + APPROVAL_TTL_MS;
  const payload = `${userId}:${expires}`;
  const signature = await signPayload(payload);
  return Buffer.from(`${payload}:${signature}`).toString("base64url");
}

export async function verifyApprovalToken(
  token: string
): Promise<{ userId: string } | null> {
  try {
    const decoded = Buffer.from(token, "base64url").toString("utf8");
    const lastColon = decoded.lastIndexOf(":");
    if (lastColon <= 0) return null;

    const signature = decoded.slice(lastColon + 1);
    const payload = decoded.slice(0, lastColon);
    const expected = await signPayload(payload);

    if (signature.length !== expected.length) return null;
    let mismatch = 0;
    for (let i = 0; i < signature.length; i++) {
      mismatch |= signature.charCodeAt(i) ^ expected.charCodeAt(i);
    }
    if (mismatch !== 0) return null;

    const [userId, expiresStr] = payload.split(":");
    if (!userId || !expiresStr) return null;
    if (Date.now() > Number(expiresStr)) return null;

    return { userId };
  } catch {
    return null;
  }
}
