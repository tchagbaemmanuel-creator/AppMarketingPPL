import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getAllUsers } from "@/actions/accounts";
import { requireAdmin } from "@/actions/auth";
import { AccountsManager } from "@/components/admin/accounts-manager";
import { AppHeader } from "@/components/layout/app-header";
import type { UserRole, UserStatus } from "@/lib/types";

interface AdminAccountsPageProps {
  searchParams: Promise<{
    status?: string;
    role?: string;
    q?: string;
  }>;
}

export default async function AdminAccountsPage({ searchParams }: AdminAccountsPageProps) {
  const user = await requireAdmin().catch(() => null);
  if (!user) redirect("/dashboard");

  const params = await searchParams;
  const status = (params.status ?? "all") as UserStatus | "all";
  const role = (params.role ?? "all") as UserRole | "all";

  const users = await getAllUsers({
    status,
    role,
    q: params.q,
  });

  return (
    <>
      <AppHeader
        title="Gestion des comptes"
        description="Consultez, modifiez et gérez tous les comptes utilisateurs"
        userName={user.nom}
        userRole={user.role}
      />
      <div className="p-4 lg:p-8">
        <Suspense fallback={<p className="text-sm text-brand-text-muted">Chargement...</p>}>
          <AccountsManager users={users} currentUserId={user.id} />
        </Suspense>
      </div>
    </>
  );
}
