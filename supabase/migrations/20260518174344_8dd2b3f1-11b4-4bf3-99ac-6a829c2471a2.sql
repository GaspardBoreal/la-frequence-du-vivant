ALTER TABLE public.marches
  DROP CONSTRAINT marches_radius_m_range,
  ADD  CONSTRAINT marches_radius_m_range
       CHECK (radius_m IS NULL OR (radius_m >= 15 AND radius_m <= 50000));

ALTER TABLE public.explorations
  DROP CONSTRAINT explorations_default_radius_m_range,
  ADD  CONSTRAINT explorations_default_radius_m_range
       CHECK (default_radius_m IS NULL OR (default_radius_m >= 15 AND default_radius_m <= 50000));