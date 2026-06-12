-- ============================================================
-- Schéma Supabase — Gestion Outils Marketing
-- Exécuter dans l'éditeur SQL du tableau de bord Supabase
-- ============================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TYPES ENUM
-- ============================================================

CREATE TYPE user_role AS ENUM ('admin', 'membre');
CREATE TYPE resource_type AS ENUM ('physique', 'numerique', 'service');
CREATE TYPE request_status AS ENUM ('en_attente', 'valide', 'refuse');
CREATE TYPE movement_type AS ENUM ('ajout', 'retrait');

-- ============================================================
-- TABLE: users (profil lié à auth.users)
-- ============================================================

CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nom TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role user_role NOT NULL DEFAULT 'membre',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE: resources
-- ============================================================

CREATE TABLE public.resources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nom TEXT NOT NULL,
  categorie TEXT NOT NULL,
  description TEXT,
  type resource_type NOT NULL DEFAULT 'physique',
  quantite INTEGER NOT NULL DEFAULT 0 CHECK (quantite >= 0),
  seuil_minimum INTEGER NOT NULL DEFAULT 5 CHECK (seuil_minimum >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE: withdrawal_requests
-- ============================================================

CREATE TABLE public.withdrawal_requests (
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

-- ============================================================
-- TABLE: stock_movements
-- ============================================================

CREATE TABLE public.stock_movements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  resource_id UUID NOT NULL REFERENCES public.resources(id) ON DELETE CASCADE,
  type_mouvement movement_type NOT NULL,
  quantite INTEGER NOT NULL CHECK (quantite > 0),
  commentaire TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- INDEX
-- ============================================================

CREATE INDEX idx_resources_categorie ON public.resources(categorie);
CREATE INDEX idx_withdrawal_requests_statut ON public.withdrawal_requests(statut);
CREATE INDEX idx_withdrawal_requests_user_id ON public.withdrawal_requests(user_id);
CREATE INDEX idx_withdrawal_requests_created_at ON public.withdrawal_requests(created_at DESC);
CREATE INDEX idx_stock_movements_resource_id ON public.stock_movements(resource_id);

-- ============================================================
-- FONCTIONS UTILITAIRES
-- ============================================================

-- Vérifie si l'utilisateur connecté est admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- Crée le profil utilisateur à l'inscription
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, nom, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nom', split_part(NEW.email, '@', 1)),
    NEW.email,
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'membre')
  );
  RETURN NEW;
END;
$$;

-- Valide une demande et met à jour le stock automatiquement
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

-- ============================================================
-- TRIGGERS
-- ============================================================

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TRIGGER on_withdrawal_validated
  BEFORE UPDATE ON public.withdrawal_requests
  FOR EACH ROW EXECUTE FUNCTION public.validate_withdrawal_request();

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawal_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;

-- USERS
CREATE POLICY "users_select_own_or_admin"
  ON public.users FOR SELECT
  USING (auth.uid() = id OR public.is_admin());

CREATE POLICY "users_update_admin"
  ON public.users FOR UPDATE
  USING (public.is_admin());

-- RESOURCES
CREATE POLICY "resources_select_authenticated"
  ON public.resources FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "resources_insert_admin"
  ON public.resources FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "resources_update_admin"
  ON public.resources FOR UPDATE
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "resources_delete_admin"
  ON public.resources FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- WITHDRAWAL REQUESTS
CREATE POLICY "requests_select_own_or_admin"
  ON public.withdrawal_requests FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "requests_insert_authenticated"
  ON public.withdrawal_requests FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "requests_update_admin"
  ON public.withdrawal_requests FOR UPDATE
  TO authenticated
  USING (public.is_admin());

-- STOCK MOVEMENTS
CREATE POLICY "movements_select_authenticated"
  ON public.stock_movements FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "movements_insert_admin"
  ON public.stock_movements FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

-- ============================================================
-- DONNÉES INITIALES (ressources exemple)
-- ============================================================

INSERT INTO public.resources (nom, categorie, description, type, quantite, seuil_minimum) VALUES
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
  ('Coaching ASM', 'Coaching ASM', 'Sessions de coaching ASM', 'service', 20, 3);

-- ============================================================
-- CRÉER LE PREMIER ADMIN (à adapter après inscription)
-- ============================================================
-- 1. Créez un compte via l'application ou le dashboard Supabase Auth
-- 2. Exécutez ensuite :
-- UPDATE public.users SET role = 'admin' WHERE email = 'votre-email@exemple.com';
