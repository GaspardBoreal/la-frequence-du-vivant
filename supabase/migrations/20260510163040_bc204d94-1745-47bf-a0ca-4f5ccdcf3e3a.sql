
-- 1. pg_net extension (idempotent)
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- 2. Backfill log table
CREATE TABLE IF NOT EXISTS public.marcheur_backfill_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  exploration_id uuid,
  marche_event_id uuid,
  source text NOT NULL, -- 'trigger_participation' | 'trigger_science_account' | 'manual' | 'trigger_exploration_marche'
  observations_inserted integer DEFAULT 0,
  marches_scanned integer DEFAULT 0,
  status text NOT NULL DEFAULT 'pending', -- 'pending' | 'success' | 'no_account' | 'error'
  error text,
  detail jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);
CREATE INDEX IF NOT EXISTS idx_mbl_user ON public.marcheur_backfill_log(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_mbl_exploration ON public.marcheur_backfill_log(exploration_id, created_at DESC);

ALTER TABLE public.marcheur_backfill_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "backfill log readable by curators" ON public.marcheur_backfill_log;
CREATE POLICY "backfill log readable by curators"
  ON public.marcheur_backfill_log FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'::public.crm_role)
    OR EXISTS (SELECT 1 FROM public.community_profiles WHERE user_id = auth.uid() AND role IN ('ambassadeur','sentinelle'))
    OR user_id = auth.uid()
  );

DROP POLICY IF EXISTS "backfill log insert by admin or definer" ON public.marcheur_backfill_log;
CREATE POLICY "backfill log insert by admin or definer"
  ON public.marcheur_backfill_log FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'::public.crm_role)
  );

-- 3. Ensure crew row in exploration_marcheurs
CREATE OR REPLACE FUNCTION public.ensure_exploration_marcheur(
  p_user_id uuid,
  p_exploration_id uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_crew_id uuid;
  v_prenom text;
  v_nom text;
  v_avatar text;
BEGIN
  IF p_user_id IS NULL OR p_exploration_id IS NULL THEN RETURN NULL; END IF;

  SELECT id INTO v_crew_id
    FROM public.exploration_marcheurs
   WHERE exploration_id = p_exploration_id AND user_id = p_user_id
   LIMIT 1;

  IF v_crew_id IS NOT NULL THEN
    RETURN v_crew_id;
  END IF;

  SELECT prenom, nom, avatar_url
    INTO v_prenom, v_nom, v_avatar
    FROM public.community_profiles
   WHERE user_id = p_user_id
   LIMIT 1;

  INSERT INTO public.exploration_marcheurs (
    exploration_id, user_id, prenom, nom, role, avatar_url, couleur, ordre
  ) VALUES (
    p_exploration_id, p_user_id,
    COALESCE(NULLIF(v_prenom, ''), 'Marcheur'),
    COALESCE(v_nom, ''),
    'marcheur', v_avatar, '#10b981', 9999
  )
  RETURNING id INTO v_crew_id;

  RETURN v_crew_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.ensure_exploration_marcheur(uuid, uuid) TO authenticated, service_role;

-- 4. Trigger handler on marche_participations
CREATE OR REPLACE FUNCTION public.handle_participation_backfill()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_exploration_id uuid;
BEGIN
  SELECT exploration_id INTO v_exploration_id
    FROM public.marche_events
   WHERE id = NEW.marche_event_id;

  IF v_exploration_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Always ensure crew row
  PERFORM public.ensure_exploration_marcheur(NEW.user_id, v_exploration_id);

  -- Async backfill request via separate function (with hardcoded URL/key)
  BEGIN
    PERFORM public.request_inaturalist_backfill(NEW.user_id, v_exploration_id, NEW.marche_event_id, 'trigger_participation');
  EXCEPTION WHEN OTHERS THEN
    -- Never block the participation insert
    NULL;
  END;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_participation_backfill_marcheur ON public.marche_participations;
CREATE TRIGGER trg_participation_backfill_marcheur
  AFTER INSERT ON public.marche_participations
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_participation_backfill();

-- 5. Trigger on science account creation
CREATE OR REPLACE FUNCTION public.handle_science_account_backfill()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id uuid;
  v_expl record;
BEGIN
  IF NEW.network <> 'inaturalist' THEN RETURN NEW; END IF;

  SELECT user_id INTO v_user_id FROM public.community_profiles WHERE id = NEW.profile_id;
  IF v_user_id IS NULL THEN RETURN NEW; END IF;

  FOR v_expl IN
    SELECT DISTINCT me.exploration_id
      FROM public.marche_participations mp
      JOIN public.marche_events me ON me.id = mp.marche_event_id
     WHERE mp.user_id = v_user_id AND me.exploration_id IS NOT NULL
  LOOP
    PERFORM public.ensure_exploration_marcheur(v_user_id, v_expl.exploration_id);
    BEGIN
      PERFORM public.request_inaturalist_backfill(v_user_id, v_expl.exploration_id, NULL, 'trigger_science_account');
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
  END LOOP;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_science_account_backfill ON public.community_profile_science_accounts;
CREATE TRIGGER trg_science_account_backfill
  AFTER INSERT ON public.community_profile_science_accounts
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_science_account_backfill();

-- 6. Stub for request_inaturalist_backfill (real body created via insert tool with project URL/key)
CREATE OR REPLACE FUNCTION public.request_inaturalist_backfill(
  p_user_id uuid,
  p_exploration_id uuid,
  p_marche_event_id uuid,
  p_source text
)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $$
BEGIN
  -- Replaced by post-migration insert tool with real URL + anon key
  RETURN NULL;
END;
$$;

GRANT EXECUTE ON FUNCTION public.request_inaturalist_backfill(uuid, uuid, uuid, text) TO authenticated, service_role;
