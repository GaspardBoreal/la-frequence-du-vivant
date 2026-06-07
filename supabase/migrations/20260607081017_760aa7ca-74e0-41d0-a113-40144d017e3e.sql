
CREATE OR REPLACE FUNCTION public.search_global(p_query text, p_event_id uuid DEFAULT NULL::uuid, p_limit integer DEFAULT 8)
 RETURNS TABLE(kind text, id text, title text, subtitle text, context text, score real, route text, meta jsonb)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
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
  -- Pool unifié : marcheur_observations ∪ biodiversity_snapshots (iNat)
  unified_obs AS (
    -- (a) contributions marcheurs
    SELECT
      o.species_scientific_name AS scientific_name,
      o.taxon_common_name_fr     AS common_name_fr,
      o.kingdom                  AS kingdom,
      o.iconic_taxon             AS iconic_taxon,
      o.photo_url                AS thumb_url,
      o.marche_id                AS marche_id,
      o.observation_date         AS observation_date,
      o.marcheur_id              AS marcheur_id,
      o.inaturalist_observation_id AS inat_id,
      'marcheur'::text           AS source,
      NULL::text                 AS observer_name
    FROM public.marcheur_observations o
    WHERE v_exploration_id IS NULL OR o.marche_id IN (SELECT marche_id FROM scope_marches)

    UNION ALL

    -- (b) snapshots iNat (filtre grossier via cast text avant l'expansion JSONB)
    SELECT
      (sp->>'scientificName')::text AS scientific_name,
      (sp->>'commonName')::text     AS common_name_fr,
      (sp->>'kingdom')::text        AS kingdom,
      (sp->>'iconicTaxon')::text    AS iconic_taxon,
      COALESCE((sp->'photos'->>0)::text, (sp->>'photoUrl')::text) AS thumb_url,
      bs.marche_id                  AS marche_id,
      COALESCE(
        NULLIF(attr->>'date',''),
        NULLIF(sp->>'observationDate',''),
        bs.snapshot_date::text
      )::date                       AS observation_date,
      NULL::uuid                    AS marcheur_id,
      NULLIF(regexp_replace(COALESCE(attr->>'originalUrl',''), '.*observations/(\d+).*', '\1'),'') AS inat_id,
      'citizen'::text               AS source,
      NULLIF(attr->>'observerName','') AS observer_name
    FROM public.biodiversity_snapshots bs
    CROSS JOIN LATERAL jsonb_array_elements(bs.species_data) sp
    LEFT JOIN LATERAL jsonb_array_elements(
      CASE WHEN jsonb_typeof(sp->'attributions') = 'array' AND jsonb_array_length(sp->'attributions') > 0
           THEN sp->'attributions'
           ELSE '[null]'::jsonb END
    ) attr ON TRUE
    WHERE (v_exploration_id IS NULL OR bs.marche_id IN (SELECT marche_id FROM scope_marches))
      -- pré-filtre grossier rapide
      AND public.f_unaccent(lower(bs.species_data::text)) ILIKE '%'||(SELECT s FROM q)||'%'
  ),
  -- Dédup : si une obs marcheur partage le même inat_id qu'une obs citizen, on garde la marcheur
  unified_dedup AS (
    SELECT u.*
    FROM unified_obs u
    WHERE u.source = 'marcheur'
       OR u.inat_id IS NULL
       OR NOT EXISTS (
            SELECT 1 FROM unified_obs u2
            WHERE u2.source = 'marcheur'
              AND u2.inat_id IS NOT NULL
              AND u2.inat_id = u.inat_id
              AND u2.marche_id = u.marche_id
          )
  ),
  species_matches AS (
    SELECT
      u.scientific_name AS species_scientific_name,
      COALESCE(
        (SELECT st.common_name_fr FROM public.species_translations st
           WHERE st.scientific_name = u.scientific_name
             AND st.common_name_fr IS NOT NULL
           ORDER BY (st.confidence_level = 'high') DESC NULLS LAST,
                    (st.confidence_level = 'medium') DESC NULLS LAST,
                    st.updated_at DESC NULLS LAST
           LIMIT 1),
        MAX(u.common_name_fr)
      ) AS common_name_fr,
      MAX(u.kingdom) AS kingdom,
      MAX(u.iconic_taxon) AS iconic_taxon,
      MAX(u.thumb_url) AS thumb_url,
      COUNT(*)::int AS occurrences,
      COUNT(DISTINCT u.marche_id)::int AS marches_count,
      COUNT(DISTINCT u.marcheur_id) FILTER (WHERE u.source = 'marcheur')::int AS marcheurs_count,
      COUNT(*) FILTER (WHERE u.source = 'citizen')::int AS citizen_count,
      COUNT(*) FILTER (WHERE u.source = 'marcheur')::int AS marcheur_count,
      MAX(u.observation_date) AS last_observation_date,
      (ARRAY_AGG(u.marche_id ORDER BY u.observation_date DESC NULLS LAST))[1] AS last_marche_id,
      GREATEST(
        extensions.similarity(public.f_unaccent(lower(u.scientific_name)), (SELECT s FROM q)),
        extensions.similarity(public.f_unaccent(lower(coalesce(MAX(u.common_name_fr),''))), (SELECT s FROM q)),
        COALESCE((
          SELECT MAX(GREATEST(
            extensions.similarity(public.f_unaccent(lower(coalesce(st.common_name_fr,''))), (SELECT s FROM q)),
            extensions.similarity(public.f_unaccent(lower(coalesce(array_to_string(st.alternative_names_fr,' '),''))), (SELECT s FROM q))
          ))
          FROM public.species_translations st
          WHERE st.scientific_name = u.scientific_name
        ), 0)
      )::real AS score
    FROM unified_dedup u
    WHERE
        public.f_unaccent(lower(u.scientific_name)) ILIKE '%'||(SELECT s FROM q)||'%'
        OR public.f_unaccent(lower(coalesce(u.common_name_fr,''))) ILIKE '%'||(SELECT s FROM q)||'%'
        OR public.f_unaccent(lower(u.scientific_name)) % (SELECT s FROM q)
        OR EXISTS (
          SELECT 1 FROM public.species_translations st
          WHERE st.scientific_name = u.scientific_name
            AND (
              public.f_unaccent(lower(coalesce(st.common_name_fr,''))) ILIKE '%'||(SELECT s FROM q)||'%'
              OR public.f_unaccent(lower(coalesce(array_to_string(st.alternative_names_fr,' '),''))) ILIKE '%'||(SELECT s FROM q)||'%'
              OR public.f_unaccent(lower(coalesce(st.common_name_fr,''))) % (SELECT s FROM q)
            )
        )
    GROUP BY u.scientific_name
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
    SELECT sm.species_scientific_name, jsonb_agg(ctxs.ctx ORDER BY (ctxs.ctx->>'date') DESC NULLS LAST) AS recent_contexts
    FROM species_with_exp sm
    LEFT JOIN LATERAL (
      SELECT jsonb_build_object(
        'marche_id', u2.marche_id,
        'nom_marche', MAX(m.nom_marche),
        'ville', MAX(m.ville),
        'date', to_char(MAX(u2.observation_date), 'YYYY-MM-DD'),
        'count', COUNT(*),
        'sources', jsonb_build_object(
          'marcheur', COUNT(*) FILTER (WHERE u2.source = 'marcheur'),
          'citizen',  COUNT(*) FILTER (WHERE u2.source = 'citizen')
        ),
        'source', CASE
          WHEN COUNT(*) FILTER (WHERE u2.source = 'marcheur') > 0 THEN 'marcheur'
          ELSE 'citizen' END,
        'marcheur', (
          SELECT COALESCE(MAX(cp.prenom)||' '||LEFT(COALESCE(MAX(cp.nom),''),1)||'.', NULL)
          FROM public.community_profiles cp
          WHERE cp.user_id IN (SELECT u3.marcheur_id FROM unified_dedup u3
                                WHERE u3.species_scientific_name IS NOT DISTINCT FROM sm.species_scientific_name
                                  AND u3.marche_id = u2.marche_id
                                  AND u3.source = 'marcheur')
        ),
        'exploration_id', (
          SELECT em3.exploration_id FROM public.exploration_marches em3
          WHERE em3.marche_id = u2.marche_id LIMIT 1
        ),
        'event_id', (
          SELECT me.id FROM public.marche_events me
          WHERE me.exploration_id = (
            SELECT em4.exploration_id FROM public.exploration_marches em4
            WHERE em4.marche_id = u2.marche_id LIMIT 1
          )
          ORDER BY me.date_marche DESC NULLS LAST
          LIMIT 1
        ),
        'event_title', (
          SELECT me.title FROM public.marche_events me
          WHERE me.exploration_id = (
            SELECT em5.exploration_id FROM public.exploration_marches em5
            WHERE em5.marche_id = u2.marche_id LIMIT 1
          )
          ORDER BY me.date_marche DESC NULLS LAST
          LIMIT 1
        )
      ) AS ctx
      FROM unified_dedup u2
      LEFT JOIN public.marches m ON m.id = u2.marche_id
      WHERE u2.scientific_name = sm.species_scientific_name
      GROUP BY u2.marche_id
      ORDER BY MAX(u2.observation_date) DESC NULLS LAST
      LIMIT 8
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
        'marcheurs_count', sm.marcheurs_count,
        'citizen_count', sm.citizen_count,
        'marcheur_count', sm.marcheur_count,
        'last_observation_date', sm.last_observation_date,
        'recent_contexts', COALESCE(sc.recent_contexts, '[]'::jsonb)
      ) AS meta
    FROM species_with_exp sm
    LEFT JOIN species_contexts sc ON sc.species_scientific_name = sm.species_scientific_name

    UNION ALL
    SELECT 'practice'::text, c.id::text,
      COALESCE(c.title, c.category, 'Pratique')::text,
      LEFT(regexp_replace(COALESCE(c.description,''), '<[^>]+>', '', 'g'), 140)::text,
      COALESCE(e.name,'')::text,
      GREATEST(
        extensions.similarity(public.f_unaccent(lower(coalesce(c.title,''))), (SELECT s FROM q)),
        extensions.similarity(public.f_unaccent(lower(coalesce(c.description,''))), (SELECT s FROM q)) * 0.7,
        extensions.similarity(public.f_unaccent(lower(coalesce(c.category,''))), (SELECT s FROM q)) * 0.6
      )::real,
      ('/marches-du-vivant/mon-espace/exploration/'||c.exploration_id::text||'?focus=practice:'||c.id::text||'&tab=apprendre&sub=decouvertes&sensory=main')::text,
      jsonb_build_object(
        'exploration_id', c.exploration_id,
        'exploration_name', e.name,
        'category', c.category,
        'source', c.source,
        'sense', c.sense,
        'thumb_url', (
          SELECT COALESCE(mm.url_fichier, mm.external_url) FROM public.marcheur_medias mm
          WHERE mm.id::text = ANY(c.media_ids)
          LIMIT 1
        )
      )
    FROM public.exploration_curations c
    LEFT JOIN public.explorations e ON e.id = c.exploration_id
    WHERE c.sense = 'main'::curation_sense
      AND (v_exploration_id IS NULL OR c.exploration_id = v_exploration_id)
      AND (
        public.f_unaccent(lower(coalesce(c.title,''))) ILIKE '%'||(SELECT s FROM q)||'%'
        OR public.f_unaccent(lower(coalesce(c.description,''))) ILIKE '%'||(SELECT s FROM q)||'%'
        OR public.f_unaccent(lower(coalesce(c.category,''))) ILIKE '%'||(SELECT s FROM q)||'%'
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
$function$;
