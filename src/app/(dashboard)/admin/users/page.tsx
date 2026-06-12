import { redirect } from "next/navigation";
import { getPendingUsers, requireAdmin } from "@/actions/auth";
import { AppHeader } from "@/components/layout/app-header";
import { PendingUsersTable } from "@/components/admin/pending-users-table";

export default async function AdminUsersPage() {
  const user = await requireAdmin().catch(() => null);
  if (!user) redirect("/dashboard");

  const pendingUsers = await getPendingUsers();

  return (
    <>
      <AppHeader
        title="Inscriptions"
        description="Validez ou refusez les demandes d'accès des employés"
        userName={user.nom}
        userRole={user.role}
      />
      <div className="p-4 lg:p-8">
        <PendingUsersTable users={pendingUsers} />
      </div>
    </>
  );
}
