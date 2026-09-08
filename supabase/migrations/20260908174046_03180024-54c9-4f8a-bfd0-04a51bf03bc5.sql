CREATE TABLE IF NOT EXISTS public.api_mcp_checks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL,
  checked_at timestamptz NOT NULL DEFAULT now(),
  backlog integer,
  note text
);

GRANT SELECT ON public.api_mcp_checks TO authenticated;
GRANT ALL ON public.api_mcp_checks TO service_role;

ALTER TABLE public.api_mcp_checks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read api_mcp_checks"
  ON public.api_mcp_checks FOR SELECT
  USING (public.is_admin_user());

CREATE INDEX IF NOT EXISTS idx_api_mcp_checks_slug_date
  ON public.api_mcp_checks (slug, checked_at DESC);

CREATE OR REPLACE FUNCTION public.count_species_awaiting_eco_tags()
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::int
  FROM (
    SELECT DISTINCT btrim(sp->>'scientificName') AS scientific_name
    FROM public.biodiversity_snapshots s
    CROSS JOIN LATERAL jsonb_array_elements(
      CASE WHEN jsonb_typeof(s.species_data) = 'array' THEN s.species_data ELSE '[]'::jsonb END
    ) AS sp
    WHERE COALESCE(btrim(sp->>'scientificName'), '') <> ''
  ) t
  WHERE NOT EXISTS (
    SELECT 1 FROM public.species_eco_tags_kb k
    WHERE k.scientific_name = t.scientific_name
  );
$$;

GRANT EXECUTE ON FUNCTION public.count_species_awaiting_eco_tags() TO authenticated, service_role;