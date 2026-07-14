
-- Anon read access to public walker medias on public events
CREATE POLICY "Public can view public medias on public events"
ON public.marcheur_medias
FOR SELECT
TO anon
USING (
  is_public = true
  AND EXISTS (
    SELECT 1 FROM public.marche_events me
    WHERE me.id = marcheur_medias.marche_event_id
      AND me.is_public = true
  )
);

GRANT SELECT ON public.marcheur_medias TO anon;

-- Anon read access to convivialite photos on public explorations
CREATE POLICY "Public can view convivialite on public explorations"
ON public.exploration_convivialite_photos
FOR SELECT
TO anon
USING (
  is_hidden = false
  AND EXISTS (
    SELECT 1
    FROM public.marche_events me
    WHERE me.exploration_id = exploration_convivialite_photos.exploration_id
      AND me.is_public = true
  )
);

GRANT SELECT ON public.exploration_convivialite_photos TO anon;
