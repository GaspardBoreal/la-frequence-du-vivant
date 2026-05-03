
-- 1. Add attributed_marcheur_id columns
ALTER TABLE public.marcheur_medias
  ADD COLUMN IF NOT EXISTS attributed_marcheur_id uuid REFERENCES public.exploration_marcheurs(id) ON DELETE SET NULL;

ALTER TABLE public.marcheur_audio
  ADD COLUMN IF NOT EXISTS attributed_marcheur_id uuid REFERENCES public.exploration_marcheurs(id) ON DELETE SET NULL;

ALTER TABLE public.exploration_convivialite_photos
  ADD COLUMN IF NOT EXISTS attributed_marcheur_id uuid REFERENCES public.exploration_marcheurs(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_marcheur_medias_attributed ON public.marcheur_medias(attributed_marcheur_id);
CREATE INDEX IF NOT EXISTS idx_marcheur_audio_attributed ON public.marcheur_audio(attributed_marcheur_id);
CREATE INDEX IF NOT EXISTS idx_conv_photos_attributed ON public.exploration_convivialite_photos(attributed_marcheur_id);

-- 2. Audit log
CREATE TABLE IF NOT EXISTS public.media_attribution_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source text NOT NULL CHECK (source IN ('media','audio','conv')),
  media_id uuid NOT NULL,
  exploration_id uuid,
  previous_marcheur_id uuid,
  new_marcheur_id uuid,
  performed_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.media_attribution_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read all attribution logs"
  ON public.media_attribution_log FOR SELECT
  USING (public.is_admin_user());

CREATE POLICY "Performer reads own attribution logs"
  ON public.media_attribution_log FOR SELECT
  USING (auth.uid() = performed_by);

-- 3. RPC reattribute_media
CREATE OR REPLACE FUNCTION public.reattribute_media(
  _source text,
  _media_id uuid,
  _marcheur_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _uid uuid := auth.uid();
  _exploration_id uuid;
  _previous uuid;
  _marcheur_exploration uuid;
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '42501';
  END IF;
  IF _source NOT IN ('media','audio','conv') THEN
    RAISE EXCEPTION 'Invalid source: %', _source USING ERRCODE = '22023';
  END IF;

  -- Resolve current state and parent exploration
  IF _source = 'media' THEN
    SELECT mm.attributed_marcheur_id, e.id
      INTO _previous, _exploration_id
    FROM public.marcheur_medias mm
    JOIN public.marche_events me ON me.id = mm.marche_event_id
    JOIN public.explorations e ON e.id = me.exploration_id
    WHERE mm.id = _media_id;
  ELSIF _source = 'audio' THEN
    SELECT ma.attributed_marcheur_id, e.id
      INTO _previous, _exploration_id
    FROM public.marcheur_audio ma
    JOIN public.marche_events me ON me.id = ma.marche_event_id
    JOIN public.explorations e ON e.id = me.exploration_id
    WHERE ma.id = _media_id;
  ELSE
    SELECT cp.attributed_marcheur_id, cp.exploration_id
      INTO _previous, _exploration_id
    FROM public.exploration_convivialite_photos cp
    WHERE cp.id = _media_id;
  END IF;

  IF _exploration_id IS NULL THEN
    RAISE EXCEPTION 'Media not found' USING ERRCODE = 'P0002';
  END IF;

  -- Check curator permission (admin / ambassadeur / sentinelle)
  IF NOT public.is_exploration_curator(_uid) THEN
    RAISE EXCEPTION 'Not authorized to reattribute media' USING ERRCODE = '42501';
  END IF;

  -- If clearing attribution, allow null
  IF _marcheur_id IS NOT NULL THEN
    SELECT em.exploration_id INTO _marcheur_exploration
    FROM public.exploration_marcheurs em
    WHERE em.id = _marcheur_id;

    IF _marcheur_exploration IS NULL THEN
      RAISE EXCEPTION 'Marcheur not found' USING ERRCODE = 'P0002';
    END IF;
    IF _marcheur_exploration <> _exploration_id THEN
      RAISE EXCEPTION 'Marcheur does not belong to this exploration' USING ERRCODE = '22023';
    END IF;
  END IF;

  -- Apply update
  IF _source = 'media' THEN
    UPDATE public.marcheur_medias
       SET attributed_marcheur_id = _marcheur_id, updated_at = now()
     WHERE id = _media_id;
  ELSIF _source = 'audio' THEN
    UPDATE public.marcheur_audio
       SET attributed_marcheur_id = _marcheur_id, updated_at = now()
     WHERE id = _media_id;
  ELSE
    UPDATE public.exploration_convivialite_photos
       SET attributed_marcheur_id = _marcheur_id, updated_at = now()
     WHERE id = _media_id;
  END IF;

  -- Audit
  INSERT INTO public.media_attribution_log
    (source, media_id, exploration_id, previous_marcheur_id, new_marcheur_id, performed_by)
  VALUES
    (_source, _media_id, _exploration_id, _previous, _marcheur_id, _uid);

  RETURN jsonb_build_object(
    'source', _source,
    'media_id', _media_id,
    'exploration_id', _exploration_id,
    'previous_marcheur_id', _previous,
    'new_marcheur_id', _marcheur_id
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.reattribute_media(text, uuid, uuid) TO authenticated;
