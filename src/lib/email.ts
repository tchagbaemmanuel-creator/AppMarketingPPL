import { createAdminClient } from "@/lib/supabase/admin";

interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: { email: string; name?: string };
}

export interface EmailSendResult {
  ok: boolean;
  error?: string;
  messageId?: string;
}

function env(name: string): string {
  return (process.env[name] ?? "").trim();
}

function getAppUrl(): string {
  return env("NEXT_PUBLIC_APP_URL") || "http://localhost:3000";
}

function getSender() {
  const senderIdRaw = env("BREVO_SENDER_ID");
  const email = env("BREVO_SENDER_EMAIL");
  const name = env("BREVO_SENDER_NAME") || "PPL Outils Marketing";

  if (senderIdRaw) {
    const id = Number(senderIdRaw);
    if (!Number.isNaN(id) && id > 0) {
      return { id, name, email: email || undefined };
    }
  }

  return { email, name };
}

function parseAdminEmailsFromEnv(): string[] {
  const raw = env("ADMIN_EMAIL");
  if (!raw) return [];

  return [...new Set(raw.split(/[,;]/).map((e) => e.trim().toLowerCase()).filter(Boolean))];
}

function isDeliverableEmail(email: string): boolean {
  if (!email.includes("@")) return false;
  const domain = email.split("@")[1] ?? "";
  return !domain.endsWith(".local") && domain !== "localhost";
}

export function getEmailConfigStatus(): {
  configured: boolean;
  missing: string[];
  warnings: string[];
  adminRecipients: string[];
} {
  const missing: string[] = [];
  const warnings: string[] = [];
  const apiKey = env("BREVO_API_KEY");
  const senderEmail = env("BREVO_SENDER_EMAIL");
  const senderId = env("BREVO_SENDER_ID");
  const adminRecipients = parseAdminEmailsFromEnv();

  if (!apiKey) missing.push("BREVO_API_KEY");
  if (!senderEmail && !senderId) missing.push("BREVO_SENDER_EMAIL ou BREVO_SENDER_ID");
  if (adminRecipients.length === 0) missing.push("ADMIN_EMAIL");

  const invalidAdmin = adminRecipients.filter((e) => !isDeliverableEmail(e));
  if (invalidAdmin.length > 0) {
    missing.push(
      `ADMIN_EMAIL invalide (${invalidAdmin.join(", ")}) — utilisez une vraie adresse, pas admin@ppl.local`
    );
  }

  if (apiKey && !apiKey.startsWith("xkeysib-")) {
    warnings.push(
      "BREVO_API_KEY ne commence pas par xkeysib-. Générez une clé API classique dans Brevo (SMTP & API → API Keys) sans cocher « Create MCP server API key »."
    );
  }

  return {
    configured: missing.length === 0,
    missing,
    warnings,
    adminRecipients,
  };
}

export function isEmailConfigured(): boolean {
  return getEmailConfigStatus().configured;
}

function normalizeRecipients(to: string | string[]) {
  const list = Array.isArray(to) ? to : [to];
  return list
    .map((email) => email.trim().toLowerCase())
    .filter(isDeliverableEmail)
    .map((email) => ({ email }));
}

export async function resolveAdminNotificationEmails(): Promise<string[]> {
  const fromEnv = parseAdminEmailsFromEnv().filter(isDeliverableEmail);
  if (fromEnv.length > 0) return fromEnv;

  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("users")
      .select("email")
      .eq("role", "admin")
      .eq("status", "approuve")
      .not("email", "is", null);

    const fromDb = (data ?? [])
      .map((row) => row.email?.trim().toLowerCase() ?? "")
      .filter(isDeliverableEmail);

    return [...new Set(fromDb)];
  } catch (error) {
    console.error("[email] Impossible de lire les emails admin en base:", error);
    return [];
  }
}

