-- Table des marcheurs associés aux explorations
CREATE TABLE exploration_marcheurs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exploration_id UUID NOT NULL REFERENCES explorations(id) ON DELETE CASCADE,
  nom TEXT NOT NULL,
  prenom TEXT NOT NULL,
  role TEXT DEFAULT 'marcheur',
  bio_courte TEXT,
  avatar_url TEXT,
  couleur TEXT DEFAULT '#10b981',
  is_principal BOOLEAN DEFAULT false,
  ordre INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- RLS pour exploration_marcheurs
ALTER TABLE exploration_marcheurs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view exploration_marcheurs" ON exploration_marcheurs FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert exploration_marcheurs" ON exploration_marcheurs FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated users can update exploration_marcheurs" ON exploration_marcheurs FOR UPDATE USING (true);
CREATE POLICY "Authenticated users can delete exploration_marcheurs" ON exploration_marcheurs FOR DELETE USING (true);

-- Index pour performance
CREATE INDEX idx_exploration_marcheurs_exploration ON exploration_marcheurs(exploration_id);

-- Table de liaison marcheur <-> observations d'espèces
CREATE TABLE marcheur_observations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  marcheur_id UUID NOT NULL REFERENCES exploration_marcheurs(id) ON DELETE CASCADE,
  marche_id UUID NOT NULL REFERENCES marches(id) ON DELETE CASCADE,
  species_scientific_name TEXT NOT NULL,
  observation_date DATE DEFAULT CURRENT_DATE,
  notes TEXT,
  photo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- RLS pour marcheur_observations
ALTER TABLE marcheur_observations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view marcheur_observations" ON marcheur_observations FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert marcheur_observations" ON marcheur_observations FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated users can update marcheur_observations" ON marcheur_observations FOR UPDATE USING (true);
CREATE POLICY "Authenticated users can delete marcheur_observations" ON marcheur_observations FOR DELETE USING (true);

-- Index pour performance
CREATE INDEX idx_marcheur_obs_marcheur ON marcheur_observations(marcheur_id);
CREATE INDEX idx_marcheur_obs_species ON marcheur_observations(species_scientific_name);
CREATE INDEX idx_marcheur_obs_marche ON marcheur_observations(marche_id);

-- Trigger pour updated_at sur exploration_marcheurs
CREATE TRIGGER update_exploration_marcheurs_updated_at
  BEFORE UPDATE ON exploration_marcheurs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();