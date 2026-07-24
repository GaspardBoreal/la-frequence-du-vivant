CREATE TABLE public.propriete_observations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  propriete_id uuid NOT NULL REFERENCES public.proprietes(id) ON DELETE CASCADE,
  answers jsonb NOT NULL DEFAULT '{}'::jsonb,
  sensorial jsonb NOT NULL DEFAULT '{}'::jsonb,
  notes text,
  completed_at timestamptz,
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(propriete_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.propriete_observations TO authenticated;
GRANT ALL ON public.propriete_observations TO service_role;

ALTER TABLE public.propriete_observations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "obs_read" ON public.propriete_observations
FOR SELECT TO authenticated
USING (
  public.check_is_admin_user(auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.proprietes p
    LEFT JOIN public.community_profiles cp ON cp.id = p.main_walker_id
    WHERE p.id = propriete_observations.propriete_id AND cp.user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public.propriete_marcheurs pm
    JOIN public.community_profiles cp ON cp.id = pm.community_profile_id
    WHERE pm.propriete_id = propriete_observations.propriete_id AND cp.user_id = auth.uid()
  )
);

CREATE POLICY "obs_write" ON public.propriete_observations
FOR ALL TO authenticated
USING (
  public.check_is_admin_user(auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.proprietes p
    LEFT JOIN public.community_profiles cp ON cp.id = p.main_walker_id
    WHERE p.id = propriete_observations.propriete_id AND cp.user_id = auth.uid()
  )
)
WITH CHECK (
  public.check_is_admin_user(auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.proprietes p
    LEFT JOIN public.community_profiles cp ON cp.id = p.main_walker_id
    WHERE p.id = propriete_observations.propriete_id AND cp.user_id = auth.uid()
  )
);

CREATE TRIGGER trg_obs_updated
BEFORE UPDATE ON public.propriete_observations
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.upsert_propriete_observation(
  p_propriete_id uuid,
  p_answers jsonb DEFAULT NULL,
  p_sensorial jsonb DEFAULT NULL,
  p_notes text DEFAULT NULL,
  p_completed boolean DEFAULT false
) RETURNS public.propriete_observations
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.propriete_observations;
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
  ) INTO v_allowed;

  IF NOT v_allowed THEN RAISE EXCEPTION 'forbidden'; END IF;

  INSERT INTO public.propriete_observations AS o
    (propriete_id, answers, sensorial, notes, completed_at, updated_by)
  VALUES (
    p_propriete_id,
    COALESCE(p_answers, '{}'::jsonb),
    COALESCE(p_sensorial, '{}'::jsonb),
    p_notes,
    CASE WHEN p_completed THEN now() ELSE NULL END,
    v_uid
  )
  ON CONFLICT (propriete_id) DO UPDATE
    SET answers      = COALESCE(EXCLUDED.answers, o.answers),
        sensorial    = COALESCE(EXCLUDED.sensorial, o.sensorial),
        notes        = COALESCE(EXCLUDED.notes, o.notes),
        completed_at = CASE WHEN p_completed THEN now() ELSE o.completed_at END,
        updated_by   = v_uid,
        updated_at   = now()
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;

GRANT EXECUTE ON FUNCTION public.upsert_propriete_observation(uuid, jsonb, jsonb, text, boolean) TO authenticated;