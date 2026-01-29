-- Nouvelle table pour les parties/mouvements littéraires
CREATE TABLE exploration_parties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exploration_id UUID NOT NULL REFERENCES explorations(id) ON DELETE CASCADE,
  titre TEXT NOT NULL,
  sous_titre TEXT,
  numero_romain TEXT NOT NULL DEFAULT 'I',
  ordre INTEGER NOT NULL DEFAULT 1,
  couleur TEXT DEFAULT '#6366f1',
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index pour performance
CREATE INDEX idx_exploration_parties_exploration ON exploration_parties(exploration_id);

-- RLS policies
ALTER TABLE exploration_parties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view exploration_parties"
  ON exploration_parties FOR SELECT USING (true);

CREATE POLICY "Only authenticated users can insert exploration_parties"
  ON exploration_parties FOR INSERT WITH CHECK (true);

CREATE POLICY "Only authenticated users can update exploration_parties"
  ON exploration_parties FOR UPDATE USING (true);

CREATE POLICY "Only authenticated users can delete exploration_parties"
  ON exploration_parties FOR DELETE USING (true);

-- Ajout de la colonne partie_id à exploration_marches
ALTER TABLE exploration_marches 
ADD COLUMN partie_id UUID REFERENCES exploration_parties(id) ON DELETE SET NULL;