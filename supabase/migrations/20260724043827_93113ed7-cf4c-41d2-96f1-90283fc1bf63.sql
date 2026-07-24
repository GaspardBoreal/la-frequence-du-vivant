
-- =============================================================
-- PHASE 1 : Famille client + entité Propriété
-- =============================================================

-- 1. Enum Famille Client
DO $$ BEGIN
  CREATE TYPE public.famille_client AS ENUM ('PROPRIETAIRE_LIEUX', 'PAYSAGISTE', 'AUTRE');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2. Enum rôle propriété (pour community_profiles)
DO $$ BEGIN
  CREATE TYPE public.role_propriete AS ENUM ('marcheur_historique', 'proprietaire', 'prestataire');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 3. Enum rôle d'accès entreprise → propriété
DO $$ BEGIN
  CREATE TYPE public.propriete_acces_role AS ENUM ('gestionnaire', 'prestataire', 'lecture');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 4. Ajout colonnes existantes
ALTER TABLE public.crm_companies
  ADD COLUMN IF NOT EXISTS famille_client public.famille_client;

ALTER TABLE public.community_profiles
  ADD COLUMN IF NOT EXISTS role_propriete public.role_propriete NOT NULL DEFAULT 'marcheur_historique';

-- =============================================================
-- 5. Table proprietes
-- =============================================================
CREATE TABLE IF NOT EXISTS public.proprietes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom TEXT NOT NULL,
  slug TEXT UNIQUE,
  description TEXT,
  adresse TEXT,
  ville TEXT,
  code_postal TEXT,
  departement TEXT,
  region TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  surface_hectares NUMERIC(10,3),
  photo_hero_url TEXT,
  owner_company_id UUID REFERENCES public.crm_companies(id) ON DELETE SET NULL,
  main_walker_id UUID REFERENCES public.community_profiles(id) ON DELETE SET NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.proprietes TO authenticated;
GRANT ALL ON public.proprietes TO service_role;

CREATE INDEX IF NOT EXISTS idx_proprietes_owner ON public.proprietes(owner_company_id);
CREATE INDEX IF NOT EXISTS idx_proprietes_main_walker ON public.proprietes(main_walker_id);
CREATE INDEX IF NOT EXISTS idx_proprietes_slug ON public.proprietes(slug);

ALTER TABLE public.proprietes ENABLE ROW LEVEL SECURITY;

-- =============================================================
-- 6. Liaisons propriété ↔ marcheurs
-- =============================================================
CREATE TABLE IF NOT EXISTS public.propriete_marcheurs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  propriete_id UUID NOT NULL REFERENCES public.proprietes(id) ON DELETE CASCADE,
  community_profile_id UUID NOT NULL REFERENCES public.community_profiles(id) ON DELETE CASCADE,
  role public.role_propriete NOT NULL DEFAULT 'proprietaire',
  is_main BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (propriete_id, community_profile_id)
);

-- Un seul is_main=true par marcheur
CREATE UNIQUE INDEX IF NOT EXISTS uniq_propriete_marcheurs_one_main
  ON public.propriete_marcheurs(community_profile_id)
  WHERE is_main;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.propriete_marcheurs TO authenticated;
GRANT ALL ON public.propriete_marcheurs TO service_role;

ALTER TABLE public.propriete_marcheurs ENABLE ROW LEVEL SECURITY;

