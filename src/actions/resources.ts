"use server";

import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/actions/auth";
import { revalidatePath } from "next/cache";
import type { ResourceType } from "@/lib/types";

export async function createResource(formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();

  const { error } = await supabase.from("resources").insert({
    nom: formData.get("nom") as string,
    categorie: formData.get("categorie") as string,
    description: (formData.get("description") as string) || null,
    type: formData.get("type") as ResourceType,
    quantite: Number(formData.get("quantite")),
    seuil_minimum: Number(formData.get("seuil_minimum")),
  });

  if (error) return { error: error.message };

  revalidatePath("/resources");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function updateResource(id: string, formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();

  const { error } = await supabase
    .from("resources")
    .update({
      nom: formData.get("nom") as string,
      categorie: formData.get("categorie") as string,
      description: (formData.get("description") as string) || null,
      type: formData.get("type") as ResourceType,
      quantite: Number(formData.get("quantite")),
      seuil_minimum: Number(formData.get("seuil_minimum")),
    })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/resources");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function deleteResource(id: string) {
  await requireAdmin();
  const supabase = await createClient();

  const { error } = await supabase.from("resources").delete().eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/resources");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function addStock(resourceId: string, quantite: number, commentaire?: string) {
  await requireAdmin();
  const supabase = await createClient();

  const { data: resource, error: fetchError } = await supabase
    .from("resources")
    .select("quantite")
    .eq("id", resourceId)
    .single();

  if (fetchError || !resource) return { error: "Ressource introuvable." };

  const { error: updateError } = await supabase
    .from("resources")
    .update({ quantite: resource.quantite + quantite })
    .eq("id", resourceId);

  if (updateError) return { error: updateError.message };

  const { error: movementError } = await supabase.from("stock_movements").insert({
    resource_id: resourceId,
    type_mouvement: "ajout",
    quantite,
    commentaire: commentaire || "Ajout de stock manuel",
  });

  if (movementError) return { error: movementError.message };

  revalidatePath("/resources");
  revalidatePath("/dashboard");
  return { success: true };
}
