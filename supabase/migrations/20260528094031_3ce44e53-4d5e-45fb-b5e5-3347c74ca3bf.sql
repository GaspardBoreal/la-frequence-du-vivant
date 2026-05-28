
-- ============================================================
-- Audit IA Frugale module (AFNOR SPEC 2314)
-- ============================================================

-- 1. Templates de prompts versionnés
CREATE TABLE public.audit_prompt_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  version INT NOT NULL DEFAULT 1,
  referential TEXT NOT NULL DEFAULT 'AFNOR_SPEC_2314',
  prompt_text TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (name, version)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.audit_prompt_templates TO authenticated;
GRANT ALL ON public.audit_prompt_templates TO service_role;

ALTER TABLE public.audit_prompt_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read templates"
  ON public.audit_prompt_templates FOR SELECT
  TO authenticated
  USING (public.check_is_admin_user(auth.uid()));

CREATE POLICY "Admins insert templates"
  ON public.audit_prompt_templates FOR INSERT
  TO authenticated
  WITH CHECK (public.check_is_admin_user(auth.uid()));

CREATE POLICY "Admins update templates"
  ON public.audit_prompt_templates FOR UPDATE
  TO authenticated
  USING (public.check_is_admin_user(auth.uid()));

CREATE POLICY "Admins delete templates"
  ON public.audit_prompt_templates FOR DELETE
  TO authenticated
  USING (public.check_is_admin_user(auth.uid()));

-- 2. Audits exécutés
CREATE TABLE public.audit_runs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  template_id UUID REFERENCES public.audit_prompt_templates(id) ON DELETE SET NULL,
  template_name TEXT,
  template_version INT,
  prompt_snapshot TEXT NOT NULL,
  scope_label TEXT NOT NULL,
  scope_context_json JSONB,
  model_used TEXT,
  launched_by UUID,
  launched_by_email TEXT,
  launched_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running','completed','failed')),
  report_json JSONB,
  report_markdown TEXT,
  global_score INT,
  maturity_level TEXT,
  domain_scores JSONB,
  error_message TEXT,
  is_public BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_runs_launched_at ON public.audit_runs (launched_at DESC);
CREATE INDEX idx_audit_runs_slug ON public.audit_runs (slug);

GRANT SELECT ON public.audit_runs TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.audit_runs TO authenticated;
GRANT ALL ON public.audit_runs TO service_role;

ALTER TABLE public.audit_runs ENABLE ROW LEVEL SECURITY;

-- Public can see public completed audits
CREATE POLICY "Public reads public audits"
  ON public.audit_runs FOR SELECT
  TO anon, authenticated
  USING (is_public = true AND status = 'completed');

-- Admins read all
CREATE POLICY "Admins read all audits"
  ON public.audit_runs FOR SELECT
  TO authenticated
  USING (public.check_is_admin_user(auth.uid()));

CREATE POLICY "Admins insert audits"
  ON public.audit_runs FOR INSERT
  TO authenticated
  WITH CHECK (public.check_is_admin_user(auth.uid()));

CREATE POLICY "Admins update audits"
  ON public.audit_runs FOR UPDATE
  TO authenticated
  USING (public.check_is_admin_user(auth.uid()));

CREATE POLICY "Admins delete audits"
  ON public.audit_runs FOR DELETE
  TO authenticated
  USING (public.check_is_admin_user(auth.uid()));

-- 3. Trigger updated_at
CREATE TRIGGER trg_audit_prompt_templates_updated
  BEFORE UPDATE ON public.audit_prompt_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_audit_runs_updated
  BEFORE UPDATE ON public.audit_runs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. Seed du prompt AFNOR SPEC 2314 v1
