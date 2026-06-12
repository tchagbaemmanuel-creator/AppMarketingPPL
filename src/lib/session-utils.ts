export function getSessionSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret && process.env.NODE_ENV === "production") {
    throw new Error("SESSION_SECRET est requis en production.");
  }
  return secret ?? "dev-session-secret-change-me";
}
