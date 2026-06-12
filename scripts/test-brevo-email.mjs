/**
 * Teste l'envoi email Brevo depuis la ligne de commande.
 * Usage : node scripts/test-brevo-email.mjs
 * Charge .env.local si présent.
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

function loadEnvFile(path) {
  if (!existsSync(path)) return;
  const content = readFileSync(path, "utf8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnvFile(resolve(process.cwd(), ".env.local"));
loadEnvFile(resolve(process.cwd(), ".env"));

const apiKey = (process.env.BREVO_API_KEY ?? "").trim();
const senderEmail = (process.env.BREVO_SENDER_EMAIL ?? "").trim();
const adminEmail = (process.env.ADMIN_EMAIL ?? "").trim();
const senderName = (process.env.BREVO_SENDER_NAME ?? "PPL Outils Marketing").trim();

const missing = [];
if (!apiKey) missing.push("BREVO_API_KEY");
if (!senderEmail) missing.push("BREVO_SENDER_EMAIL");
if (!adminEmail) missing.push("ADMIN_EMAIL");

if (missing.length > 0) {
  console.error("Variables manquantes :", missing.join(", "));
  process.exit(1);
}

if (!apiKey.startsWith("xkeysib-")) {
  console.warn(
    "Attention : BREVO_API_KEY ne commence pas par xkeysib-. Utilisez une clé API classique (pas MCP)."
  );
}

const payload = {
  sender: { name: senderName, email: senderEmail },
  to: [{ email: adminEmail }],
  subject: "[PPL] Test script email",
  htmlContent: "<p>Test depuis scripts/test-brevo-email.mjs</p>",
  textContent: "Test depuis scripts/test-brevo-email.mjs",
  tags: ["ppl-marketing-test"],
};

console.log("Envoi vers", adminEmail, "depuis", senderEmail, "...");

const response = await fetch("https://api.brevo.com/v3/smtp/email", {
  method: "POST",
  headers: {
    accept: "application/json",
    "content-type": "application/json",
    "api-key": apiKey,
  },
  body: JSON.stringify(payload),
});

const body = await response.text();
if (!response.ok) {
  console.error("Échec Brevo", response.status, body);
  process.exit(1);
}

console.log("Succès :", body);
