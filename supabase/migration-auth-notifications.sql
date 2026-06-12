-- ============================================================
-- Migration — Inscription, mot de passe et notifications
-- Exécuter dans l'éditeur SQL Supabase
-- ============================================================

CREATE TYPE user_status AS ENUM ('en_attente', 'approuve', 'refuse');

ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_id_fkey;
ALTER TABLE public.users ALTER COLUMN id SET DEFAULT uuid_generate_v4();
ALTER TABLE public.users ALTER COLUMN email DROP NOT NULL;

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS status user_status NOT NULL DEFAULT 'approuve';

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS password_hash TEXT;

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS fonction TEXT;

-- Unicité du nom pour les comptes approuvés uniquement
DROP INDEX IF EXISTS idx_users_nom_lower;
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_nom_approved
  ON public.users (lower(trim(nom)))
  WHERE status = 'approuve';

CREATE INDEX IF NOT EXISTS idx_users_status ON public.users (status);

-- Employés existants sans statut explicite → approuvés
UPDATE public.users SET status = 'approuve' WHERE status IS NULL;

-- ============================================================
-- Premier administrateur (adapter nom, email et mot de passe)
-- Le hash ci-dessous correspond au mot de passe : AdminPPL2024!
-- Générez un nouveau hash via l'app ou bcrypt si besoin.
-- ============================================================
-- INSERT INTO public.users (nom, email, role, status, password_hash, fonction)
-- SELECT 'Admin PPL', 'admin@votre-entreprise.com', 'admin', 'approuve',
--   '$2a$12$REMPLACER_PAR_HASH_BCRYPT', 'Administrateur'
-- WHERE NOT EXISTS (SELECT 1 FROM public.users WHERE role = 'admin');
