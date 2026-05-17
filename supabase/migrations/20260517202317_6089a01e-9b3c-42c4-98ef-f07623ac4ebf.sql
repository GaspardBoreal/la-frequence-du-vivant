ALTER TABLE public.explorations ADD COLUMN IF NOT EXISTS default_radius_m integer NULL;
ALTER TABLE public.marches      ADD COLUMN IF NOT EXISTS radius_m         integer NULL;

COMMENT ON COLUMN public.explorations.default_radius_m IS 'Rayon par défaut (m) appliqué aux marches sans override. NULL = fallback 500m.';
COMMENT ON COLUMN public.marches.radius_m IS 'Rayon d''observation (m) pour cette marche. NULL = utilise default_radius_m de l''exploration, sinon 500m.';

-- Contraintes de bornes (100m - 50km) sans bloquer NULL
ALTER TABLE public.explorations DROP CONSTRAINT IF EXISTS explorations_default_radius_m_range;
ALTER TABLE public.explorations ADD CONSTRAINT explorations_default_radius_m_range CHECK (default_radius_m IS NULL OR (default_radius_m BETWEEN 50 AND 50000));

ALTER TABLE public.marches DROP CONSTRAINT IF EXISTS marches_radius_m_range;
ALTER TABLE public.marches ADD CONSTRAINT marches_radius_m_range CHECK (radius_m IS NULL OR (radius_m BETWEEN 50 AND 50000));