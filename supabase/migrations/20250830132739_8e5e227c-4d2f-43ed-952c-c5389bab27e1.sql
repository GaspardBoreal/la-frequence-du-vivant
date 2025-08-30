-- OPUS "Fréquences de la Rivière Dordogne" - Architecture Révolutionnaire
-- Phase 1: Extensions de Base de Données

-- Table pour les OPUS (collections thématiques d'explorations)
CREATE TABLE public.opus_explorations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  slug TEXT NOT NULL UNIQUE,
  nom TEXT NOT NULL,
  description TEXT,
  theme_principal TEXT NOT NULL,
  cover_image_url TEXT,
  meta_title TEXT,
  meta_description TEXT,
  meta_keywords TEXT[] NOT NULL DEFAULT '{}',
  language TEXT NOT NULL DEFAULT 'fr',
  published BOOLEAN NOT NULL DEFAULT false,
  ordre INTEGER DEFAULT 1
);

-- Table pour les contextes hybrides des marches (8 dimensions)
CREATE TABLE public.marche_contextes_hybrids (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  marche_id UUID NOT NULL,
  opus_id UUID,
  
  -- Les 8 dimensions contextuelles
  contexte_hydrologique JSONB,
  especes_caracteristiques JSONB,
  vocabulaire_local JSONB,
  empreintes_humaines JSONB,
  projection_2035_2045 JSONB,
  leviers_agroecologiques JSONB,
  nouvelles_activites JSONB,
  technodiversite JSONB,
  
  -- Métadonnées
  completude_score NUMERIC DEFAULT 0,
  last_validation TIMESTAMP WITH TIME ZONE,
  sources JSONB DEFAULT '[]'
);

-- Table pour les fables narratives avec variations
CREATE TABLE public.fables_narratives (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  marche_id UUID NOT NULL,
  opus_id UUID,
  
  -- Structure narrative
  titre TEXT NOT NULL,
  resume TEXT,
  contenu_principal TEXT NOT NULL,
  
  -- Variations (solo, duo, ensemble)
  variations JSONB NOT NULL DEFAULT '{}',
  
  -- Versioning et tagging
  version TEXT NOT NULL DEFAULT 'V1',
  tags JSONB DEFAULT '[]',
  statut TEXT NOT NULL DEFAULT 'draft', -- draft, validated, published
  
  -- Liens contextuels
  dimensions_associees TEXT[] DEFAULT '{}',
  ordre INTEGER DEFAULT 1,
  
  -- Métadonnées créatives
  inspiration_sources JSONB,
  notes_creative JSONB
);

-- Table pour les préfigurations interactives
CREATE TABLE public.préfigurations_interactives (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  opus_id UUID NOT NULL,
  
  -- Configuration de l'expérience
  nom_prefiguration TEXT NOT NULL,
  type_experience TEXT NOT NULL, -- confluence, projection, fables_vivantes, technodiversite
  
  -- Paramètres d'immersion
  config_navigation JSONB NOT NULL DEFAULT '{}',
  config_visuelle JSONB NOT NULL DEFAULT '{}',
  config_sonore JSONB DEFAULT '{}',
  config_interaction JSONB DEFAULT '{}',
  
  -- Données spécifiques au fleuve
  fleuve_metadata JSONB,
  temporal_layers JSONB,
  
  published BOOLEAN NOT NULL DEFAULT false,
  ordre INTEGER DEFAULT 1
);

-- Index pour optimiser les requêtes
CREATE INDEX idx_marche_contextes_marche_id ON public.marche_contextes_hybrids(marche_id);
CREATE INDEX idx_marche_contextes_opus_id ON public.marche_contextes_hybrids(opus_id);
CREATE INDEX idx_fables_marche_id ON public.fables_narratives(marche_id);
CREATE INDEX idx_fables_opus_id ON public.fables_narratives(opus_id);
CREATE INDEX idx_fables_version ON public.fables_narratives(version);
CREATE INDEX idx_prefigurations_opus_id ON public.préfigurations_interactives(opus_id);

-- Triggers pour updated_at
CREATE TRIGGER update_opus_explorations_updated_at
  BEFORE UPDATE ON public.opus_explorations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_marche_contextes_updated_at
  BEFORE UPDATE ON public.marche_contextes_hybrids
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_fables_narratives_updated_at
  BEFORE UPDATE ON public.fables_narratives
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_prefiguration_updated_at
  BEFORE UPDATE ON public.préfigurations_interactives
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- RLS Policies
ALTER TABLE public.opus_explorations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marche_contextes_hybrids ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fables_narratives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.préfigurations_interactives ENABLE ROW LEVEL SECURITY;

-- Policies pour public access (lecture)
CREATE POLICY "Public can view opus_explorations" ON public.opus_explorations
  FOR SELECT USING (published = true);

CREATE POLICY "Public can view marche_contextes_hybrids" ON public.marche_contextes_hybrids
  FOR SELECT USING (true);

CREATE POLICY "Public can view fables_narratives" ON public.fables_narratives
  FOR SELECT USING (statut = 'published');

CREATE POLICY "Public can view préfigurations_interactives" ON public.préfigurations_interactives
  FOR SELECT USING (published = true);

-- Policies pour admin access (toutes opérations)
CREATE POLICY "Authenticated users can manage opus_explorations" ON public.opus_explorations
  FOR ALL USING (true);

CREATE POLICY "Authenticated users can manage marche_contextes_hybrids" ON public.marche_contextes_hybrids
  FOR ALL USING (true);

CREATE POLICY "Authenticated users can manage fables_narratives" ON public.fables_narratives
  FOR ALL USING (true);

CREATE POLICY "Authenticated users can manage préfigurations_interactives" ON public.préfigurations_interactives
  FOR ALL USING (true);

-- Insérer l'OPUS "Fréquences de la Rivière Dordogne" par défaut
INSERT INTO public.opus_explorations (
  slug,
  nom,
  description,
  theme_principal,
  meta_title,
  meta_description,
  meta_keywords,
  published
) VALUES (
  'frequences-de-la-riviere-dordogne',
  'Fréquences de la Rivière Dordogne',
  'Atlas des vivants et technodiversité le long de la Dordogne - Une exploration révolutionnaire des territoires en mutation climatique',
  'Hydrologie & Biodiversité',
  'Fréquences de la Rivière Dordogne - Atlas des Vivants',
  'Exploration immersive des écosystèmes de la Dordogne, de la biodiversité aux innovations technologiques locales',
  ARRAY['dordogne', 'biodiversité', 'technodiversité', 'climat', 'estuaire', 'fables'],
  true
);