import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/actions/auth";
import { AppHeader } from "@/components/layout/app-header";
import { WithdrawalForm } from "@/components/requests/withdrawal-form";
import { PendingRequests, AllRequestsTable } from "@/components/requests/pending-requests";
import type { Resource, WithdrawalRequest } from "@/lib/types";

export default async function RequestsPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const supabase = await createClient();

  const [resourcesRes, requestsRes] = await Promise.all([
    supabase.from("resources").select("*").order("nom"),
    supabase
      .from("withdrawal_requests")
      .select("*, resources(nom, categorie, type)")
      .order("created_at", { ascending: false }),
  ]);

  const resources = (resourcesRes.data ?? []) as Resource[];
  const requests = (requestsRes.data ?? []) as WithdrawalRequest[];
  const isAdmin = user.role === "admin";

  return (
    <>
      <AppHeader
        title="Demandes de retrait"
        description={
          isAdmin
            ? "Valider les demandes et consulter l'activité"
            : "Soumettre une demande de retrait de ressources"
        }
        userName={user.nom}
        userRole={user.role}
      />
      <div className="space-y-6 p-4 lg:p-8">
        <WithdrawalForm
          resources={resources}
          defaultDemandeur={user.nom}
          defaultFonction={user.fonction ?? undefined}
        />
        {isAdmin && (
          <>
            <PendingRequests requests={requests} />
            <AllRequestsTable requests={requests} />
          </>
        )}
      </div>
    </>
  );
}
