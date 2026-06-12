"use client";

import { useEffect, useState, useTransition } from "react";
import { getEmailDiagnostics, testAdminEmailNotification } from "@/actions/auth";
import type { EmailDiagnostics } from "@/lib/email";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Mail, CheckCircle2, RefreshCw } from "lucide-react";

interface EmailConfigBannerProps {
  configured: boolean;
  missing: string[];
  warnings: string[];
  adminRecipients: string[];
}

function isErrorFeedback(text: string): boolean {
  const lower = text.toLowerCase();
  return (
    lower.includes("brevo") ||
    lower.includes("échec") ||
    lower.includes("bloque") ||
    lower.includes("401") ||
    lower.includes("incomplète")
  );
}

export function EmailConfigBanner({
  configured,
  missing,
  warnings,
  adminRecipients,
}: EmailConfigBannerProps) {
  const [feedback, setFeedback] = useState<string | null>(null);
  const [diagnostics, setDiagnostics] = useState<EmailDiagnostics | null>(null);
  const [diagError, setDiagError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isDiagLoading, startDiagTransition] = useTransition();

  function loadDiagnostics() {
    setDiagError(null);
    startDiagTransition(async () => {
      try {
        const result = await getEmailDiagnostics();
        setDiagnostics(result);
      } catch {
        setDiagError("Impossible de lancer le diagnostic.");
      }
    });
  }

  useEffect(() => {
    if (configured) {
      loadDiagnostics();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [configured]);

  function handleTestEmail() {
    setFeedback(null);
    startTransition(async () => {
      const result = await testAdminEmailNotification();
      setFeedback(result.error ?? result.message ?? null);
      loadDiagnostics();
    });
  }

  if (configured) {
    const ipBlocked = diagnostics?.ipBlocked ?? false;

    return (
      <div className="mb-6 space-y-3">
        <div className="rounded-xl border border-brand-border bg-brand-background-subtle px-4 py-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-start gap-3 text-sm">
              {ipBlocked ? (
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-brand-danger" />
              ) : (
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-brand-success" />
              )}
              <div>
                <p className="font-medium text-brand-text">
                  {ipBlocked ? "Emails bloqués par Brevo (IP)" : "Notifications email actives"}
                </p>
                <p className="text-brand-text-muted">
                  Destinataire : {adminRecipients.join(", ")}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={loadDiagnostics}
                disabled={isDiagLoading}
                className="rounded-lg"
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${isDiagLoading ? "animate-spin" : ""}`} />
                Diagnostiquer
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleTestEmail}
                disabled={isPending}
                className="rounded-lg"
              >
                <Mail className="mr-2 h-4 w-4" />
                {isPending ? "Envoi..." : "Tester l'envoi"}
              </Button>
            </div>
          </div>
          {feedback && (
            <p
              className={`mt-3 text-sm ${
                isErrorFeedback(feedback)
                  ? "rounded-lg bg-brand-danger-bg px-3 py-2 text-brand-danger"
                  : "rounded-lg bg-brand-success-bg px-3 py-2 text-brand-success"
              }`}
            >
              {feedback}
            </p>
          )}
        </div>

        {(diagnostics || diagError) && (
          <div
            className={`rounded-xl border px-4 py-4 text-sm ${
              ipBlocked
                ? "border-red-300 bg-red-50 text-red-950"
                : "border-amber-300 bg-amber-50 text-amber-950"
            }`}
          >
            {diagError ? (
              <p>{diagError}</p>
            ) : diagnostics ? (
              <div className="space-y-3">
                <p className="font-medium">Diagnostic serveur (Render)</p>
                <ul className="list-inside list-disc space-y-1">
                  <li>
                    Clé API :{" "}
                    {diagnostics.apiKeyPrefixOk ? "format xkeysib- OK" : "format incorrect"}
                  </li>
                  {diagnostics.serverIpv4 && (
                    <li>
                      IP sortante IPv4 du serveur :{" "}
                      <code className="rounded bg-white/60 px-1">{diagnostics.serverIpv4}</code>
                    </li>
                  )}
                  {diagnostics.serverIpv6 && (
                    <li>
                      IP sortante IPv6 du serveur :{" "}
                      <code className="rounded bg-white/60 px-1 break-all">
                        {diagnostics.serverIpv6}
                      </code>
                    </li>
                  )}
                  <li>
                    Connexion Brevo :{" "}
                    {diagnostics.brevoAccountOk
                      ? "OK"
                      : diagnostics.brevoAccountError ?? "Échec"}
                  </li>
                  {!diagnostics.sendResult.ok && (
                    <li>Envoi test : {diagnostics.sendResult.error}</li>
                  )}
                </ul>

                {ipBlocked && (
                  <div className="space-y-2 rounded-lg border border-red-200 bg-white/70 p-3">
                    <p className="font-semibold">Action requise dans Brevo</p>
                    <ol className="list-inside list-decimal space-y-1">
                      <li>
                        Ouvrez{" "}
                        <a
                          href="https://app.brevo.com/security/authorised_ips"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium underline"
                        >
                          Brevo → Sécurité → IP autorisées
                        </a>
                      </li>
                      <li>
                        <strong>Désactivez</strong> « Bloquer les adresses IP inconnues »
                        (recommandé sur Render)
                      </li>
                      <li>
                        Ou autorisez l&apos;IP IPv4/IPv6 affichée ci-dessus, puis cliquez
                        « Diagnostiquer »
                      </li>
                      <li>
                        Vérifiez aussi vos emails : Brevo envoie parfois un lien « Autoriser
                        cette IP »
                      </li>
                    </ol>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        )}

        {warnings.length > 0 && !ipBlocked && (
          <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-4 text-sm text-amber-950">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
              <ul className="list-inside list-disc space-y-1">
                {warnings.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="mb-6 rounded-xl border border-amber-300 bg-amber-50 px-4 py-4">
      <div className="flex items-start gap-3 text-sm text-amber-950">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
        <div className="space-y-2">
          <p className="font-medium">Notifications email non configurées</p>
          <p>
            Les demandes d&apos;accès sont enregistrées, mais aucun email n&apos;est envoyé
            tant que ces variables ne sont pas définies sur Render :
          </p>
          <ul className="list-inside list-disc space-y-1">
            {missing.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <p className="text-amber-900/80">
            Dans Brevo, vérifiez aussi que l&apos;expéditeur (<code>BREVO_SENDER_EMAIL</code>)
            est validé sous Expéditeurs.
          </p>
        </div>
      </div>
    </div>
  );
}
