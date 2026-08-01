CREATE UNIQUE INDEX IF NOT EXISTS propriete_calques_unique_nom
  ON public.propriete_calques (propriete_id, lower(nom));