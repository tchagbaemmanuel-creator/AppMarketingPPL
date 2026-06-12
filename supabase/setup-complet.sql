-- ============================================================
-- Setup complet — Outils Marketing PPL
-- Projet : https://tdeucdnoohozogidhryc.supabase.co
-- Exécuter une seule fois sur une base Supabase vide
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Types ENUM
DO $$ BEGIN CREATE TYPE user_role AS ENUM ('admin', 'membre');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE user_status AS ENUM ('en_attente', 'approuve', 'refuse');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE resource_type AS ENUM ('physique', 'numerique', 'service');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE request_status AS ENUM ('en_attente', 'valide', 'refuse');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE movement_type AS ENUM ('ajout', 'retrait');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Table users (authentification par nom + mot de passe)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nom TEXT NOT NULL,
  email TEXT,
  fonction TEXT,
  role user_role NOT NULL DEFAULT 'membre',
  status user_status NOT NULL DEFAULT 'approuve',
  password_hash TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_nom_approved
  ON public.users (lower(trim(nom)))
  WHERE status = 'approuve';

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_lower
  ON public.users (lower(trim(email)))
  WHERE email IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_users_status ON public.users (status);

-- Table resources
CREATE TABLE IF NOT EXISTS public.resources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nom TEXT NOT NULL,
  categorie TEXT NOT NULL,
  description TEXT,
  type resource_type NOT NULL DEFAULT 'physique',
  quantite INTEGER NOT NULL DEFAULT 0 CHECK (quantite >= 0),
  seuil_minimum INTEGER NOT NULL DEFAULT 5 CHECK (seuil_minimum >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table withdrawal_requests
CREATE TABLE IF NOT EXISTS public.withdrawal_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  demandeur TEXT NOT NULL,
  fonction TEXT NOT NULL,
  resource_id UUID NOT NULL REFERENCES public.resources(id) ON DELETE RESTRICT,
  quantite INTEGER NOT NULL CHECK (quantite > 0),
  motif TEXT NOT NULL,
  statut request_status NOT NULL DEFAULT 'en_attente',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table stock_movements
CREATE TABLE IF NOT EXISTS public.stock_movements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  resource_id UUID NOT NULL REFERENCES public.resources(id) ON DELETE CASCADE,
  type_mouvement movement_type NOT NULL,
  quantite INTEGER NOT NULL CHECK (quantite > 0),
  commentaire TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_resources_categorie ON public.resources(categorie);
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_statut ON public.withdrawal_requests(statut);
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_user_id ON public.withdrawal_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_created_at ON public.withdrawal_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_stock_movements_resource_id ON public.stock_movements(resource_id);

-- Fonction validation demande → mise à jour stock
CREATE OR REPLACE FUNCTION public.validate_withdrawal_request()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_stock INTEGER;
BEGIN
  IF NEW.statut = 'valide' AND OLD.statut = 'en_attente' THEN
    SELECT quantite INTO current_stock
    FROM public.resources
    WHERE id = NEW.resource_id
    FOR UPDATE;

    IF current_stock < NEW.quantite THEN
      RAISE EXCEPTION 'Stock insuffisant pour cette ressource';
    END IF;

    UPDATE public.resources
    SET quantite = quantite - NEW.quantite
    WHERE id = NEW.resource_id;

    INSERT INTO public.stock_movements (resource_id, type_mouvement, quantite, commentaire)
    VALUES (
      NEW.resource_id,
      'retrait',
      NEW.quantite,
      'Retrait validé — ' || NEW.demandeur || ' (' || NEW.fonction || ')'
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_withdrawal_validated ON public.withdrawal_requests;
CREATE TRIGGER on_withdrawal_validated
  BEFORE UPDATE ON public.withdrawal_requests
  FOR EACH ROW EXECUTE FUNCTION public.validate_withdrawal_request();

-- RLS (utilisé si accès direct client ; le serveur utilise la service role)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawal_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;

-- Ressources exemple
INSERT INTO public.resources (nom, categorie, description, type, quantite, seuil_minimum)
SELECT v.nom, v.categorie, v.description, v.type::resource_type, v.quantite, v.seuil
FROM (VALUES
  ('Calendriers', 'Calendriers', 'Calendriers annuels de l''organisation', 'physique', 50, 10),
  ('T-shirts AA', 'T-shirts AA', 'T-shirts Association des Anciens', 'physique', 30, 5),
  ('T-shirts ASM', 'T-shirts ASM', 'T-shirts Association des Membres', 'physique', 25, 5),
  ('Brochures', 'Brochures', 'Brochures de présentation', 'physique', 100, 20),
  ('Fournitures de bureau', 'Fournitures de bureau', 'Stylos, carnets, etc.', 'physique', 40, 10),
  ('Affiches', 'Affiches', 'Affiches événementielles', 'physique', 60, 15),
  ('Flyers', 'Flyers', 'Flyers promotionnels', 'physique', 200, 30),
  ('Livret de formation AA', 'Livret de formation AA', 'Livret numérique formation AA', 'numerique', 999, 0),
  ('Livret de formation ASM', 'Livret de formation ASM', 'Livret numérique formation ASM', 'numerique', 999, 0),
  ('Supports PDF', 'Supports PDF', 'Documents PDF téléchargeables', 'numerique', 999, 0),
  ('Documents de formation', 'Documents de formation', 'Supports pédagogiques', 'numerique', 999, 0),
  ('Coaching AA', 'Coaching AA', 'Sessions de coaching AA', 'service', 20, 3),
  ('Coaching ASM', 'Coaching ASM', 'Sessions de coaching ASM', 'service', 20, 3)
) AS v(nom, categorie, description, type, quantite, seuil)
WHERE NOT EXISTS (SELECT 1 FROM public.resources LIMIT 1);

-- Administrateur par défaut
-- Nom : Admin PPL  |  Mot de passe : AdminPPL2024!
INSERT INTO public.users (nom, email, role, status, password_hash, fonction)
SELECT
  'Admin PPL',
  'admin@ppl.local',
  'admin'::user_role,
  'approuve'::user_status,
  '$2b$12$pUFodKV2L3MXwemp1N5kEuw9I4ye4rlbCx0tP5Uy6RQEHgofEhugC',
  'Administrateur'
WHERE NOT EXISTS (
  SELECT 1 FROM public.users WHERE role = 'admin'
);
