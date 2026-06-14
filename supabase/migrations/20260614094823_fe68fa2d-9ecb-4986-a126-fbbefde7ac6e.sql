
-- ============================================================================
-- Sprint 3 Leviers Commerciaux
-- ============================================================================

-- 1) Table crm_prospect_decks (Levier 1 - Dossier Preuve)
CREATE TABLE IF NOT EXISTS public.crm_prospect_decks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES public.crm_companies(id) ON DELETE CASCADE,
  marche_id uuid REFERENCES public.marche_events(id) ON DELETE SET NULL,
  generated_by uuid,
  file_url text,
  sections jsonb DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'pending',
  error text,
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_prospect_decks TO authenticated;
GRANT ALL ON public.crm_prospect_decks TO service_role;

ALTER TABLE public.crm_prospect_decks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins gerent prospect decks"
  ON public.crm_prospect_decks
  FOR ALL
  USING (is_admin_user())
  WITH CHECK (is_admin_user());

CREATE TRIGGER tg_crm_prospect_decks_updated_at
  BEFORE UPDATE ON public.crm_prospect_decks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2) Add audience_cibles to crm_maronnier_events (Levier 2)
ALTER TABLE public.crm_maronnier_events
  ADD COLUMN IF NOT EXISTS audience_cibles text[] DEFAULT '{}'::text[];

