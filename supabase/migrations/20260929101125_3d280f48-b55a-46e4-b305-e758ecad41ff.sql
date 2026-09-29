ALTER TABLE public.marche_photos ADD COLUMN IF NOT EXISTS author_user_id uuid, ADD COLUMN IF NOT EXISTS attributed_at timestamptz, ADD COLUMN IF NOT EXISTS attributed_by uuid;
ALTER TABLE public.marche_audio ADD COLUMN IF NOT EXISTS author_user_id uuid, ADD COLUMN IF NOT EXISTS attributed_at timestamptz, ADD COLUMN IF NOT EXISTS attributed_by uuid;

CREATE TABLE public.media_author_attribution_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  media_kind text NOT NULL,
  media_id uuid NOT NULL,
  old_author uuid,
  new_author uuid,
  done_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.media_author_attribution_log TO authenticated;
GRANT ALL ON public.media_author_attribution_log TO service_role;
ALTER TABLE public.media_author_attribution_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read attribution log" ON public.media_author_attribution_log FOR SELECT TO authenticated USING (public.check_is_admin_user(auth.uid()));

CREATE OR REPLACE FUNCTION public.list_marche_media_for_attribution()
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF NOT public.check_is_admin_user(auth.uid()) THEN RAISE EXCEPTION 'Accès réservé aux administrateurs'; END IF;
  RETURN COALESCE((SELECT jsonb_agg(row_to_json(x) ORDER BY x.marche_date DESC NULLS LAST, x.ordre) FROM (
    SELECT 'photo'::text kind, p.id, p.marche_id, p.url_supabase url, p.titre, p.nom_fichier, p.ordre, p.created_at,
      p.author_user_id, p.attributed_at, m.nom_marche, m.ville, m.date marche_date,
      CASE WHEN cp.user_id IS NOT NULL THEN trim(coalesce(cp.prenom,'')||' '||coalesce(cp.nom,'')) END author_name
    FROM marche_photos p LEFT JOIN marches m ON m.id=p.marche_id LEFT JOIN community_profiles cp ON cp.user_id=p.author_user_id
    UNION ALL
    SELECT 'audio', a.id, a.marche_id, a.url_supabase, a.titre, a.nom_fichier, a.ordre, a.created_at,
      a.author_user_id, a.attributed_at, m.nom_marche, m.ville, m.date,
      CASE WHEN cp.user_id IS NOT NULL THEN trim(coalesce(cp.prenom,'')||' '||coalesce(cp.nom,'')) END
    FROM marche_audio a LEFT JOIN marches m ON m.id=a.marche_id LEFT JOIN community_profiles cp ON cp.user_id=a.author_user_id
  ) x), '[]'::jsonb);
END $$;

CREATE OR REPLACE FUNCTION public.list_attribution_candidates()
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF NOT public.check_is_admin_user(auth.uid()) THEN RAISE EXCEPTION 'Accès réservé aux administrateurs'; END IF;
  RETURN COALESCE((SELECT jsonb_agg(jsonb_build_object(
      'user_id', cp.user_id,
      'name', trim(coalesce(cp.prenom,'')||' '||coalesce(cp.nom,'')),
      'avatar_url', cp.avatar_url,
      'marche_ids', COALESCE((SELECT jsonb_agg(DISTINCT xm.marche_id) FROM exploration_marcheurs em JOIN exploration_marches xm ON xm.exploration_id=em.exploration_id WHERE em.user_id=cp.user_id),'[]'::jsonb)
    ) ORDER BY cp.prenom, cp.nom) FROM community_profiles cp WHERE cp.user_id IS NOT NULL), '[]'::jsonb);
END $$;

CREATE OR REPLACE FUNCTION public.assign_marche_media_author(_kind text, _ids uuid[], _user_id uuid)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE n integer;
BEGIN
  IF NOT public.check_is_admin_user(auth.uid()) THEN RAISE EXCEPTION 'Accès réservé aux administrateurs'; END IF;
  IF _kind = 'photo' THEN
    INSERT INTO media_author_attribution_log(media_kind,media_id,old_author,new_author,done_by)
      SELECT 'photo', id, author_user_id, _user_id, auth.uid() FROM marche_photos WHERE id = ANY(_ids);
    UPDATE marche_photos SET author_user_id=_user_id, attributed_at=CASE WHEN _user_id IS NULL THEN NULL ELSE now() END, attributed_by=auth.uid() WHERE id = ANY(_ids);
  ELSIF _kind = 'audio' THEN
    INSERT INTO media_author_attribution_log(media_kind,media_id,old_author,new_author,done_by)
      SELECT 'audio', id, author_user_id, _user_id, auth.uid() FROM marche_audio WHERE id = ANY(_ids);
    UPDATE marche_audio SET author_user_id=_user_id, attributed_at=CASE WHEN _user_id IS NULL THEN NULL ELSE now() END, attributed_by=auth.uid() WHERE id = ANY(_ids);
  ELSE RAISE EXCEPTION 'Type inconnu'; END IF;
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n;
END $$;

REVOKE ALL ON FUNCTION public.list_marche_media_for_attribution() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.list_attribution_candidates() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.assign_marche_media_author(text,uuid[],uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.list_marche_media_for_attribution() TO authenticated;
GRANT EXECUTE ON FUNCTION public.list_attribution_candidates() TO authenticated;
GRANT EXECUTE ON FUNCTION public.assign_marche_media_author(text,uuid[],uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.get_data_asset_stats()
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public' AS $function$
DECLARE
  v_g_user uuid; v_a_user uuid; v_categories jsonb; v_top jsonb; v_top_base bigint;
  v_snapshot_attributions bigint; v_snapshot_third_party bigint; v_snapshots_with_third_party bigint;
BEGIN
  IF NOT public.check_is_admin_user(auth.uid()) THEN RAISE EXCEPTION 'Accès réservé aux administrateurs'; END IF;
  SELECT user_id INTO v_g_user FROM public.community_profiles WHERE lower(nom)='boreal' AND lower(prenom)='gaspard' LIMIT 1;
  SELECT user_id INTO v_a_user FROM public.community_profiles WHERE lower(nom)='du vivant' AND lower(prenom)='les marches' LIMIT 1;

  WITH work_rows AS (
    SELECT COALESCE(em.user_id, m.user_id) AS author_id FROM public.marcheur_medias m LEFT JOIN public.exploration_marcheurs em ON em.id=m.attributed_marcheur_id
    UNION ALL SELECT COALESCE(t.attributed_user_id, em.user_id, t.user_id) FROM public.marcheur_textes t LEFT JOIN public.exploration_marcheurs em ON em.id=t.attributed_marcheur_id
    UNION ALL SELECT COALESCE(em.user_id, a.user_id) FROM public.marcheur_audio a LEFT JOIN public.exploration_marcheurs em ON em.id=a.attributed_marcheur_id
    UNION ALL SELECT author_user_id FROM public.marche_photos
    UNION ALL SELECT author_user_id FROM public.marche_audio
  ), works AS (
    SELECT count(*)::bigint total,
      count(*) FILTER (WHERE author_id=v_g_user)::bigint gaspard,
      count(*) FILTER (WHERE author_id=v_a_user)::bigint association,
      count(*) FILTER (WHERE author_id IS NOT NULL AND author_id<>v_g_user AND author_id<>v_a_user)::bigint others,
      count(*) FILTER (WHERE author_id IS NULL)::bigint unattributed
    FROM work_rows
  ), observations AS (
    SELECT count(*)::bigint total,
      count(*) FILTER (WHERE em.user_id=v_g_user)::bigint gaspard,
      count(*) FILTER (WHERE em.user_id=v_a_user)::bigint association,
      count(*) FILTER (WHERE em.user_id IS NOT NULL AND em.user_id<>v_g_user AND em.user_id<>v_a_user)::bigint others,
      count(*) FILTER (WHERE em.user_id IS NULL)::bigint unattributed
    FROM public.marcheur_observations o JOIN public.exploration_marcheurs em ON em.id=o.marcheur_id
  ), activity AS (
    SELECT ((SELECT count(*) FROM public.marches)+(SELECT count(*) FROM public.marche_events)+(SELECT count(*) FROM public.marche_participations)+(SELECT count(*) FROM public.exploration_waypoints))::bigint total
  ), personal AS (
    SELECT ((SELECT count(*) FROM public.proprietes)+(SELECT count(*) FROM public.community_profiles))::bigint total
  ), iot AS (SELECT count(*)::bigint total FROM public.iot_mesures)
  SELECT jsonb_build_array(
    jsonb_build_object('key','works','label','Œuvres : médias, photos, audios, textes','total',w.total,'gaspard',w.gaspard,'association',w.association,'others',w.others,'unattributed',w.unattributed,'third_party',0),
    jsonb_build_object('key','observations','label','Observations factuelles (espèce, lieu, date)','total',o.total,'gaspard',o.gaspard,'association',o.association,'others',o.others,'unattributed',o.unattributed,'third_party',0),
    jsonb_build_object('key','activity','label','Données d’activité associative','total',a.total,'gaspard',0,'association',a.total,'others',0,'unattributed',0,'third_party',0),
    jsonb_build_object('key','snapshots','label','Snapshots biodiversité sous licences ouvertes','total',(SELECT count(*) FROM public.biodiversity_snapshots),'gaspard',0,'association',0,'others',0,'unattributed',0,'third_party',(SELECT count(*) FROM public.biodiversity_snapshots)),
    jsonb_build_object('key','personal','label','Propriétés documentées et profils','total',p.total,'gaspard',0,'association',0,'others',p.total,'unattributed',0,'third_party',0),
    jsonb_build_object('key','iot','label','Mesures techniques des capteurs IoT','total',i.total,'gaspard',0,'association',0,'others',0,'unattributed',0,'third_party',0)
  ) INTO v_categories
  FROM works w CROSS JOIN observations o CROSS JOIN activity a CROSS JOIN personal p CROSS JOIN iot i;

  WITH attribution_rows AS (
    SELECT lower(a->>'observerLogin') observer_login FROM public.biodiversity_snapshots s
    CROSS JOIN LATERAL jsonb_array_elements(CASE WHEN jsonb_typeof(s.species_data)='array' THEN s.species_data ELSE '[]'::jsonb END) species
    CROSS JOIN LATERAL jsonb_array_elements(CASE WHEN jsonb_typeof(species->'attributions')='array' THEN species->'attributions' ELSE '[]'::jsonb END) a
  ), per_snapshot AS (
    SELECT s.id, EXISTS (SELECT 1 FROM jsonb_array_elements(CASE WHEN jsonb_typeof(s.species_data)='array' THEN s.species_data ELSE '[]'::jsonb END) species
      CROSS JOIN LATERAL jsonb_array_elements(CASE WHEN jsonb_typeof(species->'attributions')='array' THEN species->'attributions' ELSE '[]'::jsonb END) a
      WHERE lower(a->>'observerLogin') NOT IN ('gaspardboreal','les-marches-du-vivant')) has_third_party
    FROM public.biodiversity_snapshots s
  )
  SELECT (SELECT count(*) FROM attribution_rows),
         (SELECT count(*) FROM attribution_rows WHERE observer_login NOT IN ('gaspardboreal','les-marches-du-vivant')),
         count(*) FILTER (WHERE has_third_party)
  INTO v_snapshot_attributions, v_snapshot_third_party, v_snapshots_with_third_party FROM per_snapshot;

  WITH contributions AS (
    SELECT COALESCE(e.user_id, m.user_id) uid FROM public.marcheur_medias m LEFT JOIN public.exploration_marcheurs e ON e.id=m.attributed_marcheur_id
    UNION ALL SELECT COALESCE(t.attributed_user_id, e.user_id, t.user_id) FROM public.marcheur_textes t LEFT JOIN public.exploration_marcheurs e ON e.id=t.attributed_marcheur_id
    UNION ALL SELECT COALESCE(e.user_id, a.user_id) FROM public.marcheur_audio a LEFT JOIN public.exploration_marcheurs e ON e.id=a.attributed_marcheur_id
    UNION ALL SELECT em.user_id FROM public.marcheur_observations o JOIN public.exploration_marcheurs em ON em.id=o.marcheur_id
    UNION ALL SELECT author_user_id FROM public.marche_photos
    UNION ALL SELECT author_user_id FROM public.marche_audio
  ), per_person AS (
    SELECT uid, count(*)::bigint total FROM contributions WHERE uid IS NOT NULL GROUP BY uid
  ), ranked AS (
    SELECT p.uid, p.total,
      CASE WHEN p.uid=v_a_user THEN 'Les marches du Vivant' ELSE COALESCE(NULLIF(trim(cp.prenom),''),'Marcheur')||COALESCE(' '||left(NULLIF(trim(cp.nom),''),1)||'.','') END nom,
      CASE WHEN p.uid=v_g_user THEN 'gaspard' WHEN p.uid=v_a_user THEN 'association' ELSE 'autre' END role
    FROM per_person p LEFT JOIN public.community_profiles cp ON cp.user_id=p.uid ORDER BY p.total DESC
  )
  SELECT (SELECT COALESCE(sum(total),0) FROM per_person),
    COALESCE((SELECT jsonb_agg(jsonb_build_object('nom',nom,'total',total,'role',role) ORDER BY total DESC) FROM (SELECT * FROM ranked LIMIT 10) t),'[]'::jsonb)
  INTO v_top_base, v_top;

  RETURN jsonb_build_object('categories',v_categories,'top_marcheurs',v_top,'top_base',COALESCE(v_top_base,0),
    'snapshot_attributions',COALESCE(v_snapshot_attributions,0),'snapshot_third_party_attributions',COALESCE(v_snapshot_third_party,0),
    'snapshots_with_third_party',COALESCE(v_snapshots_with_third_party,0),'computed_at',now());
END;
$function$;
REVOKE ALL ON FUNCTION public.get_data_asset_stats() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_data_asset_stats() TO authenticated;