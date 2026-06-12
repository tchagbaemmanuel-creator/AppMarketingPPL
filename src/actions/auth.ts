"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createApprovalToken } from "@/lib/approval-token";
import { notifyAdminNewRegistration, notifyUserRegistrationApproved } from "@/lib/email";
import { hashPassword, verifyPassword } from "@/lib/password";
import { clearSession, getSessionUserId, setSession } from "@/lib/session";
import type { User, UserStatus } from "@/lib/types";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

function normalizeName(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

export async function signUp(formData: FormData) {
  const nom = normalizeName(formData.get("nom") as string);
  const email = normalizeEmail(formData.get("email") as string);
  const fonction = normalizeName((formData.get("fonction") as string) || "");
  const password = formData.get("password") as string;
  const confirm = formData.get("confirmPassword") as string;

  if (!nom || nom.length < 2) {
    return { error: "Veuillez saisir votre nom complet." };
  }
  if (!email || !email.includes("@")) {
    return { error: "Veuillez saisir une adresse email valide." };
  }
  if (!password || password.length < 8) {
    return { error: "Le mot de passe doit contenir au moins 8 caractères." };
  }
  if (password !== confirm) {
    return { error: "Les mots de passe ne correspondent pas." };
  }

  let supabase;
  try {
    supabase = createAdminClient();
  } catch {
    return { error: "Configuration serveur incomplète. Contactez l'administrateur." };
  }

  const { data: existingByEmail } = await supabase
    .from("users")
    .select("id, status")
    .ilike("email", email)
    .maybeSingle();

  if (existingByEmail) {
    if (existingByEmail.status === "en_attente") {
      return { error: "Une demande est déjà en cours pour cet email." };
    }
    if (existingByEmail.status === "approuve") {
      return { error: "Un compte existe déjà avec cet email. Connectez-vous." };
    }
  }

  const { data: existingByName } = await supabase
    .from("users")
    .select("id, status")
    .ilike("nom", nom)
    .eq("status", "approuve")
    .maybeSingle();

  if (existingByName) {
    return { error: "Ce nom est déjà utilisé par un compte approuvé." };
  }

  const passwordHash = await hashPassword(password);

  const { data: newUser, error } = await supabase
    .from("users")
    .insert({
      nom,
      email,
      fonction: fonction || null,
      password_hash: passwordHash,
      role: "membre",
      status: "en_attente",
    })
    .select("id, nom, email, fonction")
    .single();

  if (error || !newUser) {
    return { error: "Impossible de créer la demande. Réessayez plus tard." };
  }

  const approvalToken = await createApprovalToken(newUser.id);
  const emailResult = await notifyAdminNewRegistration({
    nom: newUser.nom,
    email: newUser.email ?? email,
    fonction: newUser.fonction,
    approvalToken,
  });

  if (!emailResult.ok) {
    console.error("[signUp] Notification admin échouée:", emailResult.error);
  }

  return {
    success: true,
    emailSent: emailResult.ok,
    message: emailResult.ok
      ? "Votre demande a été envoyée. Vous recevrez l'accès une fois validée par un administrateur."
      : "Votre demande a été enregistrée. La notification email à l'administrateur n'a pas pu être envoyée — il pourra valider votre compte depuis la plateforme.",
  };
}

export async function signIn(formData: FormData) {
  const nom = normalizeName(formData.get("nom") as string);
  const password = formData.get("password") as string;

  if (!nom || nom.length < 2) {
    return { error: "Veuillez saisir votre nom complet." };
  }
  if (!password) {
    return { error: "Veuillez saisir votre mot de passe." };
  }

  let supabase;
  try {
    supabase = createAdminClient();
  } catch {
    return { error: "Configuration serveur incomplète. Contactez l'administrateur." };
  }

  const { data: candidates, error } = await supabase
    .from("users")
    .select("id, nom, password_hash, status")
    .ilike("nom", nom);

  if (error) {
    return { error: "Impossible de vérifier vos identifiants. Réessayez." };
  }

  const user = (candidates ?? []).find(
    (e) => normalizeName(e.nom).toLowerCase() === nom.toLowerCase()
  );

  if (!user) {
    return { error: "Nom ou mot de passe incorrect." };
  }

  if (user.status === "en_attente") {
    return {
      error: "Votre inscription est en attente de validation par un administrateur.",
    };
  }

  if (user.status === "refuse") {
    return { error: "Votre demande d'accès a été refusée. Contactez votre responsable." };
  }

  if (!user.password_hash) {
    return { error: "Compte incomplet. Contactez l'administrateur." };
  }

  const valid = await verifyPassword(password, user.password_hash);
  if (!valid) {
    return { error: "Nom ou mot de passe incorrect." };
  }

  await setSession(user.id);
  redirect("/dashboard");
}

export async function signOut() {
  await clearSession();
  redirect("/login");
}

export async function getCurrentUser(): Promise<User | null> {
  const userId = await getSessionUserId();
  if (!userId) return null;

  try {
    const supabase = createAdminClient();
    const { data: profile } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();

    if (!profile || profile.status !== "approuve") return null;
    return profile;
  } catch {
    return null;
  }
}

export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireAdmin(): Promise<User> {
  const user = await requireUser();
  if (user.role !== "admin") {
    throw new Error("Accès réservé aux administrateurs.");
  }
  return user;
}

export async function getPendingUsers(): Promise<User[]> {
  await requireAdmin();
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("users")
    .select("*")
    .eq("status", "en_attente")
    .order("created_at", { ascending: false });

  return data ?? [];
}

export async function approveUser(userId: string) {
  await requireAdmin();
  const supabase = createAdminClient();

  const { data: user, error } = await supabase
    .from("users")
    .update({ status: "approuve" as UserStatus })
    .eq("id", userId)
    .eq("status", "en_attente")
    .select("*")
    .single();

  if (error || !user) {
    return { error: "Utilisateur introuvable ou déjà traité." };
  }

  if (user.email) {
    await notifyUserRegistrationApproved({ email: user.email, nom: user.nom });
  }

  revalidatePath("/admin/users");
  revalidatePath("/admin/accounts");
  return { success: true, user };
}

export async function rejectUser(userId: string) {
  await requireAdmin();
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("users")
    .update({ status: "refuse" as UserStatus })
    .eq("id", userId);

  if (error) {
    return { error: "Impossible de refuser cette inscription." };
  }

  revalidatePath("/admin/users");
  revalidatePath("/admin/accounts");
  return { success: true };
}

export async function approveUserByToken(token: string) {
  const { verifyApprovalToken } = await import("@/lib/approval-token");
  const payload = await verifyApprovalToken(token);
  if (!payload) {
    return { error: "Lien de validation invalide ou expiré." };
  }

  const supabase = createAdminClient();
  const { data: user, error } = await supabase
    .from("users")
    .update({ status: "approuve" as UserStatus })
    .eq("id", payload.userId)
    .eq("status", "en_attente")
    .select("nom, email")
    .single();

  if (error || !user) {
    return { error: "Inscription déjà traitée ou introuvable." };
  }

  if (user.email) {
    await notifyUserRegistrationApproved({ email: user.email, nom: user.nom });
  }

  revalidatePath("/admin/users");
  revalidatePath("/admin/accounts");
  return { success: true, nom: user.nom };
}
