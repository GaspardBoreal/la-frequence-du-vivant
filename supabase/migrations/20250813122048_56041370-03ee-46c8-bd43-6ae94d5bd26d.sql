-- Créer une fonction SQL optimisée pour récupérer les top espèces
-- Cette fonction évite le parsing côté client de gros volumes de JSON
CREATE OR REPLACE FUNCTION public.get_top_species_optimized(limit_count integer DEFAULT 10)
RETURNS TABLE(name text, count bigint)
LANGUAGE sql
SECURITY DEFINER
SET search_path = 'public'
AS $$
  WITH species_extracted AS (
    SELECT 
      COALESCE(
        (species->>'commonName'),
        (species->>'scientificName')
      ) as species_name
    FROM biodiversity_snapshots,
         jsonb_array_elements(COALESCE(species_data, '[]'::jsonb)) as species
    WHERE species_data IS NOT NULL 
      AND jsonb_typeof(species_data) = 'array'
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
$$;