
CREATE TABLE IF NOT EXISTS public.crm_maronnier_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nom text NOT NULL,
  date_debut date NOT NULL,
  date_fin date,
  lieu text,
  region text,
  latitude double precision,
  longitude double precision,
  type text NOT NULL DEFAULT 'salon_b2b',
  site_url text,
  description text,
  secteurs_naf text[] DEFAULT '{}',
  statut_curation text NOT NULL DEFAULT 'a_confirmer',
  notes text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_maronnier_events TO authenticated;
GRANT ALL ON public.crm_maronnier_events TO service_role;

ALTER TABLE public.crm_maronnier_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins gerent maronnier"
ON public.crm_maronnier_events
FOR ALL TO authenticated
USING (public.is_admin_user())
WITH CHECK (public.is_admin_user());

CREATE INDEX IF NOT EXISTS idx_crm_maronnier_date ON public.crm_maronnier_events(date_debut);
CREATE INDEX IF NOT EXISTS idx_crm_maronnier_type ON public.crm_maronnier_events(type);

CREATE OR REPLACE FUNCTION public.tg_crm_maronnier_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS trg_crm_maronnier_updated_at ON public.crm_maronnier_events;
CREATE TRIGGER trg_crm_maronnier_updated_at
BEFORE UPDATE ON public.crm_maronnier_events
FOR EACH ROW EXECUTE FUNCTION public.tg_crm_maronnier_updated_at();