-- =============================================================
-- 7. Liaisons propriété ↔ entreprises
-- =============================================================
CREATE TABLE IF NOT EXISTS public.propriete_companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  propriete_id UUID NOT NULL REFERENCES public.proprietes(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.crm_companies(id) ON DELETE CASCADE,
  role public.propriete_acces_role NOT NULL DEFAULT 'prestataire',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (propriete_id, company_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.propriete_companies TO authenticated;
GRANT ALL ON public.propriete_companies TO service_role;

ALTER TABLE public.propriete_companies ENABLE ROW LEVEL SECURITY;

-- =============================================================
-- 8. Liaisons propriété ↔ événements marches
-- =============================================================
CREATE TABLE IF NOT EXISTS public.propriete_marche_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  propriete_id UUID NOT NULL REFERENCES public.proprietes(id) ON DELETE CASCADE,
  marche_event_id UUID NOT NULL REFERENCES public.marche_events(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (propriete_id, marche_event_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.propriete_marche_events TO authenticated;
GRANT ALL ON public.propriete_marche_events TO service_role;

ALTER TABLE public.propriete_marche_events ENABLE ROW LEVEL SECURITY;

-- =============================================================
-- 9. Helpers is_admin (déjà existant sans doute) — sinon fallback via user_roles
-- =============================================================
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  );
$$;

-- =============================================================
-- 10. Fonction sécurisée : accès propriété pour l'utilisateur courant
-- =============================================================
CREATE OR REPLACE FUNCTION public.user_can_access_propriete(_propriete_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.propriete_marcheurs pm
    JOIN public.community_profiles cp ON cp.id = pm.community_profile_id
    WHERE pm.propriete_id = _propriete_id
      AND cp.user_id = auth.uid()
  ) OR public.is_current_user_admin();
$$;

-- =============================================================
-- 11. RPC user apps access (login enrichi)
-- =============================================================
CREATE OR REPLACE FUNCTION public.get_user_apps_access()
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile_id UUID;
  v_proprietes JSONB;
  v_main_id UUID;
BEGIN
  SELECT id INTO v_profile_id
  FROM public.community_profiles
  WHERE user_id = auth.uid()
  LIMIT 1;

  IF v_profile_id IS NULL THEN
    RETURN jsonb_build_object(
      'hasMarcheurAccess', false,
      'proprietesAccessibles', '[]'::jsonb,
      'proprietePrincipaleId', NULL
    );
  END IF;

  SELECT jsonb_agg(
    jsonb_build_object(
      'id', p.id,
      'nom', p.nom,
      'slug', p.slug,
      'ville', p.ville,
      'photo_hero_url', p.photo_hero_url,
      'role', pm.role,
      'is_main', pm.is_main
    ) ORDER BY pm.is_main DESC, p.nom
  ),
  MAX(CASE WHEN pm.is_main THEN p.id END)
  INTO v_proprietes, v_main_id
  FROM public.propriete_marcheurs pm
  JOIN public.proprietes p ON p.id = pm.propriete_id
  WHERE pm.community_profile_id = v_profile_id
    AND p.is_active = true;

  RETURN jsonb_build_object(
    'hasMarcheurAccess', true,
    'proprietesAccessibles', COALESCE(v_proprietes, '[]'::jsonb),
    'proprietePrincipaleId', v_main_id
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_user_apps_access() TO authenticated;

-- =============================================================
-- 12. Trigger : maj role_propriete sur community_profiles
-- =============================================================
CREATE OR REPLACE FUNCTION public.refresh_community_role_propriete(_profile_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_role public.role_propriete;
BEGIN
  SELECT CASE
    WHEN EXISTS (
      SELECT 1 FROM public.propriete_marcheurs
      WHERE community_profile_id = _profile_id AND role = 'proprietaire'
    ) THEN 'proprietaire'::public.role_propriete
    WHEN EXISTS (
      SELECT 1 FROM public.propriete_marcheurs
      WHERE community_profile_id = _profile_id AND role = 'prestataire'
    ) THEN 'prestataire'::public.role_propriete
    ELSE 'marcheur_historique'::public.role_propriete
  END INTO v_new_role;

  UPDATE public.community_profiles
  SET role_propriete = v_new_role
  WHERE id = _profile_id AND role_propriete <> v_new_role;
END;
$$;

CREATE OR REPLACE FUNCTION public.trg_refresh_role_propriete()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM public.refresh_community_role_propriete(OLD.community_profile_id);
    RETURN OLD;
  ELSE
    PERFORM public.refresh_community_role_propriete(NEW.community_profile_id);
    IF TG_OP = 'UPDATE' AND OLD.community_profile_id <> NEW.community_profile_id THEN
      PERFORM public.refresh_community_role_propriete(OLD.community_profile_id);
    END IF;
    RETURN NEW;
  END IF;
END;
$$;

DROP TRIGGER IF EXISTS trg_propriete_marcheurs_role ON public.propriete_marcheurs;
CREATE TRIGGER trg_propriete_marcheurs_role
AFTER INSERT OR UPDATE OR DELETE ON public.propriete_marcheurs
FOR EACH ROW EXECUTE FUNCTION public.trg_refresh_role_propriete();

-- =============================================================
-- 13. Trigger : slug auto pour proprietes
-- =============================================================
CREATE OR REPLACE FUNCTION public.trg_propriete_slug()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_base TEXT;
  v_slug TEXT;
  v_suffix INT := 0;
BEGIN
  IF NEW.slug IS NOT NULL AND NEW.slug <> '' THEN
    RETURN NEW;
  END IF;
  v_base := regexp_replace(
    lower(unaccent(NEW.nom)),
    '[^a-z0-9]+', '-', 'g'
  );
  v_base := trim(both '-' from v_base);
  IF v_base = '' THEN v_base := 'propriete'; END IF;
  v_slug := v_base;
  WHILE EXISTS (SELECT 1 FROM public.proprietes WHERE slug = v_slug AND id <> COALESCE(NEW.id, gen_random_uuid())) LOOP
    v_suffix := v_suffix + 1;
    v_slug := v_base || '-' || v_suffix;
  END LOOP;
  NEW.slug := v_slug;
  RETURN NEW;
END;
$$;

-- unaccent required
CREATE EXTENSION IF NOT EXISTS unaccent;

DROP TRIGGER IF EXISTS trg_proprietes_slug ON public.proprietes;
CREATE TRIGGER trg_proprietes_slug
BEFORE INSERT OR UPDATE OF nom, slug ON public.proprietes
FOR EACH ROW EXECUTE FUNCTION public.trg_propriete_slug();

-- =============================================================
-- 14. Trigger updated_at
-- =============================================================
CREATE OR REPLACE FUNCTION public.trg_touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at := now(); RETURN NEW; END; $$;

DROP TRIGGER IF EXISTS trg_proprietes_updated_at ON public.proprietes;
CREATE TRIGGER trg_proprietes_updated_at
BEFORE UPDATE ON public.proprietes
FOR EACH ROW EXECUTE FUNCTION public.trg_touch_updated_at();

-- =============================================================
-- 15. RLS policies
-- =============================================================

-- proprietes : lecture par marcheurs rattachés + admins ; écriture admins
DROP POLICY IF EXISTS "Proprietes lisibles par acces" ON public.proprietes;
CREATE POLICY "Proprietes lisibles par acces"
ON public.proprietes FOR SELECT
TO authenticated
USING (public.user_can_access_propriete(id));

DROP POLICY IF EXISTS "Proprietes gerees par admin" ON public.proprietes;
CREATE POLICY "Proprietes gerees par admin"
ON public.proprietes FOR ALL
TO authenticated
USING (public.is_current_user_admin())
WITH CHECK (public.is_current_user_admin());

-- propriete_marcheurs : le marcheur voit ses liens ; admin tout
DROP POLICY IF EXISTS "Liens marcheur lisibles" ON public.propriete_marcheurs;
CREATE POLICY "Liens marcheur lisibles"
ON public.propriete_marcheurs FOR SELECT
TO authenticated
USING (
  public.is_current_user_admin() OR EXISTS (
    SELECT 1 FROM public.community_profiles cp
    WHERE cp.id = community_profile_id AND cp.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Liens marcheur admin" ON public.propriete_marcheurs;
CREATE POLICY "Liens marcheur admin"
ON public.propriete_marcheurs FOR ALL
TO authenticated
USING (public.is_current_user_admin())
WITH CHECK (public.is_current_user_admin());

-- Le marcheur peut basculer sa propriété principale (is_main) sur ses propres liens
DROP POLICY IF EXISTS "Marcheur bascule main" ON public.propriete_marcheurs;
CREATE POLICY "Marcheur bascule main"
ON public.propriete_marcheurs FOR UPDATE
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.community_profiles cp
  WHERE cp.id = community_profile_id AND cp.user_id = auth.uid()
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.community_profiles cp
  WHERE cp.id = community_profile_id AND cp.user_id = auth.uid()
));

-- propriete_companies : marcheur voit si accès propriété ; admin tout
DROP POLICY IF EXISTS "Companies liees visibles" ON public.propriete_companies;
CREATE POLICY "Companies liees visibles"
ON public.propriete_companies FOR SELECT
TO authenticated
USING (public.user_can_access_propriete(propriete_id));

DROP POLICY IF EXISTS "Companies liees admin" ON public.propriete_companies;
CREATE POLICY "Companies liees admin"
ON public.propriete_companies FOR ALL
TO authenticated
USING (public.is_current_user_admin())
WITH CHECK (public.is_current_user_admin());

-- propriete_marche_events : idem
DROP POLICY IF EXISTS "Events lies visibles" ON public.propriete_marche_events;
CREATE POLICY "Events lies visibles"
ON public.propriete_marche_events FOR SELECT
TO authenticated
USING (public.user_can_access_propriete(propriete_id));

DROP POLICY IF EXISTS "Events lies admin" ON public.propriete_marche_events;
CREATE POLICY "Events lies admin"
ON public.propriete_marche_events FOR ALL
TO authenticated
USING (public.is_current_user_admin())
WITH CHECK (public.is_current_user_admin());
