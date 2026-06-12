import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/actions/auth";
import { AppHeader } from "@/components/layout/app-header";
import { HistoryFilters } from "@/components/history/history-filters";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { RequestStatusBadge } from "@/components/shared/status-badge";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import type { WithdrawalRequest, RequestStatus } from "@/lib/types";

interface HistoryPageProps {
  searchParams: Promise<{
    date?: string;
    resource?: string;
    statut?: string;
  }>;
}

async function getHistory(
  searchParams: {
    date?: string;
    resource?: string;
    statut?: string;
  },
  userId: string,
  isAdmin: boolean
) {
  const supabase = await createClient();

  let query = supabase
    .from("withdrawal_requests")
    .select("*, resources(nom, categorie, type)")
    .order("created_at", { ascending: false });

  if (!isAdmin) {
    query = query.eq("user_id", userId);
  }

  if (searchParams.date) {
    query = query.gte("created_at", `${searchParams.date}T00:00:00`);
  }
  if (searchParams.resource && searchParams.resource !== "all") {
    query = query.eq("resource_id", searchParams.resource);
  }
  if (searchParams.statut && searchParams.statut !== "all") {
    query = query.eq("statut", searchParams.statut as RequestStatus);
  }

  const { data } = await query;
  return (data ?? []) as WithdrawalRequest[];
}

export default async function HistoryPage({ searchParams }: HistoryPageProps) {
  const user = await getCurrentUser();
  if (!user) return null;

  const params = await searchParams;
  const supabase = await createClient();

  const isAdmin = user.role === "admin";

  const [requests, resourcesRes] = await Promise.all([
    getHistory(params, user.id, isAdmin),
    supabase.from("resources").select("id, nom").order("nom"),
  ]);

  return (
    <>
      <AppHeader
        title="Historique"
        description={
          user.role === "admin"
            ? "Toutes les demandes de retrait"
            : "Votre historique de demandes"
        }
        userName={user.nom}
        userRole={user.role}
      />
      <div className="space-y-6 p-4 lg:p-8">
        <Suspense fallback={<div className="h-24 animate-pulse rounded-lg bg-slate-200" />}>
          <HistoryFilters resources={resourcesRes.data ?? []} />
        </Suspense>

        <div className="brand-card overflow-x-auto border-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-brand-background-subtle hover:bg-brand-background-subtle">
                <TableHead>Date</TableHead>
                <TableHead>Demandeur</TableHead>
                <TableHead>Ressource</TableHead>
                <TableHead>Quantité</TableHead>
                <TableHead>Statut</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                    Aucun résultat pour ces filtres.
                  </TableCell>
                </TableRow>
              ) : (
                requests.map((req) => (
                  <TableRow key={req.id}>
                    <TableCell>
                      {format(new Date(req.created_at), "dd MMM yyyy HH:mm", { locale: fr })}
                    </TableCell>
                    <TableCell>{req.demandeur}</TableCell>
                    <TableCell>{req.resources?.nom ?? "—"}</TableCell>
                    <TableCell>{req.quantite}</TableCell>
                    <TableCell>
                      <RequestStatusBadge status={req.statut} />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </>
  );
}
