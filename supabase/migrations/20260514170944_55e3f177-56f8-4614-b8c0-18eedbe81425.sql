ALTER TABLE public.marcheur_observations
  ADD COLUMN IF NOT EXISTS inaturalist_observation_id BIGINT;

CREATE UNIQUE INDEX IF NOT EXISTS marcheur_observations_marcheur_inat_uniq
  ON public.marcheur_observations (marcheur_id, inaturalist_observation_id)
  WHERE inaturalist_observation_id IS NOT NULL;