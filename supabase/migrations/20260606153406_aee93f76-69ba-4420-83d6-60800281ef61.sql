
CREATE EXTENSION IF NOT EXISTS pg_trgm SCHEMA extensions;

CREATE OR REPLACE FUNCTION public.f_unaccent(text)
RETURNS text
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
STRICT
AS $$ SELECT extensions.unaccent('extensions.unaccent'::regdictionary, $1) $$;

CREATE TABLE IF NOT EXISTS public.search_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  prenom text,
  nom text,
  query text NOT NULL,
  event_id uuid,
  marche_id uuid,
  scope text NOT NULL DEFAULT 'global',
  results_count integer NOT NULL DEFAULT 0,
  clicked_kind text,
  clicked_id text,
  route text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.search_logs TO authenticated;
GRANT ALL ON public.search_logs TO service_role;

ALTER TABLE public.search_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can insert their own search logs" ON public.search_logs;
CREATE POLICY "Users can insert their own search logs"
  ON public.search_logs FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

DROP POLICY IF EXISTS "Admins can read all search logs" ON public.search_logs;
CREATE POLICY "Admins can read all search logs"
  ON public.search_logs FOR SELECT TO authenticated
  USING (public.is_admin_user());

DROP POLICY IF EXISTS "Users can read their own search logs" ON public.search_logs;
CREATE POLICY "Users can read their own search logs"
  ON public.search_logs FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_search_logs_user ON public.search_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_search_logs_created ON public.search_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_search_logs_query_trgm ON public.search_logs USING gin (public.f_unaccent(lower(query)) extensions.gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_community_profiles_name_trgm ON public.community_profiles USING gin (public.f_unaccent(lower(coalesce(prenom,'')||' '||coalesce(nom,''))) extensions.gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_marche_events_title_trgm ON public.marche_events USING gin (public.f_unaccent(lower(coalesce(title,''))) extensions.gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_explorations_name_trgm ON public.explorations USING gin (public.f_unaccent(lower(coalesce(name,''))) extensions.gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_marche_textes_title_trgm ON public.marche_textes USING gin (public.f_unaccent(lower(coalesce(titre,''))) extensions.gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_exploration_curations_title_trgm ON public.exploration_curations USING gin (public.f_unaccent(lower(coalesce(title,''))) extensions.gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_marcheur_observations_species_trgm ON public.marcheur_observations USING gin (public.f_unaccent(lower(coalesce(species_scientific_name,'')||' '||coalesce(taxon_common_name_fr,''))) extensions.gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_event_testimonies_quote_trgm ON public.event_testimonies USING gin (public.f_unaccent(lower(coalesce(quote,''))) extensions.gin_trgm_ops);

CREATE OR REPLACE FUNCTION public.search_global(
  p_query text,
  p_event_id uuid DEFAULT NULL,
  p_limit integer DEFAULT 8
)
RETURNS TABLE (
  kind text,
  id text,
  title text,
  subtitle text,
  context text,
  score real,
  route text,
  meta jsonb
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_q text;
BEGIN
  IF p_query IS NULL OR length(trim(p_query)) < 2 THEN
    RETURN;
  END IF;
  v_q := lower(public.f_unaccent(trim(p_query)));

  RETURN QUERY
  WITH q AS (SELECT v_q AS s)
  (
    SELECT
      'species'::text, o.species_scientific_name::text,
      coalesce(o.taxon_common_name_fr, o.species_scientific_name)::text,
      o.species_scientific_name::text,
      coalesce(me.title, e.name, '')::text,
      GREATEST(
        extensions.similarity(public.f_unaccent(lower(coalesce(o.species_scientific_name,''))), (SELECT s FROM q)),
        extensions.similarity(public.f_unaccent(lower(coalesce(o.taxon_common_name_fr,''))), (SELECT s FROM q))
      )::real,
      ('/marches-du-vivant/mon-espace/exploration/'||coalesce(me.exploration_id::text,''))::text,
      jsonb_build_object('marche_id', o.marche_id, 'event_id', me.id, 'kingdom', o.kingdom)
    FROM marcheur_observations o
    LEFT JOIN marche_events me ON me.id = o.marche_id
    LEFT JOIN explorations e ON e.id = me.exploration_id
    WHERE (p_event_id IS NULL OR o.marche_id = p_event_id)
      AND (
        public.f_unaccent(lower(coalesce(o.species_scientific_name,''))) ILIKE '%'||(SELECT s FROM q)||'%'
        OR public.f_unaccent(lower(coalesce(o.taxon_common_name_fr,''))) ILIKE '%'||(SELECT s FROM q)||'%'
        OR public.f_unaccent(lower(coalesce(o.species_scientific_name,''))) % (SELECT s FROM q)
        OR public.f_unaccent(lower(coalesce(o.taxon_common_name_fr,''))) % (SELECT s FROM q)
      )
    ORDER BY 6 DESC
    LIMIT p_limit
  )
  UNION ALL
  (
    SELECT
      'practice'::text, c.id::text,
      coalesce(c.title, c.category, 'Pratique')::text,
      left(coalesce(c.description,''), 140)::text,
      coalesce(e.name,'')::text,
      GREATEST(
        extensions.similarity(public.f_unaccent(lower(coalesce(c.title,''))), (SELECT s FROM q)),
        extensions.similarity(public.f_unaccent(lower(coalesce(c.description,''))), (SELECT s FROM q)) * 0.7,
        extensions.similarity(public.f_unaccent(lower(coalesce(c.category,''))), (SELECT s FROM q)) * 0.6
      )::real,
      ('/marches-du-vivant/mon-espace/exploration/'||c.exploration_id::text)::text,
      jsonb_build_object('exploration_id', c.exploration_id, 'source', c.source)
    FROM exploration_curations c
    LEFT JOIN explorations e ON e.id = c.exploration_id
    WHERE c.source = 'main'
      AND (
        public.f_unaccent(lower(coalesce(c.title,''))) ILIKE '%'||(SELECT s FROM q)||'%'
        OR public.f_unaccent(lower(coalesce(c.description,''))) ILIKE '%'||(SELECT s FROM q)||'%'
        OR public.f_unaccent(lower(coalesce(c.title,''))) % (SELECT s FROM q)
      )
    ORDER BY 6 DESC
    LIMIT p_limit
  )
  UNION ALL
  (
    SELECT
      'text'::text, t.id::text,
      coalesce(t.titre,'(Sans titre)')::text,
      left(regexp_replace(coalesce(t.contenu,''), '<[^>]+>', '', 'g'), 140)::text,
      coalesce(me.title,'')::text,
      GREATEST(
        extensions.similarity(public.f_unaccent(lower(coalesce(t.titre,''))), (SELECT s FROM q)),
        extensions.similarity(public.f_unaccent(lower(coalesce(t.contenu,''))), (SELECT s FROM q)) * 0.6
      )::real,
      ('/marche/'||t.marche_id::text)::text,
      jsonb_build_object('marche_id', t.marche_id, 'type_texte', t.type_texte)
    FROM marche_textes t
    LEFT JOIN marche_events me ON me.id = t.marche_id
    WHERE (p_event_id IS NULL OR t.marche_id = p_event_id)
      AND (
        public.f_unaccent(lower(coalesce(t.titre,''))) ILIKE '%'||(SELECT s FROM q)||'%'
        OR public.f_unaccent(lower(coalesce(t.contenu,''))) ILIKE '%'||(SELECT s FROM q)||'%'
        OR public.f_unaccent(lower(coalesce(t.titre,''))) % (SELECT s FROM q)
      )
    ORDER BY 6 DESC
    LIMIT p_limit
  )
  UNION ALL
  (
    SELECT
      'testimony'::text, tt.id::text,
      coalesce(tt.author_name, 'Témoignage')::text,
      left(coalesce(tt.quote,''), 140)::text,
      coalesce(me.title,'')::text,
      GREATEST(
        extensions.similarity(public.f_unaccent(lower(coalesce(tt.quote,''))), (SELECT s FROM q)),
        extensions.similarity(public.f_unaccent(lower(coalesce(tt.author_name,''))), (SELECT s FROM q)) * 0.5
      )::real,
      ('/marches-du-vivant/mon-espace/exploration/'||coalesce(me.exploration_id::text,''))::text,
      jsonb_build_object('event_id', tt.event_id)
    FROM event_testimonies tt
    LEFT JOIN marche_events me ON me.id = tt.event_id
    WHERE tt.is_published = true
      AND (p_event_id IS NULL OR tt.event_id = p_event_id)
      AND (
        public.f_unaccent(lower(coalesce(tt.quote,''))) ILIKE '%'||(SELECT s FROM q)||'%'
        OR public.f_unaccent(lower(coalesce(tt.author_name,''))) % (SELECT s FROM q)
      )
    ORDER BY 6 DESC
    LIMIT p_limit
  )
  UNION ALL
  (
    SELECT
      'marcheur'::text, cp.slug::text,
      (coalesce(cp.prenom,'')||' '||coalesce(cp.nom,''))::text,
      coalesce(cp.ville,'')::text,
      coalesce(cp.role::text,'')::text,
      extensions.similarity(
        public.f_unaccent(lower(coalesce(cp.prenom,'')||' '||coalesce(cp.nom,''))),
        (SELECT s FROM q)
      )::real,
      ('/marcheur/'||cp.slug)::text,
      jsonb_build_object('user_id', cp.user_id, 'avatar_url', cp.avatar_url)
    FROM community_profiles cp
    WHERE cp.slug IS NOT NULL
      AND (
        public.f_unaccent(lower(coalesce(cp.prenom,'')||' '||coalesce(cp.nom,''))) ILIKE '%'||(SELECT s FROM q)||'%'
        OR public.f_unaccent(lower(coalesce(cp.prenom,'')||' '||coalesce(cp.nom,''))) % (SELECT s FROM q)
      )
    ORDER BY 6 DESC
    LIMIT p_limit
  )
  UNION ALL
  (
    SELECT
      'event'::text, me.id::text,
      coalesce(me.title,'(Marche)')::text,
      coalesce(me.lieu,'')::text,
      to_char(me.date_marche, 'DD/MM/YYYY')::text,
      GREATEST(
        extensions.similarity(public.f_unaccent(lower(coalesce(me.title,''))), (SELECT s FROM q)),
        extensions.similarity(public.f_unaccent(lower(coalesce(me.lieu,''))), (SELECT s FROM q)) * 0.7,
        extensions.similarity(public.f_unaccent(lower(coalesce(me.description,''))), (SELECT s FROM q)) * 0.5
      )::real,
      ('/marches-du-vivant/mon-espace/exploration/'||coalesce(me.exploration_id::text, me.id::text))::text,
      jsonb_build_object('exploration_id', me.exploration_id, 'event_type', me.event_type)
    FROM marche_events me
    WHERE (
        public.f_unaccent(lower(coalesce(me.title,''))) ILIKE '%'||(SELECT s FROM q)||'%'
        OR public.f_unaccent(lower(coalesce(me.lieu,''))) ILIKE '%'||(SELECT s FROM q)||'%'
        OR public.f_unaccent(lower(coalesce(me.description,''))) ILIKE '%'||(SELECT s FROM q)||'%'
        OR public.f_unaccent(lower(coalesce(me.title,''))) % (SELECT s FROM q)
      )
    ORDER BY 6 DESC
    LIMIT p_limit
  )
  ORDER BY 6 DESC, 1
  LIMIT p_limit * 6;
END;
$$;

GRANT EXECUTE ON FUNCTION public.search_global(text, uuid, integer) TO authenticated, anon;

CREATE OR REPLACE FUNCTION public.log_search(
  p_query text,
  p_event_id uuid DEFAULT NULL,
  p_marche_id uuid DEFAULT NULL,
  p_scope text DEFAULT 'global',
  p_results_count integer DEFAULT 0,
  p_clicked_kind text DEFAULT NULL,
  p_clicked_id text DEFAULT NULL,
  p_route text DEFAULT NULL,
  p_user_agent text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_prenom text;
  v_nom text;
  v_id uuid;
BEGIN
  IF p_query IS NULL OR length(trim(p_query)) < 2 THEN
    RETURN NULL;
  END IF;
  IF v_uid IS NOT NULL THEN
    SELECT prenom, nom INTO v_prenom, v_nom FROM community_profiles WHERE user_id = v_uid LIMIT 1;
  END IF;
  INSERT INTO search_logs (user_id, prenom, nom, query, event_id, marche_id, scope, results_count, clicked_kind, clicked_id, route, user_agent)
  VALUES (v_uid, v_prenom, v_nom, trim(p_query), p_event_id, p_marche_id, p_scope, p_results_count, p_clicked_kind, p_clicked_id, p_route, p_user_agent)
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.log_search(text, uuid, uuid, text, integer, text, text, text, text) TO authenticated;
