-- Table de liaison Pratique emblématique (curation 'main') <-> Marcheur
CREATE TABLE public.curation_marcheurs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  curation_id UUID NOT NULL REFERENCES public.exploration_curations(id) ON DELETE CASCADE,
  marcheur_id UUID NOT NULL REFERENCES public.exploration_marcheurs(id) ON DELETE CASCADE,
  role_label TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (curation_id, marcheur_id)
);

CREATE INDEX idx_curation_marcheurs_curation ON public.curation_marcheurs(curation_id);
CREATE INDEX idx_curation_marcheurs_marcheur ON public.curation_marcheurs(marcheur_id);

ALTER TABLE public.curation_marcheurs ENABLE ROW LEVEL SECURITY;

-- Lecture publique (cohérent avec les pratiques publiques)
CREATE POLICY "Public can view curation_marcheurs"
  ON public.curation_marcheurs FOR SELECT USING (true);

-- Écriture interdite en direct : tout passe par les RPC sécurisées
CREATE POLICY "Block direct insert curation_marcheurs"
  ON public.curation_marcheurs FOR INSERT WITH CHECK (false);
CREATE POLICY "Block direct update curation_marcheurs"
  ON public.curation_marcheurs FOR UPDATE USING (false);
CREATE POLICY "Block direct delete curation_marcheurs"
  ON public.curation_marcheurs FOR DELETE USING (false);

-- RPC : associer un marcheur à une pratique
CREATE OR REPLACE FUNCTION public.attach_pratique_to_marcheur(
  p_curation_id UUID,
  p_marcheur_id UUID,
  p_role_label TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_is_admin BOOLEAN;
  v_role TEXT;
  v_sense public.curation_sense;
  v_id UUID;
  v_max_order INTEGER;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Non authentifié'; END IF;

  v_is_admin := public.has_role(v_uid, 'admin'::public.app_role);
  IF NOT v_is_admin THEN
    SELECT role INTO v_role FROM public.community_profiles WHERE user_id = v_uid;
    IF v_role IS NULL OR v_role NOT IN ('ambassadeur', 'sentinelle') THEN
      RAISE EXCEPTION 'Permission refusée : ambassadeur, sentinelle ou admin requis';
    END IF;
  END IF;

  SELECT sense INTO v_sense FROM public.exploration_curations WHERE id = p_curation_id;
  IF v_sense IS NULL THEN RAISE EXCEPTION 'Pratique introuvable'; END IF;
  IF v_sense <> 'main' THEN RAISE EXCEPTION 'Seules les curations La Main peuvent être liées à un marcheur'; END IF;

  SELECT COALESCE(MAX(display_order), -1) + 1 INTO v_max_order
  FROM public.curation_marcheurs WHERE curation_id = p_curation_id;

  INSERT INTO public.curation_marcheurs (curation_id, marcheur_id, role_label, display_order, created_by)
  VALUES (p_curation_id, p_marcheur_id, NULLIF(TRIM(p_role_label), ''), v_max_order, v_uid)
  ON CONFLICT (curation_id, marcheur_id)
    DO UPDATE SET role_label = EXCLUDED.role_label
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.attach_pratique_to_marcheur(UUID, UUID, TEXT) TO authenticated;

-- RPC : détacher
CREATE OR REPLACE FUNCTION public.detach_pratique_from_marcheur(
  p_curation_id UUID,
  p_marcheur_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_is_admin BOOLEAN;
  v_role TEXT;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Non authentifié'; END IF;
  v_is_admin := public.has_role(v_uid, 'admin'::public.app_role);
  IF NOT v_is_admin THEN
    SELECT role INTO v_role FROM public.community_profiles WHERE user_id = v_uid;
    IF v_role IS NULL OR v_role NOT IN ('ambassadeur', 'sentinelle') THEN
      RAISE EXCEPTION 'Permission refusée : ambassadeur, sentinelle ou admin requis';
    END IF;
  END IF;

  DELETE FROM public.curation_marcheurs
  WHERE curation_id = p_curation_id AND marcheur_id = p_marcheur_id;
  RETURN TRUE;
END;
$$;

GRANT EXECUTE ON FUNCTION public.detach_pratique_from_marcheur(UUID, UUID) TO authenticated;