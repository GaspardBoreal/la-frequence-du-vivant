CREATE OR REPLACE FUNCTION public.list_species_awaiting_eco_tags(_limit integer DEFAULT 60)
RETURNS TABLE (scientific_name text, common_name text, iconic_taxon text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT t.scientific_name, t.common_name, t.iconic_taxon
  FROM (
    SELECT DISTINCT ON (btrim(sp->>'scientificName'))
      btrim(sp->>'scientificName') AS scientific_name,
      NULLIF(btrim(COALESCE(sp->>'commonName', '')), '') AS common_name,
      NULLIF(btrim(COALESCE(sp->>'iconicTaxon', '')), '') AS iconic_taxon,
      s.updated_at
    FROM public.biodiversity_snapshots s
    CROSS JOIN LATERAL jsonb_array_elements(
      CASE WHEN jsonb_typeof(s.species_data) = 'array' THEN s.species_data ELSE '[]'::jsonb END
    ) AS sp
    WHERE COALESCE(btrim(sp->>'scientificName'), '') <> ''
    ORDER BY btrim(sp->>'scientificName'), s.updated_at DESC
  ) t
  WHERE NOT EXISTS (
    SELECT 1 FROM public.species_eco_tags_kb k
    WHERE k.scientific_name = t.scientific_name
  )
  ORDER BY t.updated_at DESC
  LIMIT GREATEST(1, LEAST(COALESCE(_limit, 60), 200));
$$;

GRANT EXECUTE ON FUNCTION public.list_species_awaiting_eco_tags(integer) TO authenticated, service_role;