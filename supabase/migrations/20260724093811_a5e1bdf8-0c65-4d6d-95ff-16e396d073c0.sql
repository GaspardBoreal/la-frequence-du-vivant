
CREATE TABLE public.propriete_flora_diagnostics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  propriete_id uuid NOT NULL REFERENCES public.proprietes(id) ON DELETE CASCADE UNIQUE,
  skip_bioindication boolean NOT NULL DEFAULT false,
  observed_plants text[] NOT NULL DEFAULT ARRAY[]::text[],
  flora_conclusion text,
  concordance jsonb NOT NULL DEFAULT '{}'::jsonb,
  icg_score integer,
  notes text,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.propriete_flora_diagnostics TO authenticated;
GRANT ALL ON public.propriete_flora_diagnostics TO service_role;

ALTER TABLE public.propriete_flora_diagnostics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "flora_read" ON public.propriete_flora_diagnostics
FOR SELECT TO authenticated
USING (
  public.check_is_admin_user(auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.proprietes p
    LEFT JOIN public.community_profiles cp ON cp.id = p.main_walker_id
    WHERE p.id = propriete_flora_diagnostics.propriete_id AND cp.user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public.propriete_marcheurs pm
    JOIN public.community_profiles cp ON cp.id = pm.community_profile_id
    WHERE pm.propriete_id = propriete_flora_diagnostics.propriete_id AND cp.user_id = auth.uid()
  )
);

CREATE POLICY "flora_write" ON public.propriete_flora_diagnostics
FOR ALL TO authenticated
USING (
  public.check_is_admin_user(auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.proprietes p
    LEFT JOIN public.community_profiles cp ON cp.id = p.main_walker_id
    WHERE p.id = propriete_flora_diagnostics.propriete_id AND cp.user_id = auth.uid()
  )
)
WITH CHECK (
  public.check_is_admin_user(auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.proprietes p
    LEFT JOIN public.community_profiles cp ON cp.id = p.main_walker_id
    WHERE p.id = propriete_flora_diagnostics.propriete_id AND cp.user_id = auth.uid()
  )
);

CREATE OR REPLACE FUNCTION public.tg_flora_touch()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.updated_at := now();
  NEW.updated_by := auth.uid();
  RETURN NEW;
END $$;

CREATE TRIGGER trg_flora_updated
BEFORE UPDATE ON public.propriete_flora_diagnostics
FOR EACH ROW EXECUTE FUNCTION public.tg_flora_touch();

CREATE OR REPLACE FUNCTION public.upsert_propriete_flora(
  p_propriete_id uuid,
  p_skip_bioindication boolean DEFAULT NULL,
  p_observed_plants text[] DEFAULT NULL,
  p_flora_conclusion text DEFAULT NULL,
  p_concordance jsonb DEFAULT NULL,
  p_icg_score integer DEFAULT NULL,
  p_notes text DEFAULT NULL,
  p_completed boolean DEFAULT NULL
) RETURNS public.propriete_flora_diagnostics
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_row public.propriete_flora_diagnostics;
  v_uid uuid := auth.uid();
  v_allowed boolean;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'auth required'; END IF;

  SELECT (
    public.check_is_admin_user(v_uid)
    OR EXISTS (
      SELECT 1 FROM public.proprietes p
      LEFT JOIN public.community_profiles cp ON cp.id = p.main_walker_id
      WHERE p.id = p_propriete_id AND cp.user_id = v_uid
    )
    OR EXISTS (
      SELECT 1 FROM public.propriete_marcheurs pm
      JOIN public.community_profiles cp ON cp.id = pm.community_profile_id
      WHERE pm.propriete_id = p_propriete_id AND cp.user_id = v_uid
    )
  ) INTO v_allowed;

  IF NOT v_allowed THEN RAISE EXCEPTION 'forbidden'; END IF;

  INSERT INTO public.propriete_flora_diagnostics AS s (propriete_id, updated_by)
  VALUES (p_propriete_id, v_uid)
  ON CONFLICT (propriete_id) DO NOTHING;

  UPDATE public.propriete_flora_diagnostics
  SET
    skip_bioindication = COALESCE(p_skip_bioindication, skip_bioindication),
    observed_plants    = COALESCE(p_observed_plants, observed_plants),
    flora_conclusion   = COALESCE(p_flora_conclusion, flora_conclusion),
    concordance        = COALESCE(p_concordance, concordance),
    icg_score          = COALESCE(p_icg_score, icg_score),
    notes              = COALESCE(p_notes, notes),
    completed_at       = CASE
      WHEN p_completed IS TRUE THEN COALESCE(completed_at, now())
      WHEN p_completed IS FALSE THEN NULL
      ELSE completed_at
    END,
    updated_by         = v_uid
  WHERE propriete_id = p_propriete_id
  RETURNING * INTO v_row;

  RETURN v_row;
END $$;

GRANT EXECUTE ON FUNCTION public.upsert_propriete_flora(uuid, boolean, text[], text, jsonb, integer, text, boolean) TO authenticated;
