"use server";

import { requireAdmin } from "@/actions/auth";
import { notifyUserRegistrationApproved } from "@/lib/email";
import { hashPassword } from "@/lib/password";
import { createAdminClient } from "@/lib/supabase/admin";
import type { User, UserRole, UserStatus } from "@/lib/types";
import { revalidatePath } from "next/cache";

function normalizeName(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

function revalidateAccountPaths() {
  revalidatePath("/admin/accounts");
  revalidatePath("/admin/users");
}

async function countApprovedAdmins(excludeId?: string): Promise<number> {
  const supabase = createAdminClient();
  let query = supabase
    .from("users")
    .select("id", { count: "exact", head: true })
    .eq("role", "admin")
    .eq("status", "approuve");

  if (excludeId) {
    query = query.neq("id", excludeId);
  }

  const { count } = await query;
  return count ?? 0;
}

export async function getAllUsers(filters?: {
  status?: UserStatus | "all";
  role?: UserRole | "all";
  q?: string;
}): Promise<User[]> {
  await requireAdmin();
  const supabase = createAdminClient();

  let query = supabase.from("users").select("*").order("created_at", { ascending: false });

  if (filters?.status && filters.status !== "all") {
    query = query.eq("status", filters.status);
  }

  if (filters?.role && filters.role !== "all") {
    query = query.eq("role", filters.role);
  }

  const { data, error } = await query;
  if (error || !data) return [];

  const search = filters?.q?.trim().toLowerCase();
  if (!search) return data;

  return data.filter(
    (user) =>
      user.nom.toLowerCase().includes(search) ||
      (user.email?.toLowerCase().includes(search) ?? false) ||
      (user.fonction?.toLowerCase().includes(search) ?? false)
  );
}

export async function updateUserAccount(
  userId: string,
  formData: FormData
): Promise<{ success?: true; error?: string }> {
  const currentAdmin = await requireAdmin();
  const supabase = createAdminClient();

  const nom = normalizeName(formData.get("nom") as string);
  const email = normalizeEmail(formData.get("email") as string);
  const fonction = normalizeName((formData.get("fonction") as string) || "");
  const role = formData.get("role") as UserRole;
  const status = formData.get("status") as UserStatus;

  if (!nom || nom.length < 2) {
    return { error: "Le nom doit contenir au moins 2 caractères." };
  }
  if (!email || !email.includes("@")) {
    return { error: "Adresse email invalide." };
  }
  if (role !== "admin" && role !== "membre") {
    return { error: "Rôle invalide." };
  }
  if (!["en_attente", "approuve", "refuse"].includes(status)) {
    return { error: "Statut invalide." };
  }

  const { data: existing } = await supabase.from("users").select("*").eq("id", userId).single();
  if (!existing) {
    return { error: "Compte introuvable." };
  }

  if (userId === currentAdmin.id && role !== "admin") {
    return { error: "Vous ne pouvez pas retirer vos propres droits administrateur." };
  }

  if (userId === currentAdmin.id && status !== "approuve") {
    return { error: "Vous ne pouvez pas désactiver votre propre compte." };
  }

  if (existing.role === "admin" && role === "membre") {
    const otherAdmins = await countApprovedAdmins(userId);
    if (otherAdmins === 0) {
      return { error: "Impossible de retirer le dernier administrateur." };
    }
  }

  const { data: emailConflict } = await supabase
    .from("users")
    .select("id")
    .ilike("email", email)
    .neq("id", userId)
    .maybeSingle();

  if (emailConflict) {
    return { error: "Cet email est déjà utilisé par un autre compte." };
  }

  if (status === "approuve") {
    const { data: nameConflict } = await supabase
      .from("users")
      .select("id")
      .ilike("nom", nom)
      .eq("status", "approuve")
      .neq("id", userId)
      .maybeSingle();

    if (nameConflict) {
      return { error: "Ce nom est déjà utilisé par un compte approuvé." };
    }
  }

  const wasNotApproved = existing.status !== "approuve";

  const { error } = await supabase
    .from("users")
    .update({
      nom,
      email,
      fonction: fonction || null,
      role,
      status,
    })
    .eq("id", userId);

  if (error) {
    return { error: "Impossible de mettre à jour le compte." };
  }

  if (status === "approuve" && wasNotApproved && email) {
    await notifyUserRegistrationApproved({ email, nom });
  }

  revalidateAccountPaths();
  return { success: true };
}

export async function resetUserPassword(
  userId: string,
  formData: FormData
): Promise<{ success?: true; error?: string }> {
  await requireAdmin();
  const password = formData.get("password") as string;
  const confirm = formData.get("confirmPassword") as string;

  if (!password || password.length < 8) {
    return { error: "Le mot de passe doit contenir au moins 8 caractères." };
  }
  if (password !== confirm) {
    return { error: "Les mots de passe ne correspondent pas." };
  }

  const supabase = createAdminClient();
  const passwordHash = await hashPassword(password);

  const { error } = await supabase
    .from("users")
    .update({ password_hash: passwordHash })
    .eq("id", userId);

  if (error) {
    return { error: "Impossible de réinitialiser le mot de passe." };
  }

  revalidateAccountPaths();
  return { success: true };
}

export async function deleteUserAccount(userId: string): Promise<{ success?: true; error?: string }> {
  const currentAdmin = await requireAdmin();

  if (userId === currentAdmin.id) {
    return { error: "Vous ne pouvez pas supprimer votre propre compte." };
  }

  const supabase = createAdminClient();
  const { data: target } = await supabase
    .from("users")
    .select("role, status")
    .eq("id", userId)
    .single();

  if (!target) {
    return { error: "Compte introuvable." };
  }

  if (target.role === "admin" && target.status === "approuve") {
    const otherAdmins = await countApprovedAdmins(userId);
    if (otherAdmins === 0) {
      return { error: "Impossible de supprimer le dernier administrateur." };
    }
  }

  const { error } = await supabase.from("users").delete().eq("id", userId);

  if (error) {
    return { error: "Impossible de supprimer ce compte." };
  }

  revalidateAccountPaths();
  return { success: true };
}
