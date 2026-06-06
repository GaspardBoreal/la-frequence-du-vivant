CREATE OR REPLACE FUNCTION public.search_global(
  p_query text,
  p_event_id uuid DEFAULT NULL,
  p_limit int DEFAULT 8
)
RETURNS TABLE (
  kind text, id text, title text, subtitle text,
  context text, score real, route text, meta jsonb
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, extensions
AS $$
#variable_conflict use_column
DECLARE
  v_exploration_id uuid;
BEGIN
  IF p_event_id IS NOT NULL THEN
    SELECT me.exploration_id INTO v_exploration_id
    FROM public.marche_events me WHERE me.id = p_event_id;
  END IF;

  RETURN QUERY
  WITH q AS (SELECT public.f_unaccent(lower(p_query)) AS s),
  scope_marches AS (
    SELECT em.marche_id FROM public.exploration_marches em
    WHERE v_exploration_id IS NULL OR em.exploration_id = v_exploration_id
  ),
  species_matches AS (
    SELECT
      o.species_scientific_name,
      MAX(o.taxon_common_name_fr) AS common_name_fr,
      MAX(o.kingdom) AS kingdom,
      MAX(o.iconic_taxon) AS iconic_taxon,
      MAX(o.photo_url) AS thumb_url,
      COUNT(*)::int AS occurrences,
      COUNT(DISTINCT o.marche_id)::int AS marches_count,
      COUNT(DISTINCT o.marcheur_id)::int AS marcheurs_count,
      MAX(o.observation_date) AS last_observation_date,
      (ARRAY_AGG(o.marche_id ORDER BY o.observation_date DESC NULLS LAST))[1] AS last_marche_id,
      GREATEST(
        extensions.similarity(public.f_unaccent(lower(o.species_scientific_name)), (SELECT s FROM q)),
        extensions.similarity(public.f_unaccent(lower(coalesce(MAX(o.taxon_common_name_fr),''))), (SELECT s FROM q))
      )::real AS score
    FROM public.marcheur_observations o
    WHERE (v_exploration_id IS NULL OR o.marche_id IN (SELECT marche_id FROM scope_marches))
      AND (
        public.f_unaccent(lower(o.species_scientific_name)) ILIKE '%'||(SELECT s FROM q)||'%'
        OR public.f_unaccent(lower(coalesce(o.taxon_common_name_fr,''))) ILIKE '%'||(SELECT s FROM q)||'%'
        OR public.f_unaccent(lower(o.species_scientific_name)) % (SELECT s FROM q)
      )
    GROUP BY o.species_scientific_name
    ORDER BY score DESC
    LIMIT p_limit
  ),
  species_with_exp AS (
    SELECT sm.*, em.exploration_id AS any_exploration_id
    FROM species_matches sm
    LEFT JOIN LATERAL (
      SELECT em2.exploration_id FROM public.exploration_marches em2 WHERE em2.marche_id = sm.last_marche_id LIMIT 1
    ) em ON true
  ),
  species_contexts AS (
    SELECT sm.species_scientific_name, jsonb_agg(ctxs.ctx) AS recent_contexts
    FROM species_with_exp sm
    LEFT JOIN LATERAL (
      SELECT jsonb_build_object(
        'marche_id', o2.marche_id,
        'nom_marche', MAX(m.nom_marche),
        'ville', MAX(m.ville),
        'date', to_char(MAX(o2.observation_date), 'YYYY-MM-DD'),
        'count', COUNT(*),
        'marcheur', COALESCE(MAX(cp.prenom)||' '||LEFT(COALESCE(MAX(cp.nom),''),1)||'.', NULL)
      ) AS ctx
      FROM public.marcheur_observations o2
      LEFT JOIN public.marches m ON m.id = o2.marche_id
      LEFT JOIN public.community_profiles cp ON cp.user_id = o2.marcheur_id
      WHERE o2.species_scientific_name = sm.species_scientific_name
      GROUP BY o2.marche_id
      ORDER BY MAX(o2.observation_date) DESC NULLS LAST
      LIMIT 3
    ) ctxs ON true
    GROUP BY sm.species_scientific_name
  )
  SELECT * FROM (
    SELECT
      'species'::text AS kind,
      sm.species_scientific_name::text AS id,
      COALESCE(sm.common_name_fr, sm.species_scientific_name)::text AS title,
      sm.species_scientific_name::text AS subtitle,
      CASE WHEN sm.marches_count > 1
        THEN ('Vue '||sm.occurrences||'× sur '||sm.marches_count||' marches')
        ELSE NULL END::text AS context,
      sm.score,
      ('/marches-du-vivant/mon-espace/exploration/'||COALESCE(sm.any_exploration_id::text,'')
        ||'?focus=species:'||replace(sm.species_scientific_name,' ','%20')
        ||'&tab=biodiversite&sub=taxons'
        ||CASE WHEN sm.last_marche_id IS NOT NULL THEN '&marcheId='||sm.last_marche_id::text ELSE '' END
      )::text AS route,
      jsonb_build_object(
        'thumb_url', sm.thumb_url, 'kingdom', sm.kingdom, 'iconic_taxon', sm.iconic_taxon,
        'occurrences', sm.occurrences, 'marches_count', sm.marches_count,
        'marcheurs_count', sm.marcheurs_count, 'last_observation_date', sm.last_observation_date,
        'recent_contexts', COALESCE(sc.recent_contexts, '[]'::jsonb)
      ) AS meta
    FROM species_with_exp sm
    LEFT JOIN species_contexts sc ON sc.species_scientific_name = sm.species_scientific_name

    UNION ALL
    SELECT 'practice'::text, c.id::text,
      COALESCE(c.title, c.category, 'Pratique')::text,
      LEFT(COALESCE(c.description,''), 140)::text,
      COALESCE(e.name,'')::text,
      GREATEST(
        extensions.similarity(public.f_unaccent(lower(coalesce(c.title,''))), (SELECT s FROM q)),
        extensions.similarity(public.f_unaccent(lower(coalesce(c.description,''))), (SELECT s FROM q)) * 0.7,
        extensions.similarity(public.f_unaccent(lower(coalesce(c.category,''))), (SELECT s FROM q)) * 0.6
      )::real,
      ('/marches-du-vivant/mon-espace/exploration/'||c.exploration_id::text||'?focus=practice:'||c.id::text||'&tab=apprendre')::text,
      jsonb_build_object('exploration_id', c.exploration_id, 'exploration_name', e.name, 'category', c.category, 'source', c.source)
    FROM public.exploration_curations c
    LEFT JOIN public.explorations e ON e.id = c.exploration_id
    WHERE c.source = 'main'
      AND (v_exploration_id IS NULL OR c.exploration_id = v_exploration_id)
      AND (
        public.f_unaccent(lower(coalesce(c.title,''))) ILIKE '%'||(SELECT s FROM q)||'%'
        OR public.f_unaccent(lower(coalesce(c.description,''))) ILIKE '%'||(SELECT s FROM q)||'%'
        OR public.f_unaccent(lower(coalesce(c.title,''))) % (SELECT s FROM q)
      )
    ORDER BY 6 DESC LIMIT p_limit
  ) AS top

  UNION ALL
  SELECT * FROM (
    SELECT 'text'::text, t.id::text,
      COALESCE(t.titre,'(Sans titre)')::text,
      LEFT(regexp_replace(COALESCE(t.contenu,''), '<[^>]+>', '', 'g'), 140)::text,
      COALESCE(m.nom_marche,'')::text,
      GREATEST(
        extensions.similarity(public.f_unaccent(lower(coalesce(t.titre,''))), (SELECT s FROM q)),
        extensions.similarity(public.f_unaccent(lower(coalesce(t.contenu,''))), (SELECT s FROM q)) * 0.6
      )::real,
      (CASE WHEN em.exploration_id IS NOT NULL
        THEN '/marches-du-vivant/mon-espace/exploration/'||em.exploration_id::text||'?focus=text:'||t.id::text||'&tab=biodiversite&sub=textes'
        ELSE '/marche/'||t.marche_id::text END)::text,
      jsonb_build_object(
        'marche_id', t.marche_id, 'nom_marche', m.nom_marche, 'ville', m.ville,
        'date_marche', m.date, 'type_texte', t.type_texte,
        'excerpt', (
          SELECT CASE WHEN pos > 0 THEN
              CASE WHEN pos > 40 THEN '…' ELSE '' END
              || substring(plain FROM GREATEST(1, pos - 40) FOR 120)
              || CASE WHEN length(plain) > pos + 80 THEN '…' ELSE '' END
            ELSE LEFT(plain, 120) END
          FROM (SELECT regexp_replace(COALESCE(t.contenu,''), '<[^>]+>', '', 'g') AS plain) p1
          CROSS JOIN LATERAL (SELECT POSITION((SELECT s FROM q) IN public.f_unaccent(lower(plain))) AS pos) p2
        )
      )
    FROM public.marche_textes t
    LEFT JOIN public.marches m ON m.id = t.marche_id
    LEFT JOIN LATERAL (
      SELECT em3.exploration_id FROM public.exploration_marches em3 WHERE em3.marche_id = t.marche_id LIMIT 1
    ) em ON true
    WHERE (v_exploration_id IS NULL OR t.marche_id IN (SELECT marche_id FROM scope_marches))
      AND (
        public.f_unaccent(lower(coalesce(t.titre,''))) ILIKE '%'||(SELECT s FROM q)||'%'
        OR public.f_unaccent(lower(coalesce(t.contenu,''))) ILIKE '%'||(SELECT s FROM q)||'%'
        OR public.f_unaccent(lower(coalesce(t.titre,''))) % (SELECT s FROM q)
      )
    ORDER BY 6 DESC LIMIT p_limit
  ) AS t2

  UNION ALL
  SELECT * FROM (
    SELECT 'testimony'::text, tt.id::text,
      COALESCE(tt.author_name, 'Témoignage')::text,
      LEFT(COALESCE(tt.quote,''), 140)::text,
      COALESCE(me.title,'')::text,
      GREATEST(
        extensions.similarity(public.f_unaccent(lower(coalesce(tt.quote,''))), (SELECT s FROM q)),
        extensions.similarity(public.f_unaccent(lower(coalesce(tt.author_name,''))), (SELECT s FROM q)) * 0.5
      )::real,
      ('/marches-du-vivant/mon-espace/exploration/'||COALESCE(me.exploration_id::text,'')||'?focus=testimony:'||tt.id::text||'&tab=biodiversite&sub=temoignages')::text,
      jsonb_build_object(
        'event_id', tt.event_id, 'marche_title', me.title, 'lieu', me.lieu,
        'date_marche', me.date_marche, 'author_name', tt.author_name,
        'excerpt', (
          SELECT CASE WHEN pos > 0 THEN
              CASE WHEN pos > 40 THEN '…' ELSE '' END
              || substring(COALESCE(tt.quote,'') FROM GREATEST(1, pos - 40) FOR 120)
              || CASE WHEN length(COALESCE(tt.quote,'')) > pos + 80 THEN '…' ELSE '' END
            ELSE LEFT(COALESCE(tt.quote,''), 120) END
          FROM (SELECT POSITION((SELECT s FROM q) IN public.f_unaccent(lower(COALESCE(tt.quote,'')))) AS pos) p
        )
      )
    FROM public.event_testimonies tt
    LEFT JOIN public.marche_events me ON me.id = tt.event_id
    WHERE tt.is_published = true
      AND (p_event_id IS NULL OR tt.event_id = p_event_id)
      AND (
        public.f_unaccent(lower(coalesce(tt.quote,''))) ILIKE '%'||(SELECT s FROM q)||'%'
        OR public.f_unaccent(lower(coalesce(tt.author_name,''))) % (SELECT s FROM q)
      )
    ORDER BY 6 DESC LIMIT p_limit
  ) AS tt2

  UNION ALL
  SELECT * FROM (
    SELECT 'marcheur'::text, cp.slug::text,
      (COALESCE(cp.prenom,'')||' '||COALESCE(cp.nom,''))::text,
      COALESCE(cp.ville,'')::text,
      COALESCE(cp.role::text,'')::text,
      extensions.similarity(public.f_unaccent(lower(COALESCE(cp.prenom,'')||' '||COALESCE(cp.nom,''))), (SELECT s FROM q))::real,
      ('/marcheur/'||cp.slug)::text,
      jsonb_build_object('user_id', cp.user_id, 'avatar_url', cp.avatar_url, 'ville', cp.ville, 'role', cp.role, 'marches_count', cp.marches_count)
    FROM public.community_profiles cp
    WHERE cp.slug IS NOT NULL
      AND (
        public.f_unaccent(lower(COALESCE(cp.prenom,'')||' '||COALESCE(cp.nom,''))) ILIKE '%'||(SELECT s FROM q)||'%'
        OR public.f_unaccent(lower(COALESCE(cp.prenom,'')||' '||COALESCE(cp.nom,''))) % (SELECT s FROM q)
      )
    ORDER BY 6 DESC LIMIT p_limit
  ) AS m2

  UNION ALL
  SELECT * FROM (
    SELECT 'event'::text, me.id::text,
      COALESCE(me.title,'(Marche)')::text,
      COALESCE(me.lieu,'')::text,
      to_char(me.date_marche, 'DD/MM/YYYY')::text,
      GREATEST(
        extensions.similarity(public.f_unaccent(lower(coalesce(me.title,''))), (SELECT s FROM q)),
        extensions.similarity(public.f_unaccent(lower(coalesce(me.lieu,''))), (SELECT s FROM q)) * 0.7,
        extensions.similarity(public.f_unaccent(lower(coalesce(me.description,''))), (SELECT s FROM q)) * 0.5
      )::real,
      ('/marches-du-vivant/mon-espace/exploration/'||COALESCE(me.exploration_id::text, me.id::text)||'?focus=event:'||me.id::text)::text,
      jsonb_build_object('exploration_id', me.exploration_id, 'event_type', me.event_type, 'lieu', me.lieu, 'date_marche', me.date_marche, 'cover_image_url', me.cover_image_url)
    FROM public.marche_events me
    WHERE (
        public.f_unaccent(lower(coalesce(me.title,''))) ILIKE '%'||(SELECT s FROM q)||'%'
        OR public.f_unaccent(lower(coalesce(me.lieu,''))) ILIKE '%'||(SELECT s FROM q)||'%'
        OR public.f_unaccent(lower(coalesce(me.description,''))) ILIKE '%'||(SELECT s FROM q)||'%'
        OR public.f_unaccent(lower(coalesce(me.title,''))) % (SELECT s FROM q)
      )
    ORDER BY 6 DESC LIMIT p_limit
  ) AS ev2

  ORDER BY 6 DESC, 1;
END;
$$;