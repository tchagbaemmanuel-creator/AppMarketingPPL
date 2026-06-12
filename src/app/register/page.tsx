import { RegisterForm } from "@/components/auth/register-form";
import { BrandAuthHeader, BrandDotGrid, BrandLogo } from "@/components/brand/brand-logo";

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen">
      <div className="brand-gradient-auth relative hidden w-1/2 flex-col justify-between overflow-hidden px-12 py-14 text-white lg:flex">
        <BrandAuthHeader />

        <div className="relative z-10 space-y-6">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-accent">
            Rejoindre l&apos;équipe
          </p>
          <h2 className="font-heading text-4xl font-bold uppercase leading-tight tracking-wide">
            Inscription employé
          </h2>
          <p className="max-w-md text-lg leading-relaxed text-white/80">
            Remplissez le formulaire ci-contre. Votre responsable recevra une
            notification par email et validera votre accès.
          </p>
        </div>

        <p className="relative z-10 text-sm text-white/45">
          Réservé aux employés de Poulet Prestige Limited
        </p>

        <div className="pointer-events-none absolute -bottom-16 -left-16 h-72 w-72 rounded-full bg-white/5" />
        <BrandDotGrid className="pointer-events-none absolute bottom-32 right-16" />
      </div>

      <div className="flex flex-1 flex-col items-center justify-center bg-brand-background px-6 py-12">
        <div className="w-full max-w-lg space-y-8">
          <div className="flex justify-center lg:hidden">
            <BrandLogo size="md" variant="default" />
          </div>
          <RegisterForm />
        </div>
      </div>
    </div>
  );
}
