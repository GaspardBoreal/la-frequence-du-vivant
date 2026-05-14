DELETE FROM public.marcheur_observations mo
USING public.exploration_marches em
WHERE mo.marche_id = em.marche_id
  AND em.exploration_id = '20dd3be8-e594-492c-998a-5c4d009a5094'
  AND mo.notes = 'iNaturalist backfill'
  AND mo.inaturalist_observation_id IS NULL;