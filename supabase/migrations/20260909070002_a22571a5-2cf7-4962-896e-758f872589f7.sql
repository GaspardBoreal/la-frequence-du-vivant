CREATE TABLE public.site_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  path text NOT NULL UNIQUE,
  title text NOT NULL,
  subtitle text,
  univers text,
  keywords text[] NOT NULL DEFAULT '{}',
  priority integer NOT NULL DEFAULT 0,
  featured boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.site_pages TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.site_pages TO authenticated;
GRANT ALL ON public.site_pages TO service_role;

ALTER TABLE public.site_pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Pages visibles publiquement" ON public.site_pages
  FOR SELECT USING (is_active = true OR is_admin_user());
CREATE POLICY "Admins gèrent les pages" ON public.site_pages
  FOR ALL USING (is_admin_user()) WITH CHECK (is_admin_user());

CREATE TABLE public.site_search_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  position integer NOT NULL DEFAULT 0,
  match_type text NOT NULL DEFAULT 'path_prefix',
  pattern text NOT NULL,
  univers text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.site_search_rules TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.site_search_rules TO authenticated;
GRANT ALL ON public.site_search_rules TO service_role;

ALTER TABLE public.site_search_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Règles visibles publiquement" ON public.site_search_rules
  FOR SELECT USING (is_active = true OR is_admin_user());
CREATE POLICY "Admins gèrent les règles" ON public.site_search_rules
  FOR ALL USING (is_admin_user()) WITH CHECK (is_admin_user());

CREATE TRIGGER site_pages_updated_at BEFORE UPDATE ON public.site_pages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER site_search_rules_updated_at BEFORE UPDATE ON public.site_search_rules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.site_search_rules (position, match_type, pattern, univers, note) VALUES
  (10, 'path_prefix', '/jardin', 'jardin', 'Espace Fréquence Jardin'),
  (11, 'path_prefix', '/propriete', 'jardin', null),
  (12, 'path_prefix', '/etude-de-sol', 'jardin', null),
  (13, 'keyword', 'jardin', 'jardin', null),
  (14, 'keyword', 'sol', 'jardin', null),
  (20, 'keyword', 'viti', 'vignoble', 'Mots du vignoble'),
  (21, 'keyword', 'vini', 'vignoble', null),
  (22, 'keyword', 'château', 'vignoble', null),
  (23, 'keyword', 'vignoble', 'vignoble', null),
  (24, 'keyword', 'vin', 'vignoble', null),
  (30, 'path_prefix', '/marches-du-vivant', 'marches', null),
  (31, 'path_prefix', '/marche', 'marches', null),
  (32, 'path_prefix', '/m/', 'marches', null),
  (33, 'keyword', 'marche', 'marches', null),
  (40, 'keyword', 'tourisme', 'ecotourisme', null),
  (41, 'keyword', 'itinérance', 'ecotourisme', null),
  (42, 'keyword', 'patrimoine', 'ecotourisme', null),
  (43, 'keyword', 'séjour', 'ecotourisme', null);

INSERT INTO public.site_pages (path, title, subtitle, univers, keywords, priority, featured) VALUES
  ('/', 'La Fréquence du Vivant', 'Accueil : explorations, marches et sciences participatives', 'vivant', ARRAY['accueil','vivant','biodiversité'], 100, true),
  ('/jardin/demarrer', 'Démarrer mon jardin', 'Créer ou rejoindre un jardin Fréquence Jardin', 'jardin', ARRAY['jardin','démarrer','inscription'], 90, true),
  ('/jardin/bienvenue', 'Bienvenue dans Fréquence Jardin', 'Premiers pas dans votre espace jardin', 'jardin', ARRAY['jardin','bienvenue'], 70, false),
  ('/roadmap/frequence-jardin', 'Fréquence Jardin — la fiche', 'La vision, les outils et la feuille de route du jardin', 'jardin', ARRAY['jardin','fiche','roadmap'], 80, true),
  ('/etude-de-sol', 'Étude de sol', 'Comprendre son sol : structure, texture, pH, vie', 'jardin', ARRAY['sol','carotte','analyse','jardin'], 75, true),
  ('/partners/soil-acoustics', 'Acoustique des sols', 'Écouter la vie du sol avec nos partenaires', 'jardin', ARRAY['sol','acoustique','partenaire'], 40, false),
  ('/marches-du-vivant', 'Les Marches du Vivant', 'Le programme de marches et de sciences participatives', 'marches', ARRAY['marche','vivant','programme'], 95, true),
  ('/marches-du-vivant/explorer', 'Explorer les marches', 'Toutes les marches à découvrir', 'marches', ARRAY['marche','explorer'], 85, true),
  ('/marches-du-vivant/carte-marches-du-vivant', 'La carte des marches', 'Voir les marches sur la carte', 'marches', ARRAY['carte','marche','territoire'], 85, true),
  ('/marches-du-vivant/carnets-de-terrain', 'Carnets de terrain', 'Les carnets publiés par les marcheurs', 'marches', ARRAY['carnet','terrain','marcheur'], 80, false),
  ('/marches-du-vivant/entreprises', 'Marches en entreprise', 'Une offre pour les entreprises', 'marches', ARRAY['entreprise','offre','rse'], 70, false),
  ('/marches-du-vivant/agriculture', 'Marches et agriculture', 'Agroécologie et pratiques de terrain', 'marches', ARRAY['agriculture','agroécologie'], 70, false),
  ('/marches-du-vivant/partenaires', 'Nos partenaires', 'Ils marchent avec nous', 'marches', ARRAY['partenaire'], 60, false),
  ('/marches-du-vivant/association', 'L''association', 'Le projet associatif', 'marches', ARRAY['association','adhésion'], 60, false),
  ('/marches-du-vivant/connexion', 'Connexion / Mon espace', 'Rejoindre son espace marcheur', 'marches', ARRAY['connexion','mon espace','compte'], 55, false),
  ('/marches-techno-sensibles', 'Marches techno-sensibles', 'Capteurs, sons et sensibilité', 'marches', ARRAY['capteur','technologie','marche'], 45, false),
  ('/explorations-sensibles', 'Explorations sensibles', 'Des parcours à vivre autrement', 'ecotourisme', ARRAY['exploration','sensible','itinérance'], 60, true),
  ('/galerie-fleuve', 'La galerie fleuve', 'Le récit du fleuve, en images et en sons', 'ecotourisme', ARRAY['fleuve','galerie','patrimoine'], 60, true),
  ('/explorations', 'Toutes les explorations', 'Les territoires explorés', 'ecotourisme', ARRAY['exploration','territoire','séjour'], 55, false),
  ('/bioacoustique-poetique', 'Bioacoustique poétique', 'Écouter les paysages sonores', 'ecotourisme', ARRAY['bioacoustique','son','poésie'], 50, false),
  ('/atlas-climatique', 'Atlas climatique', 'Le climat du territoire, en cartes', 'vivant', ARRAY['climat','atlas','météo'], 45, false),
  ('/meteo-historique', 'Météo historique', 'Remonter le temps météorologique', 'vivant', ARRAY['météo','historique'], 35, false),
  ('/entretiens', 'Les entretiens', 'Paroles de celles et ceux qui font le vivant', 'vivant', ARRAY['entretien','portrait','interview'], 70, true),
  ('/agent-ia', 'L''agent IA', 'Un compagnon pour comprendre le vivant', 'vivant', ARRAY['ia','agent','assistant'], 55, false),
  ('/ia-frugale/outils-de-mesure', 'IA frugale : les outils de mesure', 'CodeCarbon, EcoLogits, Green Algorithms, Comparia', 'vivant', ARRAY['ia','frugale','carbone','énergie'], 65, true),
  ('/api-mcp', 'API & MCP', 'L''écosystème de données ouvert', 'vivant', ARRAY['api','mcp','données'], 40, false),
  ('/trust-in-frequence-vivant', 'Confiance & transparence', 'Nos engagements de transparence', 'vivant', ARRAY['confiance','transparence','éthique'], 45, false),
  ('/roadmap', 'La feuille de route', 'Ce que nous construisons, semaine après semaine', 'vivant', ARRAY['roadmap','feuille de route'], 50, false),
  ('/materiel-pedagogique', 'Matériel pédagogique', 'Ressources à télécharger et à partager', 'vivant', ARRAY['pédagogie','ressource','école'], 45, false),
  ('/dordonia', 'Dordonia', 'La rivière qui parle', 'vivant', ARRAY['dordogne','rivière','fiction'], 45, false),
  ('/sauniers', 'Les sauniers de l''Île de Ré', 'Sel, eau, argile et vivant', 'ecotourisme', ARRAY['sel','saunier','île de ré','patrimoine'], 50, false),
  ('/adhesion', 'Adhérer', 'Rejoindre l''association', 'vivant', ARRAY['adhésion','soutien','association'], 50, false);