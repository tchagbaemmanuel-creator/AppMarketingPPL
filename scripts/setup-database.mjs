/**
 * Applique supabase/setup-complet.sql sur le projet Supabase.
 *
 * Usage :
 *   SUPABASE_DB_PASSWORD=votre_mot_de_passe npm run db:setup
 *
 * Ou avec l'URL complète :
 *   DATABASE_URL=postgresql://postgres.[ref]:[password]@... npm run db:setup
 */

import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import pg from "pg";

const PROJECT_REF = "tdeucdnoohozogidhryc";
const sqlPath = join(dirname(fileURLToPath(import.meta.url)), "..", "supabase", "setup-complet.sql");

function getConnectionString() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;

  const password = process.env.SUPABASE_DB_PASSWORD;
  if (!password) {
    console.error(
      "Erreur : définissez SUPABASE_DB_PASSWORD ou DATABASE_URL.\n" +
        "Mot de passe : Supabase Dashboard → Project Settings → Database → Database password"
    );
    process.exit(1);
  }

  const host = process.env.SUPABASE_DB_HOST ?? `db.${PROJECT_REF}.supabase.co`;
  return `postgresql://postgres:${encodeURIComponent(password)}@${host}:5432/postgres`;
}

const sql = readFileSync(sqlPath, "utf8");
const client = new pg.Client({
  connectionString: getConnectionString(),
  ssl: { rejectUnauthorized: false },
});

try {
  await client.connect();
  console.log("Connexion OK — application du schéma...");
  await client.query(sql);
  console.log("Base de données configurée avec succès.");
  console.log("Admin par défaut : Admin PPL / AdminPPL2024!");
} catch (error) {
  console.error("Échec :", error.message);
  process.exit(1);
} finally {
  await client.end();
}
