"use server";

import { createClient } from "@/lib/supabase/server";
import { requireUser, requireAdmin } from "@/actions/auth";
import {
  notifyAdminNewRequest,
  notifyUserRequestDecision,
} from "@/lib/email";
import { revalidatePath } from "next/cache";
import type { RequestStatus } from "@/lib/types";

export async function createWithdrawalRequest(formData: FormData) {
  const user = await requireUser();
  const supabase = await createClient();

  const resourceId = formData.get("resource_id") as string;
  const quantite = Number(formData.get("quantite"));
  const demandeur = formData.get("demandeur") as string;
  const fonction = formData.get("fonction") as string;
  const motif = formData.get("motif") as string;

  const { data: resource } = await supabase
    .from("resources")
    .select("nom")
    .eq("id", resourceId)
    .single();

  const { error } = await supabase.from("withdrawal_requests").insert({
    user_id: user.id,
    demandeur,
    fonction,
    resource_id: resourceId,
    quantite,
    motif,
    statut: "en_attente" as RequestStatus,
  });

  if (error) return { error: error.message };

  if (resource) {
    await notifyAdminNewRequest({
      demandeur,
      fonction,
      resourceName: resource.nom,
      quantite,
      motif,
    });
  }

  revalidatePath("/requests");
  revalidatePath("/history");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function updateRequestStatus(id: string, statut: "valide" | "refuse") {
  await requireAdmin();
  const supabase = await createClient();

  const { data: request, error: fetchError } = await supabase
    .from("withdrawal_requests")
    .select("*")
    .eq("id", id)
    .single();

  if (fetchError || !request) {
    return { error: "Demande introuvable." };
  }

  const [{ data: resource }, { data: requestUser }] = await Promise.all([
    supabase.from("resources").select("nom").eq("id", request.resource_id).single(),
    request.user_id
      ? supabase.from("users").select("email, nom").eq("id", request.user_id).single()
      : Promise.resolve({ data: null }),
  ]);

  const { error } = await supabase
    .from("withdrawal_requests")
    .update({ statut })
    .eq("id", id);

  if (error) return { error: error.message };

  const resourceName = resource?.nom ?? "Ressource";
  const userEmail = requestUser?.email;

  if (userEmail) {
    await notifyUserRequestDecision({
      email: userEmail,
      demandeur: request.demandeur,
      resourceName,
      quantite: request.quantite,
      approved: statut === "valide",
    });
  }

  revalidatePath("/requests");
  revalidatePath("/history");
  revalidatePath("/dashboard");
  revalidatePath("/resources");
  return { success: true };
}
