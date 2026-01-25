-- ============================================
-- DORDONIA - Tables pour l'application poétique
-- ============================================

-- Table dordonia_revers : Décisions irréversibles avec pertes reconnues
CREATE TABLE public.dordonia_revers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  exploration_id UUID REFERENCES public.explorations(id),
  decision TEXT NOT NULL,
  pertes_humain_immediat JSONB DEFAULT '[]'::jsonb,
  pertes_humain_differe JSONB DEFAULT '[]'::jsonb,
  pertes_riviere JSONB DEFAULT '[]'::jsonb,
  pertes_machine JSONB DEFAULT '[]'::jsonb,
  dette_reparation TEXT,
  is_sealed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  sealed_at TIMESTAMP WITH TIME ZONE
);

-- Table dordonia_care_registry : Registre des actes de soin
CREATE TABLE public.dordonia_care_registry (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  revers_id UUID NOT NULL REFERENCES public.dordonia_revers(id) ON DELETE CASCADE,
  acte_soin TEXT NOT NULL,
  statut TEXT NOT NULL DEFAULT 'engage' CHECK (statut IN ('engage', 'accompli', 'impossible')),
  temoignage TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  accomplished_at TIMESTAMP WITH TIME ZONE
);

-- Table dordonia_atlas : Carte floue sans coordonnées fines
CREATE TABLE public.dordonia_atlas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  exploration_id UUID REFERENCES public.explorations(id),
  grid_cell TEXT NOT NULL, -- Référence grille floue (ex: "A3", "B7")
  type_entree TEXT NOT NULL CHECK (type_entree IN ('toponyme', 'micro_recit', 'contradiction', 'blanc')),
  contenu TEXT,
  is_silent_zone BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table dordonia_choeur : Apparitions poétiques éphémères
CREATE TABLE public.dordonia_choeur (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  exploration_id UUID REFERENCES public.explorations(id),
  apparition TEXT NOT NULL,
  is_ephemeral BOOLEAN DEFAULT false,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table dordonia_sessions : Sessions utilisateur DORDONIA
CREATE TABLE public.dordonia_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_key TEXT NOT NULL UNIQUE,
  exploration_id UUID REFERENCES public.explorations(id),
  scenario_actif TEXT CHECK (scenario_actif IN ('marche', 'revers', 'atlas', 'parlement', 'choeur')),
  seuil_ou_es_tu TEXT,
  seuil_que_cherches_tu TEXT,
  seuil_quel_risque TEXT,
  context JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table dordonia_fragments : Fragments de Fréquence (FF)
CREATE TABLE public.dordonia_fragments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES public.dordonia_sessions(id) ON DELETE CASCADE,
  scenario TEXT NOT NULL,
  contenu TEXT,
  is_silence BOOLEAN DEFAULT false, -- FF-0 Silence
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table dordonia_parlement : Délibérations du Parlement 2050
CREATE TABLE public.dordonia_parlement (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES public.dordonia_sessions(id),
  cas_deliberation TEXT NOT NULL,
  donnees_sobres JSONB DEFAULT '{}'::jsonb,
  incertitude_affichee TEXT,
  deliberation TEXT,
  decision TEXT,
  veto_riviere BOOLEAN DEFAULT false,
  pv_genere TEXT, -- Procès-verbal
  revers_id UUID REFERENCES public.dordonia_revers(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Activer RLS sur toutes les tables
ALTER TABLE public.dordonia_revers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dordonia_care_registry ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dordonia_atlas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dordonia_choeur ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dordonia_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dordonia_fragments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dordonia_parlement ENABLE ROW LEVEL SECURITY;

-- Politiques RLS : Lecture publique (données anonymes)
CREATE POLICY "Public read dordonia_revers" ON public.dordonia_revers FOR SELECT USING (true);
CREATE POLICY "Public read dordonia_care_registry" ON public.dordonia_care_registry FOR SELECT USING (true);
CREATE POLICY "Public read dordonia_atlas" ON public.dordonia_atlas FOR SELECT USING (true);
CREATE POLICY "Public read dordonia_choeur" ON public.dordonia_choeur FOR SELECT USING (true);
CREATE POLICY "Public read dordonia_sessions" ON public.dordonia_sessions FOR SELECT USING (true);
CREATE POLICY "Public read dordonia_fragments" ON public.dordonia_fragments FOR SELECT USING (true);
CREATE POLICY "Public read dordonia_parlement" ON public.dordonia_parlement FOR SELECT USING (true);

-- Politiques RLS : Insertion publique (anonyme)
CREATE POLICY "Public insert dordonia_revers" ON public.dordonia_revers FOR INSERT WITH CHECK (true);
CREATE POLICY "Public insert dordonia_care_registry" ON public.dordonia_care_registry FOR INSERT WITH CHECK (true);
CREATE POLICY "Public insert dordonia_atlas" ON public.dordonia_atlas FOR INSERT WITH CHECK (true);
CREATE POLICY "Public insert dordonia_choeur" ON public.dordonia_choeur FOR INSERT WITH CHECK (true);
CREATE POLICY "Public insert dordonia_sessions" ON public.dordonia_sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "Public insert dordonia_fragments" ON public.dordonia_fragments FOR INSERT WITH CHECK (true);
CREATE POLICY "Public insert dordonia_parlement" ON public.dordonia_parlement FOR INSERT WITH CHECK (true);

-- Politiques RLS : Mise à jour publique
CREATE POLICY "Public update dordonia_revers" ON public.dordonia_revers FOR UPDATE USING (true);
CREATE POLICY "Public update dordonia_care_registry" ON public.dordonia_care_registry FOR UPDATE USING (true);
CREATE POLICY "Public update dordonia_sessions" ON public.dordonia_sessions FOR UPDATE USING (true);

-- Index pour performance
CREATE INDEX idx_dordonia_revers_session ON public.dordonia_revers(session_id);
CREATE INDEX idx_dordonia_atlas_grid ON public.dordonia_atlas(grid_cell);
CREATE INDEX idx_dordonia_choeur_expires ON public.dordonia_choeur(expires_at) WHERE is_ephemeral = true;
CREATE INDEX idx_dordonia_sessions_key ON public.dordonia_sessions(session_key);
CREATE INDEX idx_dordonia_fragments_session ON public.dordonia_fragments(session_id);

-- Trigger pour updated_at sur sessions
CREATE TRIGGER update_dordonia_sessions_updated_at
  BEFORE UPDATE ON public.dordonia_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();