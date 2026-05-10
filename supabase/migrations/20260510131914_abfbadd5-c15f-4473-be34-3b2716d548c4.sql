DO $$ BEGIN
  CREATE TYPE public.science_network AS ENUM ('inaturalist','ebird','gbif','plantnet','faune_france','other');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.community_profile_science_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.community_profiles(id) ON DELETE CASCADE,
  network public.science_network NOT NULL,
  username text NOT NULL,
  display_name text,
  profile_url text,
  external_id text,
  verified boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (profile_id, network, username)
);

CREATE INDEX IF NOT EXISTS idx_cpsa_profile ON public.community_profile_science_accounts(profile_id);
CREATE INDEX IF NOT EXISTS idx_cpsa_network ON public.community_profile_science_accounts(network);

ALTER TABLE public.community_profile_science_accounts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "science accounts readable by all" ON public.community_profile_science_accounts;
CREATE POLICY "science accounts readable by all"
ON public.community_profile_science_accounts FOR SELECT USING (true);

DROP POLICY IF EXISTS "science accounts insert own or admin" ON public.community_profile_science_accounts;
CREATE POLICY "science accounts insert own or admin"
ON public.community_profile_science_accounts FOR INSERT
WITH CHECK (
  EXISTS (SELECT 1 FROM public.community_profiles cp WHERE cp.id = profile_id AND cp.user_id = auth.uid())
  OR public.is_admin_user()
);

DROP POLICY IF EXISTS "science accounts update own or admin" ON public.community_profile_science_accounts;
CREATE POLICY "science accounts update own or admin"
ON public.community_profile_science_accounts FOR UPDATE
USING (
  EXISTS (SELECT 1 FROM public.community_profiles cp WHERE cp.id = profile_id AND cp.user_id = auth.uid())
  OR public.is_admin_user()
);

DROP POLICY IF EXISTS "science accounts delete own or admin" ON public.community_profile_science_accounts;
CREATE POLICY "science accounts delete own or admin"
ON public.community_profile_science_accounts FOR DELETE
USING (
  EXISTS (SELECT 1 FROM public.community_profiles cp WHERE cp.id = profile_id AND cp.user_id = auth.uid())
  OR public.is_admin_user()
);

DROP TRIGGER IF EXISTS trg_cpsa_updated_at ON public.community_profile_science_accounts;
CREATE TRIGGER trg_cpsa_updated_at
BEFORE UPDATE ON public.community_profile_science_accounts
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();