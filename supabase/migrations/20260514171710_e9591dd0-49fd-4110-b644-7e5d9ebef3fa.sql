DROP INDEX IF EXISTS public.marcheur_observations_marcheur_inat_uniq;

ALTER TABLE public.marcheur_observations
  ADD CONSTRAINT marcheur_observations_marcheur_inat_uniq
  UNIQUE (marcheur_id, inaturalist_observation_id);