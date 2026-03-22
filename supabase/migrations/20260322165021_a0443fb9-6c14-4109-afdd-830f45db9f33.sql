
-- Enum for community roles
CREATE TYPE public.community_role AS ENUM (
  'marcheur_en_devenir',
  'marcheur',
  'eclaireur',
  'ambassadeur',
  'sentinelle'
);

-- Table community_profiles
CREATE TABLE public.community_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  prenom TEXT NOT NULL,
  nom TEXT NOT NULL,
  ville TEXT,
  telephone TEXT,
  date_naissance DATE,
  motivation TEXT,
  avatar_url TEXT,
  role community_role NOT NULL DEFAULT 'marcheur_en_devenir',
  marches_count INTEGER NOT NULL DEFAULT 0,
  formation_validee BOOLEAN NOT NULL DEFAULT false,
  certification_validee BOOLEAN NOT NULL DEFAULT false,
  kigo_accueil TEXT,
  superpouvoir_sensoriel TEXT,
  niveau_intimite_vivant TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table marche_events
CREATE TABLE public.marche_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  date_marche TIMESTAMPTZ NOT NULL,
  lieu TEXT,
  latitude DECIMAL,
  longitude DECIMAL,
  qr_code TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_uuid()::text::bytea, 'hex'),
  max_participants INTEGER,
  exploration_id UUID REFERENCES public.explorations(id) ON DELETE SET NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table marche_participations
CREATE TABLE public.marche_participations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  marche_event_id UUID REFERENCES public.marche_events(id) ON DELETE CASCADE NOT NULL,
  validated_at TIMESTAMPTZ,
  validation_method TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, marche_event_id)
);

-- Updated_at triggers
CREATE TRIGGER update_community_profiles_updated_at
  BEFORE UPDATE ON public.community_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_marche_events_updated_at
  BEFORE UPDATE ON public.marche_events
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger: auto-update role on participation validation
CREATE OR REPLACE FUNCTION public.update_community_role_on_participation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  validated_count INTEGER;
  current_formation BOOLEAN;
  current_certification BOOLEAN;
  new_role community_role;
BEGIN
  -- Only trigger when validated_at goes from NULL to a value
  IF NEW.validated_at IS NOT NULL AND (OLD.validated_at IS NULL OR TG_OP = 'INSERT') THEN
    -- Count validated participations for this user
    SELECT COUNT(*) INTO validated_count
    FROM marche_participations
    WHERE user_id = NEW.user_id AND validated_at IS NOT NULL;

    -- Get current profile flags
    SELECT formation_validee, certification_validee
    INTO current_formation, current_certification
    FROM community_profiles
    WHERE user_id = NEW.user_id;

    -- Determine new role based on thresholds
    IF validated_count >= 20 AND current_certification THEN
      new_role := 'sentinelle';
    ELSIF validated_count >= 10 AND current_formation THEN
      new_role := 'ambassadeur';
    ELSIF validated_count >= 5 THEN
      new_role := 'eclaireur';
    ELSIF validated_count >= 1 THEN
      new_role := 'marcheur';
    ELSE
      new_role := 'marcheur_en_devenir';
    END IF;

    -- Update profile
    UPDATE community_profiles
    SET role = new_role, marches_count = validated_count, updated_at = now()
    WHERE user_id = NEW.user_id;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_update_role_on_participation
  AFTER INSERT OR UPDATE ON public.marche_participations
  FOR EACH ROW EXECUTE FUNCTION public.update_community_role_on_participation();

-- RLS
ALTER TABLE public.community_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marche_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marche_participations ENABLE ROW LEVEL SECURITY;

-- community_profiles: users read/update own, admins read all
CREATE POLICY "Users can read own profile"
  ON public.community_profiles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR public.check_is_admin_user(auth.uid()));

CREATE POLICY "Users can update own profile"
  ON public.community_profiles FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can insert own profile"
  ON public.community_profiles FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- marche_events: public read, admin write
CREATE POLICY "Anyone can read marche events"
  ON public.marche_events FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert marche events"
  ON public.marche_events FOR INSERT
  TO authenticated
  WITH CHECK (public.check_is_admin_user(auth.uid()));

CREATE POLICY "Admins can update marche events"
  ON public.marche_events FOR UPDATE
  TO authenticated
  USING (public.check_is_admin_user(auth.uid()));

CREATE POLICY "Admins can delete marche events"
  ON public.marche_events FOR DELETE
  TO authenticated
  USING (public.check_is_admin_user(auth.uid()));

-- marche_participations: users read own, admins read all
CREATE POLICY "Users can read own participations"
  ON public.marche_participations FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR public.check_is_admin_user(auth.uid()));

CREATE POLICY "Users can insert own participation"
  ON public.marche_participations FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can update participations"
  ON public.marche_participations FOR UPDATE
  TO authenticated
  USING (public.check_is_admin_user(auth.uid()));
