
DO $$ BEGIN
  CREATE TYPE public.ai_recognition_status AS ENUM (
    'pending','processing','auto_validated','pending_curation',
    'low_confidence','unidentifiable','validated_by_human'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.marcheur_medias
  ADD COLUMN IF NOT EXISTS ai_status public.ai_recognition_status DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS ai_kingdom_hint text,
  ADD COLUMN IF NOT EXISTS ai_processed_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_marcheur_medias_ai_status
  ON public.marcheur_medias(marche_event_id, ai_status)
  WHERE type_media = 'photo';

ALTER TABLE public.marche_events
  ADD COLUMN IF NOT EXISTS ai_recognition_config jsonb
    DEFAULT '{"auto_threshold": 0.85, "curation_threshold": 0.60, "plant_provider": "plantnet", "fauna_provider": "gemini", "plantnet_project": "weurope"}'::jsonb;

CREATE TABLE IF NOT EXISTS public.marcheur_photo_ai_suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  media_id uuid NOT NULL REFERENCES public.marcheur_medias(id) ON DELETE CASCADE,
  rank smallint NOT NULL CHECK (rank BETWEEN 1 AND 10),
  taxon_scientific_name text NOT NULL,
  taxon_common_name_fr text,
  kingdom text,
  confidence numeric(5,4) NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  ai_provider text NOT NULL CHECK (ai_provider IN ('plantnet','gemini','inat')),
  raw_response jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_suggestions_media
  ON public.marcheur_photo_ai_suggestions(media_id, rank);

ALTER TABLE public.marcheur_photo_ai_suggestions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ai_suggestions_admin_all" ON public.marcheur_photo_ai_suggestions;
CREATE POLICY "ai_suggestions_admin_all"
ON public.marcheur_photo_ai_suggestions
FOR ALL
USING (public.check_is_admin_user(auth.uid()))
WITH CHECK (public.check_is_admin_user(auth.uid()));

DROP POLICY IF EXISTS "ai_suggestions_owner_select" ON public.marcheur_photo_ai_suggestions;
CREATE POLICY "ai_suggestions_owner_select"
ON public.marcheur_photo_ai_suggestions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.marcheur_medias m
    WHERE m.id = marcheur_photo_ai_suggestions.media_id
      AND m.user_id = auth.uid()
  )
);
