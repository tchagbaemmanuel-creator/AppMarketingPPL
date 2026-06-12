import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/actions/auth";
import { AppHeader } from "@/components/layout/app-header";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { RecentWithdrawals } from "@/components/dashboard/recent-withdrawals";
import { LowStockResources } from "@/components/dashboard/low-stock";
import type { DashboardStats, Resource, WithdrawalRequest } from "@/lib/types";

async function getDashboardData() {
  const supabase = await createClient();

  const [resourcesRes, requestsRes, pendingRes, validatedRes] = await Promise.all([
    supabase.from("resources").select("*"),
    supabase
      .from("withdrawal_requests")
      .select("*, resources(nom, categorie, type)")
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("withdrawal_requests")
      .select("id", { count: "exact", head: true })
      .eq("statut", "en_attente"),
    supabase
      .from("withdrawal_requests")
      .select("id", { count: "exact", head: true })
      .eq("statut", "valide"),
  ]);

  const resources = (resourcesRes.data ?? []) as Resource[];
  const recentRequests = (requestsRes.data ?? []) as WithdrawalRequest[];

  const stats: DashboardStats = {
    totalResources: resources.length,
    totalStock: resources.reduce((sum, r) => sum + r.quantite, 0),
    pendingRequests: pendingRes.count ?? 0,
    completedWithdrawals: validatedRes.count ?? 0,
  };

  return { stats, resources, recentRequests };
}

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const { stats, resources, recentRequests } = await getDashboardData();

  return (
    <>
      <AppHeader
        title="Tableau de bord"
        description="Vue d'ensemble des ressources et des retraits"
        userName={user.nom}
        userRole={user.role}
      />
      <div className="space-y-6 p-4 lg:p-8">
        <StatsCards stats={stats} />
        <div className="grid gap-6 xl:grid-cols-2">
          <RecentWithdrawals requests={recentRequests} />
          <LowStockResources resources={resources} />
        </div>
      </div>
    </>
  );
}