INSERT INTO public.crm_maronnier_events (nom, date_debut, date_fin, lieu, region, latitude, longitude, type, site_url, description, statut_curation) VALUES
('Salon International de l''Agriculture 2026', '2026-02-21', '2026-03-01', 'Paris Expo Porte de Versailles', 'Île-de-France', 48.8323, 2.2871, 'salon_b2b', 'https://www.salon-agriculture.com', 'Plus grande vitrine de l''agriculture française. Cible : coopératives, filières, élus ruraux.', 'a_confirmer'),
('ChangeNOW 2026', '2026-04-22', '2026-04-24', 'Grand Palais, Paris', 'Île-de-France', 48.8662, 2.3125, 'sommet', 'https://www.changenow.world', 'Plus grand événement mondial dédié aux solutions pour la planète.', 'a_confirmer'),
('Fête de la Nature 2026', '2026-05-20', '2026-05-24', 'France entière', NULL, NULL, NULL, 'festival', 'https://fetedelanature.com', 'Plus de 5000 événements gratuits sur tout le territoire.', 'a_confirmer'),
('VivaTech 2026', '2026-06-11', '2026-06-13', 'Paris Expo Porte de Versailles', 'Île-de-France', 48.8323, 2.2871, 'salon_b2b', 'https://vivatechnology.com', 'Tech & innovation, scène GreenTech en pleine croissance.', 'a_confirmer'),
('Congrès UICN France 2026', '2026-06-15', '2026-06-18', 'À confirmer', NULL, NULL, NULL, 'sommet', 'https://uicn.fr', 'Rendez-vous national de la biodiversité.', 'a_confirmer'),
('Universités d''été du MEDEF 2026', '2026-08-26', '2026-08-27', 'HEC, Jouy-en-Josas', 'Île-de-France', 48.7644, 2.1697, 'sommet', 'https://www.medef.com', 'Rencontre annuelle dirigeants & politiques.', 'a_confirmer'),
('Produrable 2026', '2026-09-09', '2026-09-10', 'Palais des Congrès, Paris', 'Île-de-France', 48.8786, 2.2837, 'salon_b2b', 'https://www.produrable.com', 'Le rendez-vous des acteurs et solutions de l''économie durable.', 'a_confirmer'),
('Tech&Bio 2026', '2026-09-23', '2026-09-24', 'Lycée Le Valentin, Bourg-lès-Valence', 'Auvergne-Rhône-Alpes', 44.9686, 4.9089, 'salon_b2b', 'https://www.tech-n-bio.com', 'Salon européen des techniques bio et alternatives.', 'a_confirmer'),
('Jour de la Nuit 2026', '2026-10-10', '2026-10-10', 'France entière', NULL, NULL, NULL, 'festival', 'https://www.jourdelanuit.fr', 'Sensibilisation à la pollution lumineuse et à la biodiversité nocturne.', 'a_confirmer'),
('Pollutec 2026', '2026-10-06', '2026-10-09', 'Eurexpo, Lyon', 'Auvergne-Rhône-Alpes', 45.7286, 5.0006, 'salon_b2b', 'https://www.pollutec.com', 'Salon international des équipements et services de l''environnement.', 'a_confirmer'),
('Festival du Film Ornithologique de Ménigoute 2026', '2026-10-27', '2026-11-01', 'Ménigoute', 'Nouvelle-Aquitaine', 46.4925, -0.0658, 'festival', 'https://www.menigoute-festival.org', '41e édition du plus grand festival nature français.', 'a_confirmer'),
('Salon des Maires et des Collectivités Locales 2026', '2026-11-17', '2026-11-19', 'Paris Expo Porte de Versailles', 'Île-de-France', 48.8323, 2.2871, 'salon_b2b', 'https://www.salondesmaires.com', 'Élus locaux : leviers pour territoires de biodiversité.', 'a_confirmer'),
('SITEVI 2026', '2026-11-24', '2026-11-26', 'Parc Expo, Montpellier', 'Occitanie', 43.5826, 3.9583, 'salon_b2b', 'https://www.sitevi.com', 'Salon mondial vigne, vin, olive, fruits-légumes.', 'a_confirmer'),
('Salon Marjolaine 2026', '2026-11-07', '2026-11-15', 'Parc Floral de Paris', 'Île-de-France', 48.8336, 2.4514, 'b2c', 'https://salon-marjolaine.com', 'Plus grand salon bio de France.', 'a_confirmer'),
('Salon de l''Agriculture 2027', '2027-02-27', '2027-03-07', 'Paris Expo Porte de Versailles', 'Île-de-France', 48.8323, 2.2871, 'salon_b2b', 'https://www.salon-agriculture.com', 'Édition 2027.', 'a_confirmer'),
('Salon Primevère 2027', '2027-02-19', '2027-02-21', 'Eurexpo, Lyon', 'Auvergne-Rhône-Alpes', 45.7286, 5.0006, 'b2c', 'https://salonprimevere.org', 'Rencontre écologique et alternative.', 'a_confirmer'),
('ChangeNOW 2027', '2027-04-21', '2027-04-23', 'Grand Palais, Paris', 'Île-de-France', 48.8662, 2.3125, 'sommet', 'https://www.changenow.world', 'Édition 2027.', 'a_confirmer'),
('Fête de la Nature 2027', '2027-05-19', '2027-05-23', 'France entière', NULL, NULL, NULL, 'festival', 'https://fetedelanature.com', 'Édition 2027.', 'a_confirmer'),
('Assises Nationales de la Biodiversité 2027', '2027-06-15', '2027-06-17', 'À confirmer', NULL, NULL, NULL, 'sommet', 'https://www.assises-biodiversite.com', 'Rendez-vous incontournable des acteurs publics de la biodiversité.', 'a_confirmer'),
('Produrable 2027', '2027-09-15', '2027-09-16', 'Palais des Congrès, Paris', 'Île-de-France', 48.8786, 2.2837, 'salon_b2b', 'https://www.produrable.com', 'Édition 2027.', 'a_confirmer'),
('Pollutec 2027', '2027-12-01', '2027-12-04', 'Paris Nord Villepinte', 'Île-de-France', 48.9719, 2.5151, 'salon_b2b', 'https://www.pollutec.com', 'Édition parisienne 2027.', 'a_confirmer'),
('SITEVI 2027', '2027-11-23', '2027-11-25', 'Parc Expo, Montpellier', 'Occitanie', 43.5826, 3.9583, 'salon_b2b', 'https://www.sitevi.com', 'Édition 2027.', 'a_confirmer'),
('Salon des Maires 2027', '2027-11-16', '2027-11-18', 'Paris Expo Porte de Versailles', 'Île-de-France', 48.8323, 2.2871, 'salon_b2b', 'https://www.salondesmaires.com', 'Édition 2027.', 'a_confirmer'),
('Naturissima 2026', '2026-11-26', '2026-11-29', 'Alpexpo, Grenoble', 'Auvergne-Rhône-Alpes', 45.1493, 5.7396, 'b2c', 'https://www.naturissima.com', 'Salon bio, bien-être et habitat durable.', 'a_confirmer'),
('Vivre Autrement 2026', '2026-03-13', '2026-03-16', 'Parc Floral de Paris', 'Île-de-France', 48.8336, 2.4514, 'b2c', 'https://www.salon-vivreautrement.com', 'Salon parisien du bio, naturel et engagé.', 'a_confirmer')
ON CONFLICT DO NOTHING;

