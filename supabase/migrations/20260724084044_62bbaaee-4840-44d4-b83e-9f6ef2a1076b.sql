
CREATE TABLE public.propriete_soil_diagnostics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  propriete_id uuid NOT NULL REFERENCES public.proprietes(id) ON DELETE CASCADE UNIQUE,
  terrain_status text,
  samples jsonb NOT NULL DEFAULT '[]'::jsonb,
  structure text,
  texture text,
  boudin_shape text,
  ph numeric(3,1),
  life_signs text[] NOT NULL DEFAULT ARRAY[]::text[],
  synthesis text,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.propriete_soil_diagnostics TO authenticated;
GRANT ALL ON public.propriete_soil_diagnostics TO service_role;

ALTER TABLE public.propriete_soil_diagnostics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "soil_read" ON public.propriete_soil_diagnostics
FOR SELECT TO authenticated
USING (
  public.check_is_admin_user(auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.proprietes p
    LEFT JOIN public.community_profiles cp ON cp.id = p.main_walker_id
    WHERE p.id = propriete_soil_diagnostics.propriete_id AND cp.user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public.propriete_marcheurs pm
    JOIN public.community_profiles cp ON cp.id = pm.community_profile_id
    WHERE pm.propriete_id = propriete_soil_diagnostics.propriete_id AND cp.user_id = auth.uid()
  )
);

CREATE POLICY "soil_write" ON public.propriete_soil_diagnostics
FOR ALL TO authenticated
USING (
  public.check_is_admin_user(auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.proprietes p
    LEFT JOIN public.community_profiles cp ON cp.id = p.main_walker_id
    WHERE p.id = propriete_soil_diagnostics.propriete_id AND cp.user_id = auth.uid()
  )
)
WITH CHECK (
  public.check_is_admin_user(auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.proprietes p
    LEFT JOIN public.community_profiles cp ON cp.id = p.main_walker_id
    WHERE p.id = propriete_soil_diagnostics.propriete_id AND cp.user_id = auth.uid()
  )
);

CREATE OR REPLACE FUNCTION public.tg_soil_touch()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.updated_at := now();
  NEW.updated_by := auth.uid();
  RETURN NEW;
END $$;

CREATE TRIGGER trg_soil_updated
BEFORE UPDATE ON public.propriete_soil_diagnostics
FOR EACH ROW EXECUTE FUNCTION public.tg_soil_touch();

CREATE OR REPLACE FUNCTION public.upsert_propriete_soil(
  p_propriete_id uuid,
  p_terrain_status text DEFAULT NULL,
  p_samples jsonb DEFAULT NULL,
  p_structure text DEFAULT NULL,
  p_texture text DEFAULT NULL,
  p_boudin_shape text DEFAULT NULL,
  p_ph numeric DEFAULT NULL,
  p_life_signs text[] DEFAULT NULL,
  p_synthesis text DEFAULT NULL,
  p_completed boolean DEFAULT NULL
) RETURNS public.propriete_soil_diagnostics
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_row public.propriete_soil_diagnostics;
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

  INSERT INTO public.propriete_soil_diagnostics AS s (propriete_id, updated_by)
  VALUES (p_propriete_id, v_uid)
  ON CONFLICT (propriete_id) DO NOTHING;

  UPDATE public.propriete_soil_diagnostics
  SET
    terrain_status = COALESCE(p_terrain_status, terrain_status),
    samples        = COALESCE(p_samples, samples),
    structure      = COALESCE(p_structure, structure),
    texture        = COALESCE(p_texture, texture),
    boudin_shape   = COALESCE(p_boudin_shape, boudin_shape),
    ph             = COALESCE(p_ph, ph),
    life_signs     = COALESCE(p_life_signs, life_signs),
    synthesis      = COALESCE(p_synthesis, synthesis),
    completed_at   = CASE
      WHEN p_completed IS TRUE THEN COALESCE(completed_at, now())
      WHEN p_completed IS FALSE THEN NULL
      ELSE completed_at
    END,
    updated_by     = v_uid
  WHERE propriete_id = p_propriete_id
  RETURNING * INTO v_row;

  RETURN v_row;
END $$;

GRANT EXECUTE ON FUNCTION public.upsert_propriete_soil(uuid, text, jsonb, text, text, text, numeric, text[], text, boolean) TO authenticated;
