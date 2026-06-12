"use client";

import { useState, useTransition } from "react";
import { testAdminEmailNotification } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Mail, CheckCircle2 } from "lucide-react";

interface EmailConfigBannerProps {
  configured: boolean;
  missing: string[];
  adminRecipients: string[];
}

export function EmailConfigBanner({
  configured,
  missing,
  adminRecipients,
}: EmailConfigBannerProps) {
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleTestEmail() {
    setFeedback(null);
    startTransition(async () => {
      const result = await testAdminEmailNotification();
      setFeedback(result.error ?? result.message ?? null);
    });
  }

  if (configured) {
    return (
      <div className="mb-6 rounded-xl border border-brand-border bg-brand-background-subtle px-4 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-start gap-3 text-sm">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-brand-success" />
            <div>
              <p className="font-medium text-brand-text">Notifications email actives</p>
              <p className="text-brand-text-muted">
                Les alertes sont envoyées à : {adminRecipients.join(", ")}
              </p>
            </div>
          </div>
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
        {feedback && (
          <p className="mt-3 text-sm text-brand-text-muted">{feedback}</p>
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