CREATE OR REPLACE FUNCTION public.get_top_species_observed(p_limit integer DEFAULT 25)
RETURNS TABLE (
  scientific_name text,
  common_name_fr text,
  observation_count bigint,
  last_observation_date timestamptz,
  last_photo_url text,
  last_lieu text,
  last_marche_id uuid,
  last_marcheur_name text,
  iconic_taxon text,
  kingdom text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH unified AS (
    SELECT
      LOWER(TRIM(mo.species_scientific_name)) AS sci_lc,
      mo.species_scientific_name AS sci,
      mo.taxon_common_name_fr AS fr,
      mo.observation_date AS obs_date,
      mo.photo_url,
      mo.marche_id,
      mo.iconic_taxon,
      mo.kingdom,
      mo.marcheur_id,
      me.lieu
    FROM marcheur_observations mo
    LEFT JOIN marche_events me ON me.id = mo.marche_id
    WHERE mo.species_scientific_name IS NOT NULL AND LENGTH(TRIM(mo.species_scientific_name)) > 0
  ),
  ranked AS (
    SELECT
      u.sci_lc,
      COUNT(*) AS cnt,
      MAX(u.obs_date) AS last_date,
      (ARRAY_AGG(u.sci ORDER BY u.obs_date DESC NULLS LAST))[1] AS sci_display,
      (ARRAY_AGG(u.fr ORDER BY u.obs_date DESC NULLS LAST) FILTER (WHERE u.fr IS NOT NULL))[1] AS fr_display,
      (ARRAY_AGG(u.photo_url ORDER BY u.obs_date DESC NULLS LAST) FILTER (WHERE u.photo_url IS NOT NULL))[1] AS last_photo,
      (ARRAY_AGG(u.lieu ORDER BY u.obs_date DESC NULLS LAST) FILTER (WHERE u.lieu IS NOT NULL))[1] AS last_lieu,
      (ARRAY_AGG(u.marche_id ORDER BY u.obs_date DESC NULLS LAST) FILTER (WHERE u.marche_id IS NOT NULL))[1] AS last_marche,
      (ARRAY_AGG(u.marcheur_id ORDER BY u.obs_date DESC NULLS LAST) FILTER (WHERE u.marcheur_id IS NOT NULL))[1] AS last_marcheur,
      (ARRAY_AGG(u.iconic_taxon ORDER BY u.obs_date DESC NULLS LAST) FILTER (WHERE u.iconic_taxon IS NOT NULL))[1] AS last_iconic,
      (ARRAY_AGG(u.kingdom ORDER BY u.obs_date DESC NULLS LAST) FILTER (WHERE u.kingdom IS NOT NULL))[1] AS last_kingdom
    FROM unified u
    GROUP BY u.sci_lc
  )
  SELECT
    r.sci_display,
    r.fr_display,
    r.cnt,
    r.last_date,
    r.last_photo,
    r.last_lieu,
    r.last_marche,
    NULLIF(TRIM(COALESCE(cp.prenom,'') || ' ' || COALESCE(cp.nom,'')), '') AS last_marcheur_name,
    r.last_iconic,
    r.last_kingdom
  FROM ranked r
  LEFT JOIN community_profiles cp ON cp.user_id = r.last_marcheur
  ORDER BY r.cnt DESC NULLS LAST, r.last_date DESC NULLS LAST
  LIMIT p_limit;
$$;

GRANT EXECUTE ON FUNCTION public.get_top_species_observed(integer) TO authenticated;

CREATE OR REPLACE FUNCTION public.get_marches_for_species(p_query text)
RETURNS TABLE (
  marche_id uuid,
  marche_title text,
  marche_date date,
  marche_lieu text,
  observation_count bigint,
  last_photo_url text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    me.id,
    me.title,
    me.date_marche,
    me.lieu,
    COUNT(mo.*) AS observation_count,
    (ARRAY_AGG(mo.photo_url ORDER BY mo.observation_date DESC NULLS LAST) FILTER (WHERE mo.photo_url IS NOT NULL))[1]
  FROM marcheur_observations mo
  JOIN marche_events me ON me.id = mo.marche_id
  WHERE LOWER(mo.species_scientific_name) ILIKE '%' || LOWER(TRIM(p_query)) || '%'
     OR LOWER(COALESCE(mo.taxon_common_name_fr,'')) ILIKE '%' || LOWER(TRIM(p_query)) || '%'
  GROUP BY me.id, me.title, me.date_marche, me.lieu
  ORDER BY me.date_marche DESC NULLS LAST
  LIMIT 100;
$$;

GRANT EXECUTE ON FUNCTION public.get_marches_for_species(text) TO authenticated;
