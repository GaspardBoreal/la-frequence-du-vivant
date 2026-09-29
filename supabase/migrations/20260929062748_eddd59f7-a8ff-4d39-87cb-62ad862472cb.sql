CREATE OR REPLACE FUNCTION public.get_data_asset_stats()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_gaspard_user uuid;
  v_gaspard_profile uuid;
  v_deviat_propriete uuid;
  v_families jsonb;
  v_total bigint;
  v_attributed bigint;
BEGIN
  IF NOT public.check_is_admin_user(auth.uid()) THEN
    RAISE EXCEPTION 'Accès réservé aux administrateurs';
  END IF;

  SELECT id, user_id INTO v_gaspard_profile, v_gaspard_user
  FROM public.community_profiles
  WHERE lower(nom) = 'boreal' AND lower(prenom) = 'gaspard'
  LIMIT 1;

  SELECT pm.propriete_id INTO v_deviat_propriete
  FROM public.propriete_marcheurs pm
  WHERE pm.community_profile_id = v_gaspard_profile
    AND pm.is_main = true
    AND pm.role = 'proprietaire'
  LIMIT 1;

  WITH fams AS (
    SELECT 'mesures_capteurs_iot'::text AS famille,
           (SELECT count(*) FROM public.iot_mesures) AS total,
           (SELECT count(*) FROM public.iot_mesures m
              JOIN public.iot_capteurs c ON c.id = m.capteur_id
             WHERE c.propriete_id = v_deviat_propriete) AS attribue
    UNION ALL
    SELECT 'observations_marcheurs',
           (SELECT count(*) FROM public.marcheur_observations),
           (SELECT count(*) FROM public.marcheur_observations)
    UNION ALL
    SELECT 'dont_observations_gaspard',
           0,
           (SELECT count(*) FROM public.marcheur_observations o
              JOIN public.exploration_marcheurs em ON em.id = o.marcheur_id
             WHERE em.user_id = v_gaspard_user)
    UNION ALL
    SELECT 'medias_marcheurs',
           (SELECT count(*) FROM public.marcheur_medias),
           (SELECT count(*) FROM public.marcheur_medias)
    UNION ALL
    SELECT 'dont_medias_gaspard',
           0,
           (SELECT count(*) FROM public.marcheur_medias WHERE user_id = v_gaspard_user)
    UNION ALL
    SELECT 'snapshots_biodiversite',
           (SELECT count(*) FROM public.biodiversity_snapshots),
           (SELECT count(*) FROM public.biodiversity_snapshots)
    UNION ALL
    SELECT 'photos_marches',
           (SELECT count(*) FROM public.marche_photos),
           (SELECT count(*) FROM public.marche_photos)
    UNION ALL
    SELECT 'marches',
           (SELECT count(*) FROM public.marches),
           (SELECT count(*) FROM public.marches)
    UNION ALL
    SELECT 'evenements',
           (SELECT count(*) FROM public.marche_events),
           (SELECT count(*) FROM public.marche_events)
    UNION ALL
    SELECT 'dont_evenements_crees_gaspard',
           0,
           (SELECT count(*) FROM public.marche_events WHERE created_by = v_gaspard_user)
    UNION ALL
    SELECT 'participations',
           (SELECT count(*) FROM public.marche_participations),
           (SELECT count(*) FROM public.marche_participations)
    UNION ALL
    SELECT 'dont_participations_gaspard',
           0,
           (SELECT count(*) FROM public.marche_participations WHERE user_id = v_gaspard_user)
    UNION ALL
    SELECT 'waypoints_exploration',
           (SELECT count(*) FROM public.exploration_waypoints),
           (SELECT count(*) FROM public.exploration_waypoints)
    UNION ALL
    SELECT 'audios_marches',
           (SELECT count(*) FROM public.marche_audio),
           (SELECT count(*) FROM public.marche_audio)
    UNION ALL
    SELECT 'textes_marcheurs',
           (SELECT count(*) FROM public.marcheur_textes),
           (SELECT count(*) FROM public.marcheur_textes)
    UNION ALL
    SELECT 'profils_communaute_exclus',
           (SELECT count(*) FROM public.community_profiles),
           0
    UNION ALL
    SELECT 'proprietes',
           (SELECT count(*) FROM public.proprietes),
           (SELECT count(*) FROM public.proprietes p
              JOIN public.propriete_marcheurs pm ON pm.propriete_id = p.id
             WHERE pm.community_profile_id = v_gaspard_profile
               AND pm.is_main = true AND pm.role = 'proprietaire')
  )
  SELECT jsonb_agg(jsonb_build_object('famille', famille, 'total', total, 'attribue', attribue) ORDER BY famille),
         COALESCE(sum(total), 0),
         COALESCE(sum(attribue), 0)
  INTO v_families, v_total, v_attributed
  FROM fams;

  RETURN jsonb_build_object(
    'familles', v_families,
    'total_general', v_total,
    'total_attribue', v_attributed,
    'ratio_pct', CASE WHEN v_total > 0 THEN round((v_attributed::numeric / v_total::numeric) * 100, 2) ELSE 0 END,
    'computed_at', now()
  );
END;
$$;

REVOKE ALL ON FUNCTION public.get_data_asset_stats() FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_data_asset_stats() TO authenticated;