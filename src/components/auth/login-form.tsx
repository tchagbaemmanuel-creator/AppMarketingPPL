"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { signIn } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BrandDecorativeSwoosh } from "@/components/brand/brand-logo";
import { Lock, UserRound } from "lucide-react";

export function LoginForm() {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await signIn(formData);
      if (result?.error) setError(result.error);
    });
  }

  return (
    <Card className="brand-card overflow-hidden border-0 shadow-[var(--brand-shadow-lg)]">
      <div className="h-1.5 bg-[var(--brand-gradient-accent)]" />
      <CardHeader className="space-y-3 pb-2">
        <CardTitle className="font-heading text-2xl font-bold uppercase tracking-wide text-brand-primary">
          Connexion
        </CardTitle>
        <CardDescription className="text-base">
          Accédez à l&apos;espace employé avec votre nom et mot de passe
        </CardDescription>
        <BrandDecorativeSwoosh className="w-24" />
      </CardHeader>
      <CardContent>
        <form action={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="nom" className="font-medium">
              Votre nom
            </Label>
            <div className="relative">
              <UserRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-text-muted" />
              <Input
                id="nom"
                name="nom"
                type="text"
                placeholder="Ex : Jean Kouassi"
                required
                autoComplete="username"
                autoFocus
                className="h-12 rounded-xl border-brand-border bg-brand-surface pl-10 text-base"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="font-medium">
              Mot de passe
            </Label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-text-muted" />
              <Input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                className="h-12 rounded-xl border-brand-border bg-brand-surface pl-10 text-base"
              />
            </div>
          </div>

          {error && (
            <p className="rounded-xl bg-brand-danger-bg px-4 py-3 text-sm text-brand-danger">
              {error}
            </p>
          )}

          <Button
            type="submit"
            className="brand-btn-primary h-12 w-full rounded-xl text-base font-semibold"
            disabled={isPending}
          >
            {isPending ? "Connexion..." : "Se connecter"}
          </Button>

          <p className="text-center text-sm text-brand-text-muted">
            Pas encore de compte ?{" "}
            <Link href="/register" className="font-medium text-brand-primary hover:underline">
              Demander l&apos;accès
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
