import Image from "next/image";
import { cn } from "@/lib/utils";

const LOGO_SRC = "/charte-graphique/logos/logo-ppl.jpg";

interface BrandLogoProps {
  size?: "sm" | "md" | "lg";
  /** Affiche le sous-titre « Outils Marketing » sous le logo */
  showText?: boolean;
  variant?: "default" | "light";
  className?: string;
}

const logoHeights = {
  sm: 44,
  md: 56,
  lg: 96,
};

const subtitleSizes = {
  sm: "text-[10px]",
  md: "text-xs",
  lg: "text-sm",
};

export function BrandLogo({
  size = "md",
  showText = false,
  variant = "default",
  className,
}: BrandLogoProps) {
  const height = logoHeights[size];
  const width = Math.round(height * 0.72);
  const isLight = variant === "light";

  return (
    <div className={cn("inline-flex flex-col gap-2", className)}>
      <div
        className={cn(
          "inline-flex w-fit items-center justify-center",
          isLight &&
            "rounded-2xl bg-white px-4 py-3 shadow-[0_8px_32px_rgba(0,0,0,0.18)]"
        )}
      >
        <Image
          src={LOGO_SRC}
          alt="PPL — Poulet Prestige Limited"
          width={width}
          height={height}
          className="h-auto w-auto object-contain"
          style={{ maxHeight: height }}
          priority
        />
      </div>
      {showText && (
        <p
          className={cn(
            "font-medium uppercase tracking-[0.12em]",
            subtitleSizes[size],
            isLight ? "text-white/75" : "text-brand-text-muted"
          )}
        >
          Outils Marketing
        </p>
      )}
    </div>
  );
}

/** En-tête marque pour les panneaux d'authentification (fond sombre) */
export function BrandAuthHeader({ className }: { className?: string }) {
  return (
    <header className={cn("relative z-10 shrink-0", className)}>
      <BrandLogo size="lg" variant="light" showText />
    </header>
  );
}

/** Motif décoratif de la charte (points + vague) */
export function BrandDecorativeSwoosh({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 24"
      fill="none"
      className={cn("text-brand-accent", className)}
      aria-hidden
    >
      <path
        d="M0 14C20 6 40 20 60 12C80 4 100 18 120 10"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function BrandDotGrid({ className }: { className?: string }) {
  return (
    <div className={cn("grid grid-cols-4 gap-1.5 opacity-40", className)} aria-hidden>
      {Array.from({ length: 16 }).map((_, i) => (
        <span key={i} className="h-1.5 w-1.5 rounded-full bg-white" />
      ))}
    </div>
  );
}