-- ============================================================================
-- 3) RPC: get_maronnier_matches_for_company (Levier 2)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_maronnier_matches_for_company(
  p_company_id uuid,
  p_limit int DEFAULT 5
)
RETURNS TABLE (
  event_id uuid,
  nom text,
  date_debut date,
  date_fin date,
  lieu text,
  region text,
  type text,
  site_url text,
  description text,
  secteurs_naf text[],
  match_score int,
  match_reasons text[]
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_company record;
BEGIN
  IF NOT is_admin_user() THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  SELECT code_naf, region, lifecycle_stage::text AS stage
    INTO v_company
    FROM public.crm_companies
   WHERE id = p_company_id;

  IF v_company IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  WITH scored AS (
    SELECT
      e.id,
      e.nom,
      e.date_debut,
      e.date_fin,
      e.lieu,
      e.region,
      e.type,
      e.site_url,
      e.description,
      e.secteurs_naf,
      (
        CASE
          WHEN v_company.code_naf IS NOT NULL
           AND e.secteurs_naf && ARRAY[
             v_company.code_naf,
             substring(v_company.code_naf from 1 for 3),
             substring(v_company.code_naf from 1 for 2),
             substring(v_company.code_naf from 1 for 1)
           ]
          THEN 100 ELSE 0
        END
        +
        CASE
          WHEN v_company.region IS NOT NULL
           AND lower(coalesce(e.region,'')) = lower(v_company.region)
          THEN 50 ELSE 0
        END
        +
        CASE v_company.stage
          WHEN 'client_actif' THEN 5
          WHEN 'prospect' THEN 3
          WHEN 'suspect' THEN 1
          ELSE 0
        END
      ) AS score,
      ARRAY_REMOVE(ARRAY[
        CASE
          WHEN v_company.code_naf IS NOT NULL
           AND e.secteurs_naf && ARRAY[
             v_company.code_naf,
             substring(v_company.code_naf from 1 for 3),
             substring(v_company.code_naf from 1 for 2),
             substring(v_company.code_naf from 1 for 1)
           ]
          THEN 'Secteur NAF aligné' END,
        CASE
          WHEN v_company.region IS NOT NULL
           AND lower(coalesce(e.region,'')) = lower(v_company.region)
          THEN 'Même région' END,
        CASE
          WHEN e.date_debut <= (now()::date + interval '90 days')
          THEN 'À moins de 90 jours' END
      ], NULL) AS reasons
    FROM public.crm_maronnier_events e
    WHERE e.date_debut >= now()::date
  )
  SELECT
    s.id, s.nom, s.date_debut, s.date_fin, s.lieu, s.region, s.type,
    s.site_url, s.description, s.secteurs_naf,
    s.score, s.reasons
  FROM scored s
  ORDER BY s.score DESC, s.date_debut ASC
  LIMIT GREATEST(p_limit, 1);
END;
$$;

-- ============================================================================
-- 4) RPC: get_signature_species_for_company (Levier 3)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_signature_species_for_company(
  p_company_id uuid,
  p_radius_km int DEFAULT 10,
  p_limit int DEFAULT 12
)
RETURNS TABLE (
  scientific_name text,
  common_name_fr text,
  iconic_taxon text,
  kingdom text,
  observation_count bigint,
  last_observation_date date,
  last_photo_url text,
  last_marche_id uuid,
  last_marche_title text,
  last_marche_slug text,
  distance_km numeric,
  patrimoine_score int
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_lat double precision;
  v_lon double precision;
  v_radius_m double precision;
BEGIN
  IF NOT is_admin_user() THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  SELECT latitude, longitude INTO v_lat, v_lon
    FROM public.crm_companies WHERE id = p_company_id;

  IF v_lat IS NULL OR v_lon IS NULL THEN
    RETURN;
  END IF;

  v_radius_m := GREATEST(p_radius_km, 1) * 1000.0;

  RETURN QUERY
  WITH obs AS (
    SELECT
      o.species_scientific_name AS scientific_name,
      o.taxon_common_name_fr    AS common_name_fr,
      o.iconic_taxon,
      o.kingdom,
      o.observation_date,
      o.photo_url,
      o.marche_id,
      o.latitude,
      o.longitude,
      -- Haversine (mètres)
      2 * 6371000 * asin(sqrt(
        sin(radians(o.latitude - v_lat)/2)^2 +
        cos(radians(v_lat)) * cos(radians(o.latitude)) *
        sin(radians(o.longitude - v_lon)/2)^2
      )) AS distance_m
    FROM public.marcheur_observations o
    WHERE o.latitude IS NOT NULL
      AND o.longitude IS NOT NULL
      AND o.species_scientific_name IS NOT NULL
      -- pré-filtre bbox (~degrés) pour performance
      AND o.latitude  BETWEEN v_lat - (p_radius_km / 111.0) AND v_lat + (p_radius_km / 111.0)
      AND o.longitude BETWEEN v_lon - (p_radius_km / 70.0)  AND v_lon + (p_radius_km / 70.0)
  ),
  filtered AS (
    SELECT * FROM obs WHERE distance_m <= v_radius_m
  ),
  ranked AS (
    SELECT
      scientific_name,
      common_name_fr,
      iconic_taxon,
      kingdom,
      count(*) AS observation_count,
      max(observation_date) AS last_observation_date,
      (array_agg(photo_url ORDER BY observation_date DESC NULLS LAST))[1] AS last_photo_url,
      (array_agg(marche_id ORDER BY observation_date DESC NULLS LAST))[1] AS last_marche_id,
      (array_agg(distance_m ORDER BY observation_date DESC NULLS LAST))[1] AS last_distance_m,
      CASE
        WHEN iconic_taxon = 'Amphibia' THEN 100
        WHEN iconic_taxon = 'Reptilia' THEN 95
        WHEN iconic_taxon = 'Mammalia' THEN 90
        WHEN iconic_taxon = 'Aves'     THEN 70
        WHEN iconic_taxon = 'Insecta'  THEN 50
        WHEN kingdom = 'Fungi'         THEN 60
        WHEN kingdom = 'Plantae'       THEN 40
        ELSE 30
      END AS patrimoine_score
    FROM filtered
    GROUP BY scientific_name, common_name_fr, iconic_taxon, kingdom
  )
  SELECT
    r.scientific_name,
    r.common_name_fr,
    r.iconic_taxon,
    r.kingdom,
    r.observation_count,
    r.last_observation_date,
    r.last_photo_url,
    r.last_marche_id,
    me.title AS last_marche_title,
    me.public_slug AS last_marche_slug,
    round((r.last_distance_m / 1000.0)::numeric, 2) AS distance_km,
    r.patrimoine_score
  FROM ranked r
  LEFT JOIN public.marche_events me ON me.id = r.last_marche_id
  ORDER BY r.patrimoine_score DESC, r.observation_count DESC
  LIMIT GREATEST(p_limit, 1);
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_maronnier_matches_for_company(uuid, int) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_signature_species_for_company(uuid, int, int) TO authenticated, service_role;
