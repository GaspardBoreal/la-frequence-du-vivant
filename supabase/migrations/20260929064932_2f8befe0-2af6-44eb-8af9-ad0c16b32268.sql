CREATE OR REPLACE FUNCTION public.get_data_asset_stats()
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_g_user uuid; v_g_profile uuid; v_a_user uuid; v_deviat uuid;
  v_families jsonb; v_total bigint; v_attr bigint; v_top jsonb; v_base bigint;
BEGIN
  IF NOT public.check_is_admin_user(auth.uid()) THEN RAISE EXCEPTION 'Accès réservé aux administrateurs'; END IF;
  SELECT id, user_id INTO v_g_profile, v_g_user FROM community_profiles WHERE lower(nom)='boreal' AND lower(prenom)='gaspard' LIMIT 1;
  SELECT user_id INTO v_a_user FROM community_profiles WHERE lower(nom)='du vivant' AND lower(prenom)='les marches' LIMIT 1;
  SELECT pm.propriete_id INTO v_deviat FROM propriete_marcheurs pm WHERE pm.community_profile_id=v_g_profile AND pm.is_main AND pm.role='proprietaire' LIMIT 1;

  WITH attrs AS (
    SELECT lower(a->>'observerLogin') ol FROM biodiversity_snapshots s,
      jsonb_array_elements(CASE WHEN jsonb_typeof(s.species_data)='array' THEN s.species_data ELSE '[]' END) e,
      jsonb_array_elements(CASE WHEN jsonb_typeof(e->'attributions')='array' THEN e->'attributions' ELSE '[]' END) a
  ), fams AS (
    SELECT 'mesures_capteurs_iot'::text famille, (SELECT count(*) FROM iot_mesures) total,
      (SELECT count(*) FROM iot_mesures m JOIN iot_capteurs c ON c.id=m.capteur_id WHERE c.propriete_id=v_deviat) attribue, true cnt
    UNION ALL SELECT 'observations_marcheurs',(SELECT count(*) FROM marcheur_observations),(SELECT count(*) FROM marcheur_observations),true
    UNION ALL SELECT 'dont_observations_gaspard',0,(SELECT count(*) FROM marcheur_observations o JOIN exploration_marcheurs em ON em.id=o.marcheur_id WHERE em.user_id=v_g_user),true
    UNION ALL SELECT 'dont_observations_association',0,(SELECT count(*) FROM marcheur_observations o JOIN exploration_marcheurs em ON em.id=o.marcheur_id WHERE em.user_id=v_a_user),false
    UNION ALL SELECT 'medias_marcheurs',(SELECT count(*) FROM marcheur_medias),(SELECT count(*) FROM marcheur_medias),true
    UNION ALL SELECT 'dont_medias_gaspard',0,(SELECT count(*) FROM marcheur_medias WHERE user_id=v_g_user),true
    UNION ALL SELECT 'dont_medias_association',0,(SELECT count(*) FROM marcheur_medias WHERE user_id=v_a_user),false
    UNION ALL SELECT 'snapshots_biodiversite',(SELECT count(*) FROM biodiversity_snapshots),(SELECT count(*) FROM biodiversity_snapshots),true
    UNION ALL SELECT 'dont_snapshots_attr_total',0,(SELECT count(*) FROM attrs),false
    UNION ALL SELECT 'dont_snapshots_gaspard',0,(SELECT count(*) FROM attrs WHERE ol='gaspardboreal'),false
    UNION ALL SELECT 'dont_snapshots_association',0,(SELECT count(*) FROM attrs WHERE ol='les-marches-du-vivant'),false
    UNION ALL SELECT 'photos_marches',(SELECT count(*) FROM marche_photos),(SELECT count(*) FROM marche_photos),true
    UNION ALL SELECT 'dont_photos_association',0,(SELECT count(*) FROM marche_photos),false
    UNION ALL SELECT 'marches',(SELECT count(*) FROM marches),(SELECT count(*) FROM marches),true
    UNION ALL SELECT 'evenements',(SELECT count(*) FROM marche_events),(SELECT count(*) FROM marche_events),true
    UNION ALL SELECT 'dont_evenements_crees_gaspard',0,(SELECT count(*) FROM marche_events WHERE created_by=v_g_user),true
    UNION ALL SELECT 'participations',(SELECT count(*) FROM marche_participations),(SELECT count(*) FROM marche_participations),true
    UNION ALL SELECT 'dont_participations_gaspard',0,(SELECT count(*) FROM marche_participations WHERE user_id=v_g_user),true
    UNION ALL SELECT 'waypoints_exploration',(SELECT count(*) FROM exploration_waypoints),(SELECT count(*) FROM exploration_waypoints),true
    UNION ALL SELECT 'audios_marches',(SELECT count(*) FROM marche_audio),(SELECT count(*) FROM marche_audio),true
    UNION ALL SELECT 'dont_audios_association',0,(SELECT count(*) FROM marche_audio),false
    UNION ALL SELECT 'textes_marcheurs',(SELECT count(*) FROM marcheur_textes),(SELECT count(*) FROM marcheur_textes),true
    UNION ALL SELECT 'profils_communaute_exclus',(SELECT count(*) FROM community_profiles),0,true
    UNION ALL SELECT 'proprietes',(SELECT count(*) FROM proprietes),
      (SELECT count(*) FROM proprietes p JOIN propriete_marcheurs pm ON pm.propriete_id=p.id WHERE pm.community_profile_id=v_g_profile AND pm.is_main AND pm.role='proprietaire'),true
  )
  SELECT jsonb_agg(jsonb_build_object('famille',famille,'total',total,'attribue',attribue)),
         COALESCE(sum(total) FILTER (WHERE cnt),0), COALESCE(sum(attribue) FILTER (WHERE cnt),0)
  INTO v_families, v_total, v_attr FROM fams;

  WITH contrib AS (
    SELECT em.user_id uid FROM marcheur_observations o JOIN exploration_marcheurs em ON em.id=o.marcheur_id WHERE em.user_id IS NOT NULL
    UNION ALL SELECT user_id FROM marcheur_medias WHERE user_id IS NOT NULL
    UNION ALL SELECT user_id FROM marcheur_textes WHERE user_id IS NOT NULL
    UNION ALL SELECT user_id FROM marcheur_audio WHERE user_id IS NOT NULL
  ), per AS (SELECT uid, count(*) n FROM contrib GROUP BY uid)
  SELECT (SELECT sum(n) FROM per),
    (SELECT jsonb_agg(jsonb_build_object('nom', t.nom, 'total', t.n, 'role', t.role) ORDER BY t.n DESC) FROM (
      SELECT p.n,
        CASE WHEN p.uid=v_a_user THEN 'Les marches du Vivant'
             ELSE COALESCE(NULLIF(trim(cp.prenom),''),'Marcheur') || COALESCE(' '||left(NULLIF(trim(cp.nom),''),1)||'.','') END nom,
        CASE WHEN p.uid=v_g_user THEN 'gaspard' WHEN p.uid=v_a_user THEN 'association' ELSE 'autre' END role
      FROM per p LEFT JOIN community_profiles cp ON cp.user_id=p.uid ORDER BY p.n DESC LIMIT 10) t)
  INTO v_base, v_top;

  RETURN jsonb_build_object('familles',v_families,'total_general',v_total,'total_attribue',v_attr,
    'ratio_pct', CASE WHEN v_total>0 THEN round(v_attr::numeric/v_total*100,2) ELSE 0 END,
    'top_marcheurs', COALESCE(v_top,'[]'::jsonb), 'top_base', COALESCE(v_base,0), 'computed_at', now());
END; $$;
REVOKE ALL ON FUNCTION public.get_data_asset_stats() FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_data_asset_stats() TO authenticated;