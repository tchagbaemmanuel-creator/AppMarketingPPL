import { redirect } from "next/navigation";
import { getPendingUsers, requireAdmin } from "@/actions/auth";
import { getEmailConfigStatus } from "@/lib/email";
import { AppHeader } from "@/components/layout/app-header";
import { PendingUsersTable } from "@/components/admin/pending-users-table";
import { EmailConfigBanner } from "@/components/admin/email-config-banner";

export default async function AdminUsersPage() {
  const user = await requireAdmin().catch(() => null);
  if (!user) redirect("/dashboard");

  const [pendingUsers, emailConfig] = await Promise.all([
    getPendingUsers(),
    Promise.resolve(getEmailConfigStatus()),
  ]);

  return (
    <>
      <AppHeader
        title="Inscriptions"
        description="Validez ou refusez les demandes d'accès des employés"
        userName={user.nom}
        userRole={user.role}
      />
      <div className="p-4 lg:p-8">
        <EmailConfigBanner
          configured={emailConfig.configured}
          missing={emailConfig.missing}
          warnings={emailConfig.warnings}
          adminRecipients={emailConfig.adminRecipients}
        />
        <PendingUsersTable users={pendingUsers} />
      </div>
    </>
  );
}
