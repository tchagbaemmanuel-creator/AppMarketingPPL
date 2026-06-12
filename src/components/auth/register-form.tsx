"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { signUp } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BrandDecorativeSwoosh } from "@/components/brand/brand-logo";
import { Briefcase, Lock, Mail, UserRound } from "lucide-react";

export function RegisterForm() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const result = await signUp(formData);
      if (result.error) {
        setError(result.error);
        return;
      }
      setSuccess(result.message ?? "Demande envoyée avec succès.");
    });
  }

  return (
    <Card className="brand-card overflow-hidden border-0 shadow-[var(--brand-shadow-lg)]">
      <div className="h-1.5 bg-[var(--brand-gradient-accent)]" />
      <CardHeader className="space-y-3 pb-2">
        <CardTitle className="font-heading text-2xl font-bold uppercase tracking-wide text-brand-primary">
          Demander l&apos;accès
        </CardTitle>
        <CardDescription className="text-base">
          Inscrivez-vous pour accéder aux outils marketing PPL. Un administrateur
          validera votre demande.
        </CardDescription>
        <BrandDecorativeSwoosh className="w-24" />
      </CardHeader>
      <CardContent>
        {success ? (
          <div className="space-y-4 rounded-xl bg-brand-success-bg px-4 py-5 text-sm text-brand-success">
            <p className="font-medium">{success}</p>
            <p className="text-brand-text-muted">
              Vous pourrez vous connecter dès que votre inscription sera approuvée.
            </p>
            <Link
              href="/login"
              className="inline-flex h-10 w-full items-center justify-center rounded-xl border border-brand-border text-sm font-medium hover:bg-brand-background-subtle"
            >
              Retour à la connexion
            </Link>
          </div>
        ) : (
          <form action={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nom">Nom complet</Label>
              <div className="relative">
                <UserRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-text-muted" />
                <Input
                  id="nom"
                  name="nom"
                  required
                  placeholder="Ex : Jean Kouassi"
                  className="h-11 rounded-xl pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email professionnel</Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-text-muted" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  placeholder="vous@ppl.com"
                  className="h-11 rounded-xl pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fonction">Fonction</Label>
              <div className="relative">
                <Briefcase className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-text-muted" />
                <Input
                  id="fonction"
                  name="fonction"
                  placeholder="Ex : Responsable marketing"
                  className="h-11 rounded-xl pl-10"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="password">Mot de passe</Label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-text-muted" />
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    required
                    minLength={8}
                    className="h-11 rounded-xl pl-10"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmer</Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  minLength={8}
                  className="h-11 rounded-xl"
                />
              </div>
            </div>

            <p className="text-xs text-brand-text-muted">
              Minimum 8 caractères. Vous utiliserez ce mot de passe avec votre nom
              pour vous connecter.
            </p>

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
              {isPending ? "Envoi..." : "Envoyer ma demande"}
            </Button>

            <p className="text-center text-sm text-brand-text-muted">
              Déjà inscrit ?{" "}
              <Link href="/login" className="font-medium text-brand-primary hover:underline">
                Se connecter
              </Link>
            </p>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