function stripHtml(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function buildSenderPayload(sender: ReturnType<typeof getSender>) {
  if ("id" in sender && sender.id && !Number.isNaN(sender.id)) {
    return { id: sender.id, name: sender.name };
  }
  if (sender.email) {
    return { name: sender.name, email: sender.email };
  }
  return null;
}

export async function sendEmail(options: SendEmailOptions): Promise<EmailSendResult> {
  const config = getEmailConfigStatus();
  if (!config.configured) {
    const error = `Configuration email incomplète : ${config.missing.join(", ")}`;
    console.warn("[email]", error);
    return { ok: false, error };
  }

  const recipients = normalizeRecipients(options.to);
  if (recipients.length === 0) {
    const error = "Aucun destinataire email valide.";
    console.warn("[email]", error);
    return { ok: false, error };
  }

  const sender = getSender();
  const senderPayload = buildSenderPayload(sender);
  if (!senderPayload) {
    const error = "Expéditeur Brevo invalide (BREVO_SENDER_EMAIL ou BREVO_SENDER_ID).";
    console.warn("[email]", error);
    return { ok: false, error };
  }

  const payload: Record<string, unknown> = {
    sender: senderPayload,
    to: recipients,
    subject: options.subject,
    htmlContent: options.html,
    textContent: options.text ?? stripHtml(options.html),
    tags: ["ppl-marketing"],
  };

  if (options.replyTo?.email && isDeliverableEmail(options.replyTo.email)) {
    payload.replyTo = {
      email: options.replyTo.email,
      name: options.replyTo.name,
    };
  }

  try {
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        "api-key": env("BREVO_API_KEY"),
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    });

    const responseBody = await response.text();
    if (!response.ok) {
      let errorMessage = responseBody;
      try {
        const parsed = JSON.parse(responseBody) as { message?: string; code?: string };
        errorMessage = parsed.message ?? responseBody;
        if (
          response.status === 401 &&
          (errorMessage.includes("unrecognised IP") ||
            errorMessage.includes("authorised_ips") ||
            errorMessage.includes("unrecognized IP"))
        ) {
          errorMessage =
            "Brevo bloque l'IP du serveur Render. Désactivez la restriction IP dans Brevo → Sécurité → IP autorisées, ou ajoutez l'IP de Render.";
        }
      } catch {
        // garder le corps brut
      }
      const error = `Brevo ${response.status}: ${errorMessage}`;
      console.error("[email]", error);
      return { ok: false, error };
    }

    let messageId: string | undefined;
    try {
      const parsed = JSON.parse(responseBody) as { messageId?: string };
      messageId = parsed.messageId;
    } catch {
      // réponse sans JSON
    }

    console.info("[email] Envoyé à", recipients.map((r) => r.email).join(", "), messageId ?? "");
    return { ok: true, messageId };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur réseau";
    console.error("[email] Erreur d'envoi Brevo:", message);
    return { ok: false, error: message };
  }
}

