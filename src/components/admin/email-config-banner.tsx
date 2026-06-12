"use client";

import { AlertTriangle } from "lucide-react";

interface EmailConfigBannerProps {
  configured: boolean;
  missing: string[];
}

export function EmailConfigBanner({ configured, missing }: EmailConfigBannerProps) {
  if (configured) {
    return null;
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
        </div>
      </div>
    </div>
  );
}
