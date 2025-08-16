-- Improved function that filters out orphan biodiversity data
CREATE OR REPLACE FUNCTION public.get_top_species_optimized(limit_count integer DEFAULT 10)
 RETURNS TABLE(name text, count bigint)
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  WITH species_extracted AS (
    SELECT 
      COALESCE(
        (species->>'commonName'),
        (species->>'scientificName')
      ) as species_name
    FROM biodiversity_snapshots bs
    INNER JOIN marches m ON bs.marche_id = m.id  -- Only include snapshots with valid marches
    ,jsonb_array_elements(COALESCE(bs.species_data, '[]'::jsonb)) as species
    WHERE bs.species_data IS NOT NULL 
      AND jsonb_typeof(bs.species_data) = 'array'
      AND (species->>'commonName' IS NOT NULL OR species->>'scientificName' IS NOT NULL)
  )
  SELECT 
    species_name as name,
    COUNT(*) as count
  FROM species_extracted
  WHERE species_name IS NOT NULL
  GROUP BY species_name
  ORDER BY count DESC
  LIMIT limit_count;
$function$