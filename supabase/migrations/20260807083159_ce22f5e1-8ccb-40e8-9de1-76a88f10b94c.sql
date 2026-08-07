-- 1. Historique du registre de sol
CREATE TABLE IF NOT EXISTS public.propriete_soil_diagnostics_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  propriete_id uuid NOT NULL,
  snapshot jsonb NOT NULL,
  samples_count integer NOT NULL DEFAULT 0,
  changed_by uuid,
  changed_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.propriete_soil_diagnostics_history TO authenticated;
GRANT ALL ON public.propriete_soil_diagnostics_history TO service_role;

ALTER TABLE public.propriete_soil_diagnostics_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "soil history readable by property members"
ON public.propriete_soil_diagnostics_history
FOR SELECT
TO authenticated
USING (public.can_access_propriete(propriete_id));

CREATE INDEX IF NOT EXISTS idx_soil_history_propriete
  ON public.propriete_soil_diagnostics_history (propriete_id, changed_at DESC);

CREATE OR REPLACE FUNCTION public.log_propriete_soil_history()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.propriete_soil_diagnostics_history
    (propriete_id, snapshot, samples_count, changed_by)
  VALUES (
    OLD.propriete_id,
    to_jsonb(OLD),
    COALESCE(jsonb_array_length(CASE WHEN jsonb_typeof(OLD.samples) = 'array' THEN OLD.samples ELSE '[]'::jsonb END), 0),
    OLD.updated_by
  );
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_propriete_soil_history ON public.propriete_soil_diagnostics;
CREATE TRIGGER trg_propriete_soil_history
BEFORE UPDATE ON public.propriete_soil_diagnostics
FOR EACH ROW
WHEN (OLD.samples IS DISTINCT FROM NEW.samples)
EXECUTE FUNCTION public.log_propriete_soil_history();

-- 2. Garde-fou anti-destruction sur samples
CREATE OR REPLACE FUNCTION public.guard_propriete_soil_samples()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_old jsonb := CASE WHEN jsonb_typeof(OLD.samples) = 'array' THEN OLD.samples ELSE '[]'::jsonb END;
  v_new jsonb := CASE WHEN jsonb_typeof(NEW.samples) = 'array' THEN NEW.samples ELSE '[]'::jsonb END;
  v_keys text[] := ARRAY['location','lat','lng','photo_url','structure_test','structure_result',
                         'texture_test','texture_result','boudin_form','ph_test','ph_value',
                         'life_test','life_signs','worm_count'];
  v_o jsonb;
  v_n jsonb;
  v_id text;
  v_key text;
  v_found boolean;
BEGIN
  -- Échappement explicite : suppression volontaire demandée par l'interface
  IF COALESCE(current_setting('app.soil_allow_destructive', true), 'off') = 'on' THEN
    RETURN NEW;
  END IF;

  FOR v_o IN SELECT * FROM jsonb_array_elements(v_old) LOOP
    v_id := v_o->>'id';
    IF v_id IS NULL THEN CONTINUE; END IF;

    SELECT e INTO v_n
    FROM jsonb_array_elements(v_new) e
    WHERE e->>'id' = v_id
    LIMIT 1;

    v_found := v_n IS NOT NULL;

    IF NOT v_found THEN
      -- Ne bloque que si l'ancien prélèvement portait de la matière
      FOREACH v_key IN ARRAY v_keys LOOP
        IF (v_o ? v_key) AND jsonb_typeof(v_o->v_key) <> 'null'
           AND COALESCE(v_o->>v_key, '') <> '' AND COALESCE(v_o->>v_key, '') <> '[]' THEN
          RAISE EXCEPTION 'Écriture refusée : le prélèvement % contient des données et serait supprimé.', v_id
            USING HINT = 'Utilisez la suppression explicite du registre.';
        END IF;
      END LOOP;
      CONTINUE;
    END IF;

    FOREACH v_key IN ARRAY v_keys LOOP
      IF (v_o ? v_key) AND jsonb_typeof(v_o->v_key) <> 'null'
         AND COALESCE(v_o->>v_key, '') <> '' AND COALESCE(v_o->>v_key, '') <> '[]' THEN
        IF NOT (v_n ? v_key) OR jsonb_typeof(v_n->v_key) = 'null'
           OR COALESCE(v_n->>v_key, '') = '' OR COALESCE(v_n->>v_key, '') = '[]' THEN
          RAISE EXCEPTION 'Écriture refusée : la valeur « % » du prélèvement % serait effacée.', v_key, v_id
            USING HINT = 'Modification destructive bloquée (protection du registre de sol).';
        END IF;
      END IF;
    END LOOP;
  END LOOP;

  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_guard_propriete_soil_samples ON public.propriete_soil_diagnostics;
CREATE TRIGGER trg_guard_propriete_soil_samples
BEFORE UPDATE ON public.propriete_soil_diagnostics
FOR EACH ROW
WHEN (OLD.samples IS DISTINCT FROM NEW.samples)
EXECUTE FUNCTION public.guard_propriete_soil_samples();

-- 3. RPC : paramètre d'échappement pour les suppressions volontaires
CREATE OR REPLACE FUNCTION public.upsert_propriete_soil(
  p_propriete_id uuid,
  p_terrain_status text DEFAULT NULL::text,
  p_samples jsonb DEFAULT NULL::jsonb,
  p_structure text DEFAULT NULL::text,
  p_texture text DEFAULT NULL::text,
  p_boudin_shape text DEFAULT NULL::text,
  p_ph numeric DEFAULT NULL::numeric,
  p_life_signs text[] DEFAULT NULL::text[],
  p_synthesis text DEFAULT NULL::text,
  p_completed boolean DEFAULT NULL::boolean,
  p_allow_destructive boolean DEFAULT false
)
RETURNS propriete_soil_diagnostics
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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

  PERFORM set_config('app.soil_allow_destructive',
                     CASE WHEN p_allow_destructive THEN 'on' ELSE 'off' END, true);

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

  PERFORM set_config('app.soil_allow_destructive', 'off', true);

  RETURN v_row;
END $function$;