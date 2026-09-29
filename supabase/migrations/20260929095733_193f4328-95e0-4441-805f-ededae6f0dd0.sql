CREATE OR REPLACE FUNCTION public.get_data_asset_stats()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_g_user uuid;
  v_a_user uuid;
  v_categories jsonb;
  v_top jsonb;
  v_top_base bigint;
  v_snapshot_attributions bigint;
  v_snapshot_third_party bigint;
  v_snapshots_with_third_party bigint;
BEGIN
  IF NOT public.check_is_admin_user(auth.uid()) THEN
    RAISE EXCEPTION 'Accès réservé aux administrateurs';
  END IF;

  SELECT user_id INTO v_g_user
  FROM public.community_profiles
  WHERE lower(nom) = 'boreal' AND lower(prenom) = 'gaspard'
  LIMIT 1;

  SELECT user_id INTO v_a_user
  FROM public.community_profiles
  WHERE lower(nom) = 'du vivant' AND lower(prenom) = 'les marches'
  LIMIT 1;

  WITH work_rows AS (
    SELECT 'Médias marcheurs'::text AS famille,
           COALESCE(em.user_id, m.user_id) AS author_id
    FROM public.marcheur_medias m
    LEFT JOIN public.exploration_marcheurs em ON em.id = m.attributed_marcheur_id
    UNION ALL
    SELECT 'Textes de marcheurs',
           COALESCE(t.attributed_user_id, em.user_id, t.user_id)
    FROM public.marcheur_textes t
    LEFT JOIN public.exploration_marcheurs em ON em.id = t.attributed_marcheur_id
    UNION ALL
    SELECT 'Audios de marcheurs',
           COALESCE(em.user_id, a.user_id)
    FROM public.marcheur_audio a
    LEFT JOIN public.exploration_marcheurs em ON em.id = a.attributed_marcheur_id
  ), work_counts AS (
    SELECT count(*)::bigint AS identified_total,
           count(*) FILTER (WHERE author_id = v_g_user)::bigint AS gaspard,
           count(*) FILTER (WHERE author_id = v_a_user)::bigint AS association,
           count(*) FILTER (WHERE author_id IS NOT NULL AND author_id <> v_g_user AND author_id <> v_a_user)::bigint AS others
    FROM work_rows
  ), works AS (
    SELECT (w.identified_total + (SELECT count(*) FROM public.marche_photos) + (SELECT count(*) FROM public.marche_audio))::bigint AS total,
           w.gaspard,
           w.association,
           w.others,
           ((SELECT count(*) FROM public.marche_photos) + (SELECT count(*) FROM public.marche_audio))::bigint AS unattributed
    FROM work_counts w
  ), observations AS (
    SELECT count(*)::bigint AS total,
           count(*) FILTER (WHERE em.user_id = v_g_user)::bigint AS gaspard,
           count(*) FILTER (WHERE em.user_id = v_a_user)::bigint AS association,
           count(*) FILTER (WHERE em.user_id IS NOT NULL AND em.user_id <> v_g_user AND em.user_id <> v_a_user)::bigint AS others,
           count(*) FILTER (WHERE em.user_id IS NULL)::bigint AS unattributed
    FROM public.marcheur_observations o
    JOIN public.exploration_marcheurs em ON em.id = o.marcheur_id
  ), activity AS (
    SELECT ((SELECT count(*) FROM public.marches) +
            (SELECT count(*) FROM public.marche_events) +
            (SELECT count(*) FROM public.marche_participations) +
            (SELECT count(*) FROM public.exploration_waypoints))::bigint AS total
  ), personal AS (
    SELECT ((SELECT count(*) FROM public.proprietes) +
            (SELECT count(*) FROM public.community_profiles))::bigint AS total
  ), iot AS (
    SELECT count(*)::bigint AS total FROM public.iot_mesures
  )
  SELECT jsonb_build_array(
    jsonb_build_object('key','works','label','Œuvres : médias, photos, audios, textes','total',w.total,'gaspard',w.gaspard,'association',w.association,'others',w.others,'unattributed',w.unattributed,'third_party',0),
    jsonb_build_object('key','observations','label','Observations factuelles (espèce, lieu, date)','total',o.total,'gaspard',o.gaspard,'association',o.association,'others',o.others,'unattributed',o.unattributed,'third_party',0),
    jsonb_build_object('key','activity','label','Données d’activité associative','total',a.total,'gaspard',0,'association',a.total,'others',0,'unattributed',0,'third_party',0),
    jsonb_build_object('key','snapshots','label','Snapshots biodiversité sous licences ouvertes','total',(SELECT count(*) FROM public.biodiversity_snapshots),'gaspard',0,'association',0,'others',0,'unattributed',0,'third_party',(SELECT count(*) FROM public.biodiversity_snapshots)),
    jsonb_build_object('key','personal','label','Propriétés documentées et profils','total',p.total,'gaspard',0,'association',0,'others',p.total,'unattributed',0,'third_party',0),
    jsonb_build_object('key','iot','label','Mesures techniques des capteurs IoT','total',i.total,'gaspard',0,'association',0,'others',0,'unattributed',0,'third_party',0)
  )
  INTO v_categories
  FROM works w CROSS JOIN observations o CROSS JOIN activity a CROSS JOIN personal p CROSS JOIN iot i;

  WITH attribution_rows AS (
    SELECT lower(a->>'observerLogin') AS observer_login
    FROM public.biodiversity_snapshots s
    CROSS JOIN LATERAL jsonb_array_elements(
      CASE WHEN jsonb_typeof(s.species_data) = 'array' THEN s.species_data ELSE '[]'::jsonb END
    ) species
    CROSS JOIN LATERAL jsonb_array_elements(
      CASE WHEN jsonb_typeof(species->'attributions') = 'array' THEN species->'attributions' ELSE '[]'::jsonb END
    ) a
  ), per_snapshot AS (
    SELECT s.id,
           EXISTS (
             SELECT 1
             FROM jsonb_array_elements(
               CASE WHEN jsonb_typeof(s.species_data) = 'array' THEN s.species_data ELSE '[]'::jsonb END
             ) species
             CROSS JOIN LATERAL jsonb_array_elements(
               CASE WHEN jsonb_typeof(species->'attributions') = 'array' THEN species->'attributions' ELSE '[]'::jsonb END
             ) a
             WHERE lower(a->>'observerLogin') NOT IN ('gaspardboreal','les-marches-du-vivant')
           ) AS has_third_party
    FROM public.biodiversity_snapshots s
  )
  SELECT (SELECT count(*) FROM attribution_rows),
         (SELECT count(*) FROM attribution_rows WHERE observer_login NOT IN ('gaspardboreal','les-marches-du-vivant')),
         count(*) FILTER (WHERE has_third_party)
  INTO v_snapshot_attributions, v_snapshot_third_party, v_snapshots_with_third_party
  FROM per_snapshot;

  WITH contributions AS (
    SELECT COALESCE(em_author.user_id, m.user_id) AS uid
    FROM public.marcheur_medias m
    LEFT JOIN public.exploration_marcheurs em_author ON em_author.id = m.attributed_marcheur_id
    UNION ALL
    SELECT COALESCE(t.attributed_user_id, em_author.user_id, t.user_id)
    FROM public.marcheur_textes t
    LEFT JOIN public.exploration_marcheurs em_author ON em_author.id = t.attributed_marcheur_id
    UNION ALL
    SELECT COALESCE(em_author.user_id, a.user_id)
    FROM public.marcheur_audio a
    LEFT JOIN public.exploration_marcheurs em_author ON em_author.id = a.attributed_marcheur_id
    UNION ALL
    SELECT em.user_id
    FROM public.marcheur_observations o
    JOIN public.exploration_marcheurs em ON em.id = o.marcheur_id
  ), per_person AS (
    SELECT uid, count(*)::bigint AS total
    FROM contributions
    WHERE uid IS NOT NULL
    GROUP BY uid
  ), ranked AS (
    SELECT p.uid, p.total,
           CASE WHEN p.uid = v_a_user THEN 'Les marches du Vivant'
                ELSE COALESCE(NULLIF(trim(cp.prenom),''),'Marcheur') || COALESCE(' ' || left(NULLIF(trim(cp.nom),''),1) || '.','') END AS nom,
           CASE WHEN p.uid = v_g_user THEN 'gaspard'
                WHEN p.uid = v_a_user THEN 'association'
                ELSE 'autre' END AS role
    FROM per_person p
    LEFT JOIN public.community_profiles cp ON cp.user_id = p.uid
    ORDER BY p.total DESC
  )
  SELECT (SELECT COALESCE(sum(total),0) FROM per_person),
         COALESCE((SELECT jsonb_agg(jsonb_build_object('nom',nom,'total',total,'role',role) ORDER BY total DESC) FROM (SELECT * FROM ranked LIMIT 10) top_ten),'[]'::jsonb)
  INTO v_top_base, v_top;

  RETURN jsonb_build_object(
    'categories', v_categories,
    'top_marcheurs', v_top,
    'top_base', COALESCE(v_top_base,0),
    'snapshot_attributions', COALESCE(v_snapshot_attributions,0),
    'snapshot_third_party_attributions', COALESCE(v_snapshot_third_party,0),
    'snapshots_with_third_party', COALESCE(v_snapshots_with_third_party,0),
    'computed_at', now()
  );
END;
$function$;

REVOKE ALL ON FUNCTION public.get_data_asset_stats() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_data_asset_stats() FROM anon;
GRANT EXECUTE ON FUNCTION public.get_data_asset_stats() TO authenticated;