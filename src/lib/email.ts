import nodemailer from "nodemailer";

interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}

function getAppUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

function isEmailConfigured(): boolean {
  return Boolean(
    process.env.SMTP_HOST &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASS &&
      process.env.ADMIN_EMAIL
  );
}

function createTransport() {
  const port = Number(process.env.SMTP_PORT ?? 587);
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: port === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

export async function sendEmail(options: SendEmailOptions): Promise<boolean> {
  if (!isEmailConfigured()) {
    console.warn("[email] SMTP non configuré — notification non envoyée.");
    return false;
  }

  try {
    const transport = createTransport();
    const from =
      process.env.SMTP_FROM ??
      `"PPL Outils Marketing" <${process.env.SMTP_USER}>`;

    await transport.sendMail({
      from,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });
    return true;
  } catch (error) {
    console.error("[email] Erreur d'envoi:", error);
    return false;
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
  return process.env.ADMIN_EMAIL ?? "";
}

export async function notifyAdminNewRegistration(user: {
  nom: string;
  email: string;
  fonction: string | null;
  approvalToken: string;
}): Promise<boolean> {
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
    to: getAdminEmail(),
    subject: `[PPL] Demande d'accès — ${user.nom}`,
    html: emailLayout("Nouvelle demande d'inscription", body),
    text: `${user.nom} demande l'accès. Approuver : ${approveUrl}`,
  });
}

export async function notifyUserRegistrationApproved(data: {
  email: string;
  nom: string;
}): Promise<boolean> {
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
}): Promise<boolean> {
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
    to: getAdminEmail(),
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
}): Promise<boolean> {
  const appUrl = getAppUrl();
  const historyUrl = `${appUrl}/history`;
  const statusLabel = data.approved ? "approuvée" : "refusée";
  const statusColor = data.approved ? "#34707a" : "#d14d2f";

  const body = `
    <p>Bonjour <strong>${data.demandeur}</strong>,</p>
    <p>Votre demande de retrait a été <strong style="color:${statusColor};">${statusLabel}</strong>.</p>
    <ul style="padding-left:20px;">
      <li><strong>Ressource :</strong> ${data.resourceName}</li>
      <li><strong>Quantité :</strong> ${data.quantite}</li>
    </ul>
    ${button(historyUrl, "Consulter mon historique")}
  `;

  return sendEmail({
    to: data.email,
    subject: `[PPL] Demande ${statusLabel} — ${data.resourceName}`,
    html: emailLayout(`Demande ${statusLabel}`, body),
    text: `Votre demande pour ${data.resourceName} a été ${statusLabel}.`,
  });
}

export { getAppUrl, isEmailConfigured };
