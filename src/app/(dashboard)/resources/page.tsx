import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/actions/auth";
import { AppHeader } from "@/components/layout/app-header";
import { ResourceFormDialog } from "@/components/resources/resource-form-dialog";
import { ResourceTable } from "@/components/resources/resource-table";
import type { Resource } from "@/lib/types";

export default async function ResourcesPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  if (user.role !== "admin") {
    redirect("/dashboard");
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("resources")
    .select("*")
    .order("nom", { ascending: true });

  const resources = (data ?? []) as Resource[];

  return (
    <>
      <AppHeader
        title="Gestion des ressources"
        description="Ajouter, modifier et suivre les stocks"
        userName={user.nom}
        userRole={user.role}
      />
      <div className="space-y-6 p-4 lg:p-8">
        <div className="flex justify-end">
          <ResourceFormDialog />
        </div>
        <ResourceTable resources={resources} />
      </div>
    </>
  );
}
