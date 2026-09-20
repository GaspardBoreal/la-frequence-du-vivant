CREATE OR REPLACE FUNCTION public.get_gardens_public_map()
RETURNS TABLE (
  garden_key text,
  approximate_latitude double precision,
  approximate_longitude double precision,
  garden_type text,
  surface_m2 integer,
  species_count integer,
  soil_analyses_count integer,
  soil_type text,
  garden_tours_count integer,
  completed_projects_count integer
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, extensions
AS $$
  SELECT
    md5(p.id::text) AS garden_key,
    p.latitude
      + (0.004 + (abs(hashtextextended(p.id::text, 11) % 1001)::double precision / 1000.0) * 0.004)
      * CASE WHEN hashtextextended(p.id::text, 17) % 2 = 0 THEN 1 ELSE -1 END
      AS approximate_latitude,
    p.longitude
      + (0.006 + (abs(hashtextextended(p.id::text, 23) % 1001)::double precision / 1000.0) * 0.006)
      * CASE WHEN hashtextextended(p.id::text, 29) % 2 = 0 THEN 1 ELSE -1 END
      AS approximate_longitude,
    coalesce(
      nullif(p.onboarding_preferences->'garden_example'->>'titre', ''),
      nullif(p.onboarding_preferences->'garden_example'->>'title', ''),
      nullif(p.onboarding_preferences->'style'->>'example_title', ''),
      nullif(p.onboarding_preferences->'answers'->>'style', '')
    ) AS garden_type,
    coalesce(
      CASE
        WHEN replace(p.onboarding_preferences->'answers'->>'surface_totale', ',', '.') ~ '^[0-9]+([.][0-9]+)?$'
          THEN round(replace(p.onboarding_preferences->'answers'->>'surface_totale', ',', '.')::numeric)::integer
        ELSE NULL
      END,
      CASE WHEN p.surface_hectares IS NOT NULL THEN round(p.surface_hectares * 10000)::integer END
    ) AS surface_m2,
    coalesce((public.get_propriete_biodiversity(p.id)->>'speciesTotal')::integer, 0) AS species_count,
    CASE WHEN sd.id IS NULL OR sd.completed_at IS NULL THEN 0 ELSE 1 END AS soil_analyses_count,
    coalesce(
      nullif(sd.texture, ''),
      nullif(sd.structure, ''),
      nullif(sd.terrain_status, ''),
      (
        SELECT nullif(sample->>'texture_result', '')
        FROM jsonb_array_elements(
          CASE WHEN jsonb_typeof(sd.samples) = 'array' THEN sd.samples ELSE '[]'::jsonb END
        ) sample
        WHERE nullif(sample->>'texture_result', '') IS NOT NULL
        LIMIT 1
      )
    ) AS soil_type,
    (SELECT count(*)::integer FROM public.propriete_tours t WHERE t.propriete_id = p.id) AS garden_tours_count,
    (
      SELECT count(*)::integer
      FROM public.propriete_chantiers c
      WHERE c.propriete_id = p.id
        AND lower(c.statut) IN ('termine', 'terminee', 'terminé', 'terminée', 'realise', 'realisee', 'réalisé', 'réalisée')
    ) AS completed_projects_count
  FROM public.proprietes p
  LEFT JOIN public.propriete_soil_diagnostics sd ON sd.propriete_id = p.id
  WHERE auth.uid() IS NOT NULL
    AND p.is_active IS TRUE
    AND p.latitude IS NOT NULL
    AND p.longitude IS NOT NULL
  ORDER BY p.created_at;
$$;

REVOKE ALL ON FUNCTION public.get_gardens_public_map() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_gardens_public_map() FROM anon;
GRANT EXECUTE ON FUNCTION public.get_gardens_public_map() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_gardens_public_map() TO service_role;