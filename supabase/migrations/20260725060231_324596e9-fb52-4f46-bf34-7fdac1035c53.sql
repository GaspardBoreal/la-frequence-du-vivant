
-- ============================================================
-- Table : propriete_gallery_photos
-- ============================================================
CREATE TABLE IF NOT EXISTS public.propriete_gallery_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  propriete_id UUID NOT NULL REFERENCES public.proprietes(id) ON DELETE CASCADE,
  source_table TEXT NOT NULL,
  source_id TEXT NOT NULL,
  url TEXT NOT NULL,
  author_name TEXT,
  photo_date TIMESTAMPTZ,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  caption TEXT,
  order_index INT NOT NULL DEFAULT 0,
  curated_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (propriete_id, source_table, source_id)
);

CREATE INDEX IF NOT EXISTS idx_propriete_gallery_prop_order
  ON public.propriete_gallery_photos(propriete_id, order_index);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.propriete_gallery_photos TO authenticated;
GRANT ALL ON public.propriete_gallery_photos TO service_role;

ALTER TABLE public.propriete_gallery_photos ENABLE ROW LEVEL SECURITY;

-- Lecture : toute personne rattachée à la propriété peut voir
DROP POLICY IF EXISTS "gallery_select_linked" ON public.propriete_gallery_photos;
CREATE POLICY "gallery_select_linked"
  ON public.propriete_gallery_photos FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.propriete_marcheurs pm
      JOIN public.community_profiles cp ON cp.id = pm.community_profile_id
      WHERE pm.propriete_id = propriete_gallery_photos.propriete_id
        AND cp.user_id = auth.uid()
    )
    OR public.check_is_admin_user(auth.uid())
  );

-- Écriture : réservée aux services SECURITY DEFINER (RPC set_propriete_gallery)
DROP POLICY IF EXISTS "gallery_write_service_only" ON public.propriete_gallery_photos;
CREATE POLICY "gallery_write_service_only"
  ON public.propriete_gallery_photos FOR ALL
  TO authenticated
  USING (public.check_is_admin_user(auth.uid()))
  WITH CHECK (public.check_is_admin_user(auth.uid()));

-- ============================================================
-- RPC : can_curate_propriete_gallery
-- ============================================================
CREATE OR REPLACE FUNCTION public.can_curate_propriete_gallery(_propriete_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    public.check_is_admin_user(auth.uid())
    OR EXISTS (
      SELECT 1
      FROM public.propriete_marcheurs pm
      JOIN public.community_profiles cp ON cp.id = pm.community_profile_id
      WHERE pm.propriete_id = _propriete_id
        AND cp.user_id = auth.uid()
        AND pm.role IN ('proprietaire'::public.role_propriete, 'prestataire'::public.role_propriete)
    );
$$;

GRANT EXECUTE ON FUNCTION public.can_curate_propriete_gallery(uuid) TO authenticated, service_role;

-- ============================================================
-- RPC : get_propriete_gallery (photos sélectionnées, ordonnées)
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_propriete_gallery(_propriete_id uuid)
RETURNS TABLE(
  id uuid,
  source_table text,
  source_id text,
  url text,
  author_name text,
  photo_date timestamptz,
  lat double precision,
  lng double precision,
  caption text,
  order_index int
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, source_table, source_id, url, author_name, photo_date, lat, lng, caption, order_index
  FROM public.propriete_gallery_photos
  WHERE propriete_id = _propriete_id
  ORDER BY order_index ASC, created_at ASC;
$$;

GRANT EXECUTE ON FUNCTION public.get_propriete_gallery(uuid) TO anon, authenticated, service_role;

-- ============================================================
-- RPC : get_propriete_gallery_candidates
-- Agrège les photos disponibles depuis les événements liés
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_propriete_gallery_candidates(_propriete_id uuid)
RETURNS TABLE(
  source_table text,
  source_id text,
  url text,
  author_name text,
  photo_date timestamptz,
  lat double precision,
  lng double precision,
  event_title text,
  event_id uuid,
  is_selected boolean,
  order_index int
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH linked_events AS (
    SELECT me.id AS event_id, me.title, me.exploration_id, me.cover_image_url, me.date_marche
    FROM public.propriete_marche_events pme
    JOIN public.marche_events me ON me.id = pme.marche_event_id
    WHERE pme.propriete_id = _propriete_id
  ),
  candidates AS (
    -- Couvertures d'événement
    SELECT
      'marche_events'::text AS source_table,
      le.event_id::text AS source_id,
      le.cover_image_url AS url,
      NULL::text AS author_name,
      le.date_marche AS photo_date,
      NULL::double precision AS lat,
      NULL::double precision AS lng,
      le.title AS event_title,
      le.event_id
    FROM linked_events le
    WHERE le.cover_image_url IS NOT NULL

    UNION ALL

    -- Photos officielles marches
    SELECT
      'marche_photos'::text,
      mp.id::text,
      mp.url_supabase,
      NULL::text,
      mp.created_at,
      NULL::double precision,
      NULL::double precision,
      le.title,
      le.event_id
    FROM linked_events le
    JOIN public.marche_photos mp ON mp.marche_id = le.event_id
    WHERE mp.url_supabase IS NOT NULL

    UNION ALL

    -- Mur de convivialité
    SELECT
      'convivialite'::text,
      cp.id::text,
      cp.url,
      NULLIF(TRIM(COALESCE(prof.prenom, '') || ' ' || COALESCE(prof.nom, '')), ''),
      cp.created_at,
      NULL::double precision,
      NULL::double precision,
      le.title,
      le.event_id
    FROM linked_events le
    JOIN public.exploration_convivialite_photos cp ON cp.exploration_id = le.exploration_id
    LEFT JOIN public.community_profiles prof ON prof.user_id = cp.user_id
    WHERE le.exploration_id IS NOT NULL
      AND cp.url IS NOT NULL
      AND COALESCE(cp.is_hidden, false) = false

    UNION ALL

    -- Médias marcheurs (photos publiques)
    SELECT
      'marcheur_medias'::text,
      mm.id::text,
      COALESCE(mm.url_fichier, mm.external_url),
      NULLIF(TRIM(COALESCE(prof.prenom, '') || ' ' || COALESCE(prof.nom, '')), ''),
      mm.created_at,
      NULLIF((mm.metadata->>'latitude')::text, '')::double precision,
      NULLIF((mm.metadata->>'longitude')::text, '')::double precision,
      le.title,
      le.event_id
    FROM linked_events le
    JOIN public.marcheur_medias mm ON mm.marche_event_id = le.event_id
    LEFT JOIN public.community_profiles prof ON prof.user_id = mm.user_id
    WHERE mm.type_media = 'photo'
      AND COALESCE(mm.is_public, false) = true
      AND COALESCE(mm.url_fichier, mm.external_url) IS NOT NULL
  ),
  deduped AS (
    SELECT DISTINCT ON (url) *
    FROM candidates
    WHERE url IS NOT NULL AND length(trim(url)) > 0
    ORDER BY url, photo_date DESC NULLS LAST
  )
  SELECT
    d.source_table,
    d.source_id,
    d.url,
    d.author_name,
    d.photo_date,
    d.lat,
    d.lng,
    d.event_title,
    d.event_id,
    (g.id IS NOT NULL) AS is_selected,
    g.order_index
  FROM deduped d
  LEFT JOIN public.propriete_gallery_photos g
    ON g.propriete_id = _propriete_id
   AND g.source_table = d.source_table
   AND g.source_id = d.source_id
  ORDER BY (g.id IS NOT NULL) DESC, COALESCE(g.order_index, 9999), d.photo_date DESC NULLS LAST
  LIMIT 300;
$$;

GRANT EXECUTE ON FUNCTION public.get_propriete_gallery_candidates(uuid) TO authenticated, service_role;

-- ============================================================
-- RPC : set_propriete_gallery
-- Enregistre la sélection curatée (jusqu'à 12 photos)
-- items : jsonb array [{source_table, source_id, url, author_name, photo_date, lat, lng}]
-- ============================================================
CREATE OR REPLACE FUNCTION public.set_propriete_gallery(
  _propriete_id uuid,
  _items jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_can boolean;
  v_item jsonb;
  v_idx int := 0;
BEGIN
  SELECT public.can_curate_propriete_gallery(_propriete_id) INTO v_can;
  IF NOT COALESCE(v_can, false) THEN
    RAISE EXCEPTION 'not_authorized_to_curate_gallery';
  END IF;

  IF jsonb_array_length(COALESCE(_items, '[]'::jsonb)) > 12 THEN
    RAISE EXCEPTION 'gallery_max_12_photos';
  END IF;

  -- Reset atomique
  DELETE FROM public.propriete_gallery_photos WHERE propriete_id = _propriete_id;

  FOR v_item IN SELECT * FROM jsonb_array_elements(_items) LOOP
    INSERT INTO public.propriete_gallery_photos (
      propriete_id, source_table, source_id, url,
      author_name, photo_date, lat, lng, caption,
      order_index, curated_by
    ) VALUES (
      _propriete_id,
      v_item->>'source_table',
      v_item->>'source_id',
      v_item->>'url',
      NULLIF(v_item->>'author_name', ''),
      NULLIF(v_item->>'photo_date', '')::timestamptz,
      NULLIF(v_item->>'lat', '')::double precision,
      NULLIF(v_item->>'lng', '')::double precision,
      NULLIF(v_item->>'caption', ''),
      v_idx,
      auth.uid()
    );
    v_idx := v_idx + 1;
  END LOOP;
END;
$$;

GRANT EXECUTE ON FUNCTION public.set_propriete_gallery(uuid, jsonb) TO authenticated, service_role;