INSERT INTO public.audit_prompt_templates (name, version, referential, prompt_text, is_active)
VALUES (
  'AFNOR SPEC 2314 — IA Frugale',
  1,
  'AFNOR_SPEC_2314',
  $PROMPT$Tu es un expert en éco-conception numérique et en IA responsable. Tu vas réaliser un audit complet de cette application selon le référentiel AFNOR SPEC 2314 — Référentiel général pour l'IA frugale (juin 2024), publié par le Ministère de la Transition Écologique et l'AFNOR.

Analyse l'intégralité du code, de l'architecture, des données, des modèles utilisés et des choix d'infrastructure de cette application, puis produis un rapport d'audit structuré selon les critères ci-dessous.

GRILLE D'ÉVALUATION (100 POINTS)

DOMAINE 1 — PERTINENCE & GOUVERNANCE (25 pts)
1.1 — Justification du recours à l'IA (10 pts)
- Nécessité de l'IA vs solution non-IA démontrée (3 pts)
- Expression de besoin documentée centrée utilisateur (3 pts)
- Alternatives non-IA évaluées (2 pts)
- Niveau de performance exigé justifié (2 pts)
1.2 — Gouvernance & cycle de vie (8 pts)
- Frugalité intégrée comme critère explicite (2 pts)
- Cycle de vie complet pris en compte (2 pts)
- Critères objectifs de ré-entraînement (2 pts)
- Fin de vie planifiée (2 pts)
1.3 — Effets rebond & impacts indirects (7 pts)
- Effets de second ordre identifiés (3 pts)
- Contre-mesures prévues (2 pts)
- Comparaison avec scénario de référence sans IA (2 pts)

DOMAINE 2 — MODÈLE & ALGORITHME (25 pts)
2.1 — Choix et dimensionnement du modèle (10 pts)
- Modèle le plus frugal sélectionné (3 pts)
- Techniques de compression (3 pts)
- A/B testing performance/ressources (2 pts)
- Décomposition en petits modèles spécialisés (2 pts)
2.2 — Entraînement frugal (8 pts)
- Coût environnemental estimé a priori (2 pts)
- Planification en faible intensité carbone (2 pts)
- Early stopping ou équivalents (2 pts)
- Entraînements ratés comptabilisés (2 pts)
2.3 — Réutilisation & partage (7 pts)
- Modèles pré-entraînés open source réutilisés (3 pts)
- Modèle produit partageable / documenté (2 pts)
- Code ré-implémentable multi-environnement (2 pts)

DOMAINE 3 — DONNÉES (25 pts)
3.1 — Qualité et pertinence (10 pts)
- Qualité priorisée sur la quantité (3 pts)
- Critères de qualité définis et vérifiés (3 pts)
- Jeux de données open source pour prototypage (2 pts)
- Données synthétiques utilisées (2 pts)
3.2 — Maîtrise des volumes (8 pts)
- Politique d'unicité de la donnée (2 pts)
- Compression des données (2 pts)
- Stockage différencié selon fréquence d'usage (2 pts)
- Politique d'archivage et de suppression (2 pts)
3.3 — Cycle de vie des données (7 pts)
- Étapes spécification → collecte → vérification → prétraitement documentées (3 pts)
- Données temporaires supprimées après usage (2 pts)
- Données supprimées en fin de service (2 pts)

DOMAINE 4 — INFRASTRUCTURE & RESSOURCES (25 pts)
4.1 — Optimisation des équipements (10 pts)
- Équipements existants prioritairement réutilisés (3 pts)
- Ressources dimensionnées au plus juste (3 pts)
- Environnements dev/test s'éteignent automatiquement (2 pts)
- Inférence embarquée envisagée (2 pts)
4.2 — Énergie & localisation (8 pts)
- Datacenters choisis selon intensité carbone (3 pts)
- PUE connu et optimisé (2 pts)
- WUE pris en compte (1 pt)
- Calculs lourds planifiés hors heures de pointe (2 pts)
4.3 — Mesure et monitoring (7 pts)
- Outils de mesure intégrés — CodeCarbon, EcoLogits, Green Algorithms (3 pts)
- Tableau de bord environnemental (2 pts)
- Indicateurs suivis en production (2 pts)

NIVEAUX DE MATURITÉ
- 0–25 : Non-conforme — Risques environnementaux majeurs
- 26–50 : Insuffisant — Améliorations urgentes requises
- 51–70 : En progression — Bonnes pratiques partiellement adoptées
- 71–85 : Conforme — IA frugale largement respectée
- 86–100 : Exemplaire — Référence en matière d'IA frugale

Produis ton rapport via l'outil structuré fourni (submit_audit_report). Sois rigoureux, justifie chaque score, et appuie chaque point fort ou amélioration sur une bonne pratique AFNOR (BP01 à BP31).$PROMPT$,
  true
);
