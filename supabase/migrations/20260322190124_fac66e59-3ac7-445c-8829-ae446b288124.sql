INSERT INTO public.marche_organisateurs (nom, adresse, code_postal, ville, pays, type_structure, domaines) VALUES
  ('Gaspard Boréal', '4 rue du Champ de Foire', '16190', 'DEVIAT', 'France', 'individu', ARRAY['poesie','bioacoustique','exploration_sonore']),
  ('La Comédie des Mondes Hybrides', '4 rue du Champ de Foire', '16190', 'DEVIAT', 'France', 'association', ARRAY['theatre','narration','mondes_hybrides']),
  ('La Fréquence du Vivant', '4 rue du Champ de Foire', '16190', 'DEVIAT', 'France', 'association', ARRAY['agroecologie','poesie','bioacoustique','data']),
  ('Mouton Village Événements', '1 Place du 25 Août', '79340', 'VASLES', 'France', 'association', ARRAY['transhumance','evenementiel','pastoralisme']);

UPDATE public.marches SET organisateur_id = (
  SELECT id FROM public.marche_organisateurs WHERE nom = 'Gaspard Boréal' LIMIT 1
);