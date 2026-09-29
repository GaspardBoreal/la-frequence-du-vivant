CREATE OR REPLACE FUNCTION public.list_marche_media_for_attribution()
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF NOT public.check_is_admin_user(auth.uid()) THEN RAISE EXCEPTION 'Accès réservé aux administrateurs'; END IF;
  RETURN COALESCE((SELECT jsonb_agg(row_to_json(x) ORDER BY x.marche_date DESC NULLS LAST, x.ordre) FROM (
    SELECT 'photo'::text kind, p.id, p.marche_id, p.url_supabase url, p.titre, p.nom_fichier, p.ordre, p.created_at,
      p.author_user_id, p.attributed_at, m.nom_marche, m.ville, m.date marche_date,
      CASE WHEN cp.user_id IS NOT NULL THEN trim(coalesce(cp.prenom,'')||' '||coalesce(cp.nom,'')) END author_name,
      NULL::text format_audio, NULL::bigint taille_octets
    FROM marche_photos p LEFT JOIN marches m ON m.id=p.marche_id LEFT JOIN community_profiles cp ON cp.user_id=p.author_user_id
    UNION ALL
    SELECT 'audio', a.id, a.marche_id, a.url_supabase, a.titre, a.nom_fichier, a.ordre, a.created_at,
      a.author_user_id, a.attributed_at, m.nom_marche, m.ville, m.date,
      CASE WHEN cp.user_id IS NOT NULL THEN trim(coalesce(cp.prenom,'')||' '||coalesce(cp.nom,'')) END,
      a.format_audio, a.taille_octets
    FROM marche_audio a LEFT JOIN marches m ON m.id=a.marche_id LEFT JOIN community_profiles cp ON cp.user_id=a.author_user_id
  ) x), '[]'::jsonb);
END $$;