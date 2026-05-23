-- Drop l'index partiel et le remplace par une vraie contrainte UNIQUE
-- (les NULLs multiples restent autorisés par défaut en PG sur UNIQUE)
DROP INDEX IF EXISTS public.marcheur_observations_inat_marcheur_marche_uniq;

ALTER TABLE public.marcheur_observations
  ADD CONSTRAINT marcheur_observations_inat_marcheur_marche_uniq
  UNIQUE (marcheur_id, marche_id, inaturalist_observation_id);