-- 1. Extend exploration_curations with AI metadata
ALTER TABLE public.exploration_curations
  ADD COLUMN IF NOT EXISTS ai_score integer,
  ADD COLUMN IF NOT EXISTS ai_reason text,
  ADD COLUMN IF NOT EXISTS ai_criteria jsonb,
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'manual';

ALTER TABLE public.exploration_curations
  DROP CONSTRAINT IF EXISTS exploration_curations_source_check;
ALTER TABLE public.exploration_curations
  ADD CONSTRAINT exploration_curations_source_check
  CHECK (source IN ('manual','ai','gbif_pool'));

ALTER TABLE public.exploration_curations
  DROP CONSTRAINT IF EXISTS exploration_curations_ai_score_check;
ALTER TABLE public.exploration_curations
  ADD CONSTRAINT exploration_curations_ai_score_check
  CHECK (ai_score IS NULL OR (ai_score >= 0 AND ai_score <= 100));

-- 2. Curator helper (community_profiles.role OR admin)
CREATE OR REPLACE FUNCTION public.is_exploration_curator(_user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT
    public.check_is_admin_user(_user_id)
    OR EXISTS (
      SELECT 1 FROM public.community_profiles
      WHERE user_id = _user_id
        AND role IN ('ambassadeur','sentinelle')
    );
$$;

-- 3. Manual species table (terrain entries)
CREATE TABLE IF NOT EXISTS public.exploration_manual_species (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exploration_id uuid NOT NULL REFERENCES public.explorations(id) ON DELETE CASCADE,
  marche_event_id uuid REFERENCES public.marche_events(id) ON DELETE SET NULL,
  scientific_name text,
  common_name text NOT NULL,
  gbif_taxon_key bigint,
  group_taxon text,
  photo_url text NOT NULL,
  photo_lat numeric,
  photo_lng numeric,
  observed_at timestamptz NOT NULL DEFAULT now(),
  observer_name text,
  comment text,
  source_mode text NOT NULL DEFAULT 'free' CHECK (source_mode IN ('gbif','free')),
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_manual_species_exploration ON public.exploration_manual_species(exploration_id);
CREATE INDEX IF NOT EXISTS idx_manual_species_marche ON public.exploration_manual_species(marche_event_id);

ALTER TABLE public.exploration_manual_species ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Manual species readable" ON public.exploration_manual_species;
CREATE POLICY "Manual species readable"
ON public.exploration_manual_species FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.explorations e
    WHERE e.id = exploration_id AND e.published = true
  )
  OR public.is_exploration_curator(auth.uid())
);

DROP POLICY IF EXISTS "Curators insert manual species" ON public.exploration_manual_species;
CREATE POLICY "Curators insert manual species"
ON public.exploration_manual_species FOR INSERT
WITH CHECK (public.is_exploration_curator(auth.uid()) AND created_by = auth.uid());

DROP POLICY IF EXISTS "Curators update manual species" ON public.exploration_manual_species;
CREATE POLICY "Curators update manual species"
ON public.exploration_manual_species FOR UPDATE
USING (public.is_exploration_curator(auth.uid()));

DROP POLICY IF EXISTS "Curators delete manual species" ON public.exploration_manual_species;
CREATE POLICY "Curators delete manual species"
ON public.exploration_manual_species FOR DELETE
USING (public.is_exploration_curator(auth.uid()));

DROP TRIGGER IF EXISTS trg_manual_species_updated_at ON public.exploration_manual_species;
CREATE TRIGGER trg_manual_species_updated_at
BEFORE UPDATE ON public.exploration_manual_species
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. AI analyses cache
CREATE TABLE IF NOT EXISTS public.exploration_ai_analyses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exploration_id uuid NOT NULL REFERENCES public.explorations(id) ON DELETE CASCADE,
  analyzed_at timestamptz NOT NULL DEFAULT now(),
  model text NOT NULL,
  species_analyzed_count integer NOT NULL DEFAULT 0,
  summary jsonb,
  created_by uuid
);

CREATE INDEX IF NOT EXISTS idx_ai_analyses_exploration ON public.exploration_ai_analyses(exploration_id, analyzed_at DESC);

ALTER TABLE public.exploration_ai_analyses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "AI analyses readable by curators" ON public.exploration_ai_analyses;
CREATE POLICY "AI analyses readable by curators"
ON public.exploration_ai_analyses FOR SELECT
USING (public.is_exploration_curator(auth.uid()));

DROP POLICY IF EXISTS "AI analyses insert by curators" ON public.exploration_ai_analyses;
CREATE POLICY "AI analyses insert by curators"
ON public.exploration_ai_analyses FOR INSERT
WITH CHECK (public.is_exploration_curator(auth.uid()));

-- 5. Storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('manual-species-photos', 'manual-species-photos', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Manual species photos readable" ON storage.objects;
CREATE POLICY "Manual species photos readable"
ON storage.objects FOR SELECT
USING (bucket_id = 'manual-species-photos');

DROP POLICY IF EXISTS "Curators upload species photos" ON storage.objects;
CREATE POLICY "Curators upload species photos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'manual-species-photos' AND public.is_exploration_curator(auth.uid()));

DROP POLICY IF EXISTS "Curators update species photos" ON storage.objects;
CREATE POLICY "Curators update species photos"
ON storage.objects FOR UPDATE
USING (bucket_id = 'manual-species-photos' AND public.is_exploration_curator(auth.uid()));

DROP POLICY IF EXISTS "Curators delete species photos" ON storage.objects;
CREATE POLICY "Curators delete species photos"
ON storage.objects FOR DELETE
USING (bucket_id = 'manual-species-photos' AND public.is_exploration_curator(auth.uid()));