
-- Unified species count RPC: single source of truth per exploration
-- Dedup key: lower(unaccent(trim(scientific_name))) — strict scientific name
-- Sources: latest biodiversity_snapshot per marche ∪ marcheur_observations

CREATE EXTENSION IF NOT EXISTS unaccent;

CREATE OR REPLACE FUNCTION public.get_exploration_species_count(p_exploration_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
BEGIN
  WITH marche_ids AS (
    SELECT marche_id
    FROM public.exploration_marches
    WHERE exploration_id = p_exploration_id
  ),
  latest_snap AS (
    SELECT DISTINCT ON (bs.marche_id) bs.marche_id, bs.species_data
    FROM public.biodiversity_snapshots bs
    JOIN marche_ids m ON m.marche_id = bs.marche_id
    ORDER BY bs.marche_id, bs.created_at DESC
  ),
  snap_species AS (
    SELECT
      lower(unaccent(trim(coalesce(sp->>'scientificName', sp->>'scientific_name', '')))) AS key,
      coalesce(sp->>'scientificName', sp->>'scientific_name') AS sci,
      coalesce(sp->>'kingdom', 'Unknown') AS kingdom
    FROM latest_snap ls,
         LATERAL jsonb_array_elements(
           CASE WHEN jsonb_typeof(ls.species_data) = 'array' THEN ls.species_data ELSE '[]'::jsonb END
         ) AS sp
  ),
  marcheur_species AS (
    SELECT
      lower(unaccent(trim(coalesce(mo.species_scientific_name, '')))) AS key,
      mo.species_scientific_name AS sci,
      'Unknown'::text AS kingdom
    FROM public.marcheur_observations mo
    JOIN marche_ids m ON m.marche_id = mo.marche_id
    WHERE mo.species_scientific_name IS NOT NULL
      AND trim(mo.species_scientific_name) <> ''
  ),
  unioned AS (
    SELECT key, sci, kingdom, 'snapshot'::text AS source FROM snap_species WHERE key <> ''
    UNION ALL
    SELECT key, sci, kingdom, 'marcheur'::text AS source FROM marcheur_species WHERE key <> ''
  ),
  grouped AS (
    SELECT
      key,
      max(sci) FILTER (WHERE sci IS NOT NULL) AS sci,
      coalesce(
        max(kingdom) FILTER (WHERE kingdom <> 'Unknown'),
        'Unknown'
      ) AS kingdom,
      bool_or(source = 'snapshot') AS in_snapshot,
      bool_or(source = 'marcheur') AS in_marcheur
    FROM unioned
    GROUP BY key
  )
  SELECT jsonb_build_object(
    'total', (SELECT count(*) FROM grouped),
    'by_kingdom', jsonb_build_object(
      'animalia', (SELECT count(*) FROM grouped WHERE kingdom = 'Animalia'),
      'plantae',  (SELECT count(*) FROM grouped WHERE kingdom = 'Plantae'),
      'fungi',    (SELECT count(*) FROM grouped WHERE kingdom = 'Fungi'),
      'others',   (SELECT count(*) FROM grouped WHERE kingdom NOT IN ('Animalia','Plantae','Fungi'))
    ),
    'by_source', jsonb_build_object(
      'snapshots_only', (SELECT count(*) FROM grouped WHERE in_snapshot AND NOT in_marcheur),
      'marcheur_only',  (SELECT count(*) FROM grouped WHERE in_marcheur AND NOT in_snapshot),
      'both',           (SELECT count(*) FROM grouped WHERE in_snapshot AND in_marcheur)
    ),
    'species', coalesce((
      SELECT jsonb_agg(jsonb_build_object(
        'sci', sci,
        'kingdom', kingdom,
        'in_snapshot', in_snapshot,
        'in_marcheur', in_marcheur
      ) ORDER BY sci)
      FROM grouped
    ), '[]'::jsonb)
  ) INTO result;

  RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_exploration_species_count(uuid) TO anon, authenticated;

-- Ensure realtime broadcasts changes
ALTER TABLE public.marcheur_observations REPLICA IDENTITY FULL;
ALTER TABLE public.biodiversity_snapshots REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'marcheur_observations'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.marcheur_observations';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'biodiversity_snapshots'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.biodiversity_snapshots';
  END IF;
END $$;
