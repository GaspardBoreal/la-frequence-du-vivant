-- 1. Colonnes de validation
ALTER TABLE public.propriete_entretiens
  ADD COLUMN IF NOT EXISTS validated_at timestamptz,
  ADD COLUMN IF NOT EXISTS validated_by uuid,
  ADD COLUMN IF NOT EXISTS validated_with text,
  ADD COLUMN IF NOT EXISTS reopened_at timestamptz,
  ADD COLUMN IF NOT EXISTS reopened_by uuid;

-- 2. Historique des révisions de cartes
CREATE TABLE IF NOT EXISTS public.propriete_entretien_extrait_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  extrait_id uuid NOT NULL REFERENCES public.propriete_entretien_extraits(id) ON DELETE CASCADE,
  entretien_id uuid NOT NULL REFERENCES public.propriete_entretiens(id) ON DELETE CASCADE,
  titre text NOT NULL,
  detail text,
  verbatim text,
  statut text NOT NULL,
  motif text,
  revised_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.propriete_entretien_extrait_versions TO authenticated;
GRANT ALL ON public.propriete_entretien_extrait_versions TO service_role;

ALTER TABLE public.propriete_entretien_extrait_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "extrait_versions_read" ON public.propriete_entretien_extrait_versions
FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.propriete_entretiens e
  WHERE e.id = propriete_entretien_extrait_versions.entretien_id
    AND public.can_access_propriete(e.propriete_id)
));

CREATE INDEX IF NOT EXISTS idx_extrait_versions_extrait
  ON public.propriete_entretien_extrait_versions(extrait_id, created_at DESC);

-- 3. Verrou base : rien ne bouge sur un entretien validé, sauf via les RPC
CREATE OR REPLACE FUNCTION public.guard_entretien_extrait_locked()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_statut text;
  v_bypass text := current_setting('app.entretien_bypass', true);
BEGIN
  IF v_bypass = 'on' THEN
    RETURN COALESCE(NEW, OLD);
  END IF;
  SELECT statut INTO v_statut FROM public.propriete_entretiens WHERE id = OLD.entretien_id;
  IF v_statut = 'valide' THEN
    RAISE EXCEPTION 'ENTRETIEN_VALIDE: cette carte est verrouillée, passez par une correction tracée'
      USING ERRCODE = '42501';
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_entretien_extrait_locked ON public.propriete_entretien_extraits;
CREATE TRIGGER trg_guard_entretien_extrait_locked
BEFORE UPDATE OR DELETE ON public.propriete_entretien_extraits
FOR EACH ROW EXECUTE FUNCTION public.guard_entretien_extrait_locked();

CREATE OR REPLACE FUNCTION public.guard_entretien_locked()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_bypass text := current_setting('app.entretien_bypass', true);
BEGIN
  IF v_bypass = 'on' THEN
    RETURN COALESCE(NEW, OLD);
  END IF;
  IF TG_OP = 'DELETE' THEN
    IF OLD.statut = 'valide' THEN
      RAISE EXCEPTION 'ENTRETIEN_VALIDE: un entretien validé ne peut pas être supprimé'
        USING ERRCODE = '42501';
    END IF;
    RETURN OLD;
  END IF;
  IF OLD.statut = 'valide' THEN
    RAISE EXCEPTION 'ENTRETIEN_VALIDE: cet entretien est verrouillé, rouvrez-le d''abord'
      USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_entretien_locked ON public.propriete_entretiens;
CREATE TRIGGER trg_guard_entretien_locked
BEFORE UPDATE OR DELETE ON public.propriete_entretiens
FOR EACH ROW EXECUTE FUNCTION public.guard_entretien_locked();

-- 4. RPC : valider
CREATE OR REPLACE FUNCTION public.valider_entretien(
  _entretien_id uuid,
  _validated_with text DEFAULT NULL,
  _tenu_le date DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_prop uuid;
  v_statut text;
  v_pending int;
  v_accepted int;
BEGIN
  SELECT propriete_id, statut INTO v_prop, v_statut
  FROM public.propriete_entretiens WHERE id = _entretien_id;
  IF v_prop IS NULL THEN RAISE EXCEPTION 'ENTRETIEN_INTROUVABLE'; END IF;
  IF NOT public.can_edit_propriete_onboarding(v_prop) THEN
    RAISE EXCEPTION 'NON_AUTORISE' USING ERRCODE = '42501';
  END IF;
  IF v_statut = 'valide' THEN RAISE EXCEPTION 'DEJA_VALIDE'; END IF;

  SELECT count(*) FILTER (WHERE statut = 'propose'),
         count(*) FILTER (WHERE statut = 'accepte')
    INTO v_pending, v_accepted
  FROM public.propriete_entretien_extraits WHERE entretien_id = _entretien_id;

  IF v_pending > 0 THEN RAISE EXCEPTION 'CARTES_EN_ATTENTE:%', v_pending; END IF;
  IF v_accepted = 0 THEN RAISE EXCEPTION 'AUCUNE_CARTE_ACCEPTEE'; END IF;

  PERFORM set_config('app.entretien_bypass', 'on', true);
  UPDATE public.propriete_entretiens
     SET statut = 'valide',
         validated_at = now(),
         validated_by = auth.uid(),
         validated_with = NULLIF(btrim(COALESCE(_validated_with, '')), ''),
         tenu_le = COALESCE(_tenu_le, tenu_le),
         reopened_at = NULL,
         reopened_by = NULL,
         updated_at = now()
   WHERE id = _entretien_id;
  PERFORM set_config('app.entretien_bypass', 'off', true);

  RETURN jsonb_build_object('cartes', v_accepted, 'validated_at', now());
END;
$$;

-- 5. RPC : rouvrir
CREATE OR REPLACE FUNCTION public.rouvrir_entretien(_entretien_id uuid, _motif text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_prop uuid;
BEGIN
  SELECT propriete_id INTO v_prop FROM public.propriete_entretiens WHERE id = _entretien_id;
  IF v_prop IS NULL THEN RAISE EXCEPTION 'ENTRETIEN_INTROUVABLE'; END IF;
  IF NOT public.can_edit_propriete_onboarding(v_prop) THEN
    RAISE EXCEPTION 'NON_AUTORISE' USING ERRCODE = '42501';
  END IF;

  PERFORM set_config('app.entretien_bypass', 'on', true);
  UPDATE public.propriete_entretiens
     SET statut = 'recolte', reopened_at = now(), reopened_by = auth.uid(), updated_at = now()
   WHERE id = _entretien_id;
  PERFORM set_config('app.entretien_bypass', 'off', true);

  INSERT INTO public.propriete_entretien_extrait_versions
    (extrait_id, entretien_id, titre, detail, verbatim, statut, motif, revised_by)
  SELECT x.id, x.entretien_id, x.titre, x.detail, x.verbatim, x.statut,
         COALESCE(NULLIF(btrim(COALESCE(_motif, '')), ''), 'Réouverture de l''entretien'),
         auth.uid()
  FROM public.propriete_entretien_extraits x
  WHERE x.entretien_id = _entretien_id AND x.statut = 'accepte';
END;
$$;

-- 6. RPC : réviser une carte verrouillée
CREATE OR REPLACE FUNCTION public.reviser_extrait(
  _extrait_id uuid,
  _titre text,
  _detail text,
  _motif text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_prop uuid;
  x public.propriete_entretien_extraits%ROWTYPE;
BEGIN
  SELECT * INTO x FROM public.propriete_entretien_extraits WHERE id = _extrait_id;
  IF x.id IS NULL THEN RAISE EXCEPTION 'CARTE_INTROUVABLE'; END IF;
  SELECT propriete_id INTO v_prop FROM public.propriete_entretiens WHERE id = x.entretien_id;
  IF NOT public.can_edit_propriete_onboarding(v_prop) THEN
    RAISE EXCEPTION 'NON_AUTORISE' USING ERRCODE = '42501';
  END IF;
  IF COALESCE(NULLIF(btrim(COALESCE(_motif, '')), ''), '') = '' THEN
    RAISE EXCEPTION 'MOTIF_REQUIS';
  END IF;
  IF COALESCE(NULLIF(btrim(COALESCE(_titre, '')), ''), '') = '' THEN
    RAISE EXCEPTION 'TITRE_REQUIS';
  END IF;

  INSERT INTO public.propriete_entretien_extrait_versions
    (extrait_id, entretien_id, titre, detail, verbatim, statut, motif, revised_by)
  VALUES (x.id, x.entretien_id, x.titre, x.detail, x.verbatim, x.statut, btrim(_motif), auth.uid());

  PERFORM set_config('app.entretien_bypass', 'on', true);
  UPDATE public.propriete_entretien_extraits
     SET titre = btrim(_titre), detail = NULLIF(btrim(COALESCE(_detail, '')), ''), updated_at = now()
   WHERE id = _extrait_id;
  PERFORM set_config('app.entretien_bypass', 'off', true);
END;
$$;

-- 7. Source unique : base de connaissance validée
CREATE OR REPLACE FUNCTION public.get_propriete_connaissance(_propriete_id uuid)
RETURNS TABLE (
  id uuid,
  entretien_id uuid,
  entretien_titre text,
  registre text,
  titre text,
  detail text,
  verbatim text,
  minutage text,
  validated_at timestamptz,
  validated_with text,
  ordre int
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT x.id, e.id, e.titre, x.registre, x.titre, x.detail, x.verbatim, x.minutage,
         e.validated_at, e.validated_with, x.ordre
  FROM public.propriete_entretien_extraits x
  JOIN public.propriete_entretiens e ON e.id = x.entretien_id
  WHERE e.propriete_id = _propriete_id
    AND e.statut = 'valide'
    AND x.statut = 'accepte'
    AND public.can_access_propriete(_propriete_id)
  ORDER BY x.registre, x.ordre;
$$;

REVOKE ALL ON FUNCTION public.valider_entretien(uuid, text, date) FROM anon, public;
REVOKE ALL ON FUNCTION public.rouvrir_entretien(uuid, text) FROM anon, public;
REVOKE ALL ON FUNCTION public.reviser_extrait(uuid, text, text, text) FROM anon, public;
REVOKE ALL ON FUNCTION public.get_propriete_connaissance(uuid) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.valider_entretien(uuid, text, date) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.rouvrir_entretien(uuid, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.reviser_extrait(uuid, text, text, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_propriete_connaissance(uuid) TO authenticated, service_role;