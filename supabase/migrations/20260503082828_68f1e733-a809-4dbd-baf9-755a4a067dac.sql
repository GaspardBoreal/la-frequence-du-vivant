-- 1. Helper function: can the user curate audio descriptions?
CREATE OR REPLACE FUNCTION public.can_curate_audio(_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _role text;
BEGIN
  IF _user_id IS NULL THEN RETURN false; END IF;
  IF public.check_is_admin_user(_user_id) THEN RETURN true; END IF;

  SELECT role INTO _role
  FROM public.community_profiles
  WHERE user_id = _user_id
  LIMIT 1;

  RETURN _role IN ('ambassadeur', 'sentinelle');
END;
$$;

-- 2. RLS policy: curators can update audio
DROP POLICY IF EXISTS "Curators can update audio descriptions" ON public.marcheur_audio;
CREATE POLICY "Curators can update audio descriptions"
ON public.marcheur_audio
FOR UPDATE
TO authenticated
USING (public.can_curate_audio(auth.uid()))
WITH CHECK (public.can_curate_audio(auth.uid()));

-- 3. Trigger garde-fou: a non-owner curator can only change titre/description
CREATE OR REPLACE FUNCTION public.guard_marcheur_audio_curator_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _caller uuid := auth.uid();
  _is_admin boolean;
BEGIN
  IF _caller IS NULL THEN RETURN NEW; END IF;
  IF NEW.user_id = _caller THEN RETURN NEW; END IF; -- owner: no restriction
  _is_admin := public.check_is_admin_user(_caller);
  IF _is_admin THEN RETURN NEW; END IF; -- admins: no restriction

  -- non-owner curator: forbid changes outside titre/description
  IF NEW.url_fichier IS DISTINCT FROM OLD.url_fichier
     OR NEW.is_public IS DISTINCT FROM OLD.is_public
     OR NEW.marche_event_id IS DISTINCT FROM OLD.marche_event_id
     OR NEW.marche_id IS DISTINCT FROM OLD.marche_id
     OR NEW.user_id IS DISTINCT FROM OLD.user_id
     OR NEW.attributed_marcheur_id IS DISTINCT FROM OLD.attributed_marcheur_id
     OR NEW.taille_octets IS DISTINCT FROM OLD.taille_octets
     OR NEW.duree_secondes IS DISTINCT FROM OLD.duree_secondes
  THEN
    RAISE EXCEPTION 'Curators can only edit titre and description fields.';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_marcheur_audio_curator ON public.marcheur_audio;
CREATE TRIGGER trg_guard_marcheur_audio_curator
BEFORE UPDATE ON public.marcheur_audio
FOR EACH ROW
EXECUTE FUNCTION public.guard_marcheur_audio_curator_update();