import Link from "next/link";
import { approveUserByToken } from "@/actions/auth";
import { BrandLogo } from "@/components/brand/brand-logo";

interface ApprovePageProps {
  searchParams: Promise<{ token?: string }>;
}

export default async function ApproveRegistrationPage({
  searchParams,
}: ApprovePageProps) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <ApproveResult
        success={false}
        message="Lien de validation invalide."
      />
    );
  }

  const result = await approveUserByToken(token);

  if (result.error) {
    return <ApproveResult success={false} message={result.error} />;
  }

  return (
    <ApproveResult
      success
      message={`L'inscription de ${result.nom} a été approuvée avec succès.`}
    />
  );
}

function ApproveResult({
  success,
  message,
}: {
  success: boolean;
  message: string;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-brand-background px-6">
      <div className="w-full max-w-md space-y-6 text-center">
        <BrandLogo size="md" className="items-center" />
        <div
          className={`rounded-2xl px-6 py-8 ${
            success ? "bg-brand-success-bg text-brand-success" : "bg-brand-danger-bg text-brand-danger"
          }`}
        >
          <p className="text-lg font-semibold">{message}</p>
        </div>
        <div className="flex flex-col gap-3">
          <Link
            href="/admin/users"
            className="brand-btn-primary inline-flex h-10 items-center justify-center rounded-xl px-4 text-sm font-semibold"
          >
            Voir les inscriptions
          </Link>
          <Link
            href="/login"
            className="inline-flex h-10 items-center justify-center rounded-xl border border-brand-border px-4 text-sm font-medium hover:bg-brand-background-subtle"
          >
            Se connecter
          </Link>
        </div>
      </div>
    </div>
  );
}