function emailLayout(title: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#faf8f5;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#faf8f5;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(135,24,26,0.1);">
        <tr><td style="background:#87181a;padding:24px 32px;">
          <p style="margin:0;color:#e7aa24;font-size:12px;font-weight:bold;letter-spacing:0.15em;text-transform:uppercase;">PPL — Outils Marketing</p>
          <h1 style="margin:8px 0 0;color:#fff;font-size:22px;">${title}</h1>
        </td></tr>
        <tr><td style="padding:32px;color:#1a1412;font-size:15px;line-height:1.6;">${body}</td></tr>
        <tr><td style="padding:16px 32px 24px;border-top:1px solid #efeae3;color:#868683;font-size:12px;">
          Prestige Poultry Limited — Plateforme interne
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function button(href: string, label: string): string {
  return `<p style="margin:24px 0;">
    <a href="${href}" style="display:inline-block;background:#87181a;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">
      ${label}
    </a>
  </p>`;
}

export function getAdminEmail(): string {
  return parseAdminEmailsFromEnv()[0] ?? "";
}

export async function notifyAdminNewRegistration(user: {
  nom: string;
  email: string;
  fonction: string | null;
  approvalToken: string;
}): Promise<EmailSendResult> {
  const adminEmails = await resolveAdminNotificationEmails();
  if (adminEmails.length === 0) {
    return {
      ok: false,
      error: "Aucun email administrateur configuré (ADMIN_EMAIL sur Render).",
    };
  }

  const appUrl = getAppUrl();
  const approveUrl = `${appUrl}/admin/approve?token=${encodeURIComponent(user.approvalToken)}`;
  const adminUrl = `${appUrl}/admin/users`;

  const body = `
    <p><strong>${user.nom}</strong> demande l'accès à l'application Outils Marketing.</p>
    <ul style="padding-left:20px;">
      <li><strong>Email :</strong> ${user.email}</li>
      <li><strong>Fonction :</strong> ${user.fonction ?? "—"}</li>
    </ul>
    ${button(approveUrl, "Approuver l'inscription")}
    <p style="color:#868683;font-size:13px;">
      Vous pouvez aussi gérer les inscriptions depuis le
      <a href="${adminUrl}" style="color:#87181a;">tableau de bord administrateur</a>.
    </p>
  `;

  return sendEmail({
    to: adminEmails,
    subject: `[PPL] Demande d'accès — ${user.nom}`,
    html: emailLayout("Nouvelle demande d'inscription", body),
    text: `${user.nom} (${user.email}) demande l'accès. Approuver : ${approveUrl}`,
    replyTo: { email: user.email, name: user.nom },
  });
}

export async function notifyUserRegistrationApproved(data: {
  email: string;
  nom: string;
}): Promise<EmailSendResult> {
  const appUrl = getAppUrl();
  const loginUrl = `${appUrl}/login`;

  const body = `
    <p>Bonjour <strong>${data.nom}</strong>,</p>
    <p>Bonne nouvelle : votre demande d'accès à l'application <strong>Outils Marketing PPL</strong> a été <strong style="color:#34707a;">approuvée</strong>.</p>
    <p>Vous pouvez dès maintenant vous connecter avec :</p>
    <ul style="padding-left:20px;">
      <li><strong>Votre nom :</strong> ${data.nom}</li>
      <li><strong>Votre mot de passe :</strong> celui que vous avez choisi lors de l'inscription</li>
    </ul>
    ${button(loginUrl, "Se connecter")}
    <p style="color:#868683;font-size:13px;">
      Si vous avez oublié votre mot de passe, contactez votre administrateur.
    </p>
  `;

  return sendEmail({
    to: data.email,
    subject: "[PPL] Votre accès a été approuvé",
    html: emailLayout("Inscription approuvée", body),
    text: `Bonjour ${data.nom}, votre accès PPL a été approuvé. Connectez-vous sur ${loginUrl} avec votre nom et mot de passe.`,
  });
}

export async function notifyAdminNewRequest(data: {
  demandeur: string;
  fonction: string;
  resourceName: string;
  quantite: number;
  motif: string;
}): Promise<EmailSendResult> {
  const adminEmails = await resolveAdminNotificationEmails();
  if (adminEmails.length === 0) {
    return { ok: false, error: "Aucun email administrateur configuré." };
  }

  const appUrl = getAppUrl();
  const requestsUrl = `${appUrl}/requests`;

  const body = `
    <p><strong>${data.demandeur}</strong> (${data.fonction}) a demandé un outil marketing.</p>
    <ul style="padding-left:20px;">
      <li><strong>Ressource :</strong> ${data.resourceName}</li>
      <li><strong>Quantité :</strong> ${data.quantite}</li>
      <li><strong>Motif :</strong> ${data.motif}</li>
    </ul>
    ${button(requestsUrl, "Voir les demandes")}
  `;

  return sendEmail({
    to: adminEmails,
    subject: `[PPL] Nouvelle demande — ${data.resourceName}`,
    html: emailLayout("Nouvelle demande de retrait", body),
    text: `${data.demandeur} demande ${data.quantite}x ${data.resourceName}. Voir : ${requestsUrl}`,
  });
}

export async function notifyUserRequestDecision(data: {
  email: string;
  demandeur: string;
  resourceName: string;
  quantite: number;
  approved: boolean;
}): Promise<EmailSendResult> {
  const appUrl = getAppUrl();
  const requestsUrl = `${appUrl}/requests`;
  const statusLabel = data.approved ? "approuvée" : "refusée";
  const statusColor = data.approved ? "#34707a" : "#d14d2f";

  const body = `
    <p>Bonjour <strong>${data.demandeur}</strong>,</p>
    <p>Votre demande de retrait a été <strong style="color:${statusColor};">${statusLabel}</strong>.</p>
    <ul style="padding-left:20px;">
      <li><strong>Ressource :</strong> ${data.resourceName}</li>
      <li><strong>Quantité :</strong> ${data.quantite}</li>
    </ul>
    ${button(requestsUrl, "Voir mes demandes")}
  `;

  return sendEmail({
    to: data.email,
    subject: `[PPL] Demande ${statusLabel} — ${data.resourceName}`,
    html: emailLayout(`Demande ${statusLabel}`, body),
    text: `Votre demande pour ${data.resourceName} a été ${statusLabel}.`,
  });
}

export { getAppUrl };
