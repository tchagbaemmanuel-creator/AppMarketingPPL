-- ============================================================
-- Migration — Authentification par nom (employés PPL)
-- Exécuter dans l'éditeur SQL Supabase après schema.sql
-- ============================================================

-- Détacher les profils employés de Supabase Auth (connexion par nom uniquement)
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_id_fkey;
ALTER TABLE public.users ALTER COLUMN id SET DEFAULT uuid_generate_v4();
ALTER TABLE public.users ALTER COLUMN email DROP NOT NULL;

-- Supprimer le trigger d'inscription Auth (plus utilisé)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Employés exemple — adaptez les noms à votre équipe
INSERT INTO public.users (nom, role)
SELECT v.nom, v.role::user_role
FROM (VALUES
  ('Admin PPL', 'admin'),
  ('Jean Kouassi', 'membre'),
  ('Marie Diallo', 'membre'),
  ('Amadou Traoré', 'membre')
) AS v(nom, role)
WHERE NOT EXISTS (
  SELECT 1 FROM public.users u WHERE lower(u.nom) = lower(v.nom)
);

-- Promouvoir un admin si déjà existant :
-- UPDATE public.users SET role = 'admin' WHERE nom = 'Admin PPL';
