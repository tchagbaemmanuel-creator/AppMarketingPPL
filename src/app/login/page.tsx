import { LoginForm } from "@/components/auth/login-form";
import { BrandAuthHeader, BrandDotGrid, BrandLogo } from "@/components/brand/brand-logo";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen">
      <div className="brand-gradient-auth relative hidden w-1/2 flex-col justify-between overflow-hidden px-12 py-14 text-white lg:flex">
        <BrandAuthHeader />

        <div className="relative z-10 space-y-6">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-accent">
            Plateforme interne
          </p>
          <h2 className="font-heading text-4xl font-bold uppercase leading-tight tracking-wide">
            Outils Marketing
          </h2>
          <p className="max-w-md text-lg leading-relaxed text-white/80">
            Connectez-vous avec le nom et le mot de passe définis lors de votre
            inscription approuvée.
          </p>
        </div>

        <p className="relative z-10 text-sm text-white/45">
          Prestige Poultry Limited — Filiale du groupe Hatch Africa
        </p>

        <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-brand-accent/10" />
        <BrandDotGrid className="pointer-events-none absolute bottom-32 right-16" />
      </div>

      <div className="flex flex-1 flex-col items-center justify-center bg-brand-background px-6 py-12">
        <div className="w-full max-w-md space-y-8">
          <div className="flex justify-center lg:hidden">
            <BrandLogo size="md" variant="default" />
          </div>
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
