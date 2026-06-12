import { createAdminClient } from "@/lib/supabase/admin";

/** Client Supabase côté serveur (contourne RLS — autorisation via session employé). */
export async function createClient() {
  return createAdminClient();
}
