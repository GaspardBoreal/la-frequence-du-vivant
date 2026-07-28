CREATE TABLE public.propriete_synthesis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  propriete_id uuid NOT NULL UNIQUE REFERENCES public.proprietes(id) ON DELETE CASCADE,
  exposure text,
  wind_level text,
  humidity text,
  atouts jsonb NOT NULL DEFAULT '[]'::jsonb,
  contraintes jsonb NOT NULL DEFAULT '[]'::jsonb,
  vigilances jsonb NOT NULL DEFAULT '[]'::jsonb,
  portrait text,
  notes text,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.propriete_synthesis TO authenticated;
GRANT ALL ON public.propriete_synthesis TO service_role;

ALTER TABLE public.propriete_synthesis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Propriete members can read synthesis"
  ON public.propriete_synthesis FOR SELECT TO authenticated
  USING (public.can_access_propriete(propriete_id));

CREATE POLICY "Propriete members can write synthesis"
  ON public.propriete_synthesis FOR ALL TO authenticated
  USING (public.can_access_propriete(propriete_id))
  WITH CHECK (public.can_access_propriete(propriete_id));

CREATE TRIGGER trg_propriete_synthesis_updated_at
  BEFORE UPDATE ON public.propriete_synthesis
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.upsert_propriete_synthesis(
  p_propriete_id uuid,
  p_exposure text DEFAULT NULL,
  p_wind_level text DEFAULT NULL,
  p_humidity text DEFAULT NULL,
  p_atouts jsonb DEFAULT NULL,
  p_contraintes jsonb DEFAULT NULL,
  p_vigilances jsonb DEFAULT NULL,
  p_portrait text DEFAULT NULL,
  p_notes text DEFAULT NULL,
  p_completed boolean DEFAULT NULL
)
RETURNS public.propriete_synthesis
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_row public.propriete_synthesis;
  v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'auth required'; END IF;
  IF NOT public.can_access_propriete(p_propriete_id) THEN RAISE EXCEPTION 'forbidden'; END IF;

  INSERT INTO public.propriete_synthesis (propriete_id, updated_by)
  VALUES (p_propriete_id, v_uid)
  ON CONFLICT (propriete_id) DO NOTHING;

  UPDATE public.propriete_synthesis
  SET
    exposure     = COALESCE(p_exposure, exposure),
    wind_level   = COALESCE(p_wind_level, wind_level),
    humidity     = COALESCE(p_humidity, humidity),
    atouts       = COALESCE(p_atouts, atouts),
    contraintes  = COALESCE(p_contraintes, contraintes),
    vigilances   = COALESCE(p_vigilances, vigilances),
    portrait     = COALESCE(p_portrait, portrait),
    notes        = COALESCE(p_notes, notes),
    completed_at = CASE
      WHEN p_completed IS TRUE THEN COALESCE(completed_at, now())
      WHEN p_completed IS FALSE THEN NULL
      ELSE completed_at
    END,
    updated_by   = v_uid
  WHERE propriete_id = p_propriete_id
  RETURNING * INTO v_row;

  RETURN v_row;
END $function$;

GRANT EXECUTE ON FUNCTION public.upsert_propriete_synthesis(uuid, text, text, text, jsonb, jsonb, jsonb, text, text, boolean) TO authenticated;