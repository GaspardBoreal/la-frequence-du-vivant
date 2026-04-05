
-- Create enums for insight cards dimensions
CREATE TYPE public.insight_category AS ENUM ('formation', 'inspiration', 'experimentation', 'partage', 'valorisation');
CREATE TYPE public.insight_angle AS ENUM ('biodiversite', 'bioacoustique', 'geopoetique');
CREATE TYPE public.insight_event_type AS ENUM ('agroecologique', 'eco_poetique', 'eco_tourisme');

-- Create insight_cards table
CREATE TABLE public.insight_cards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category insight_category NOT NULL,
  min_level community_role NOT NULL DEFAULT 'marcheur',
  event_types insight_event_type[] NOT NULL DEFAULT '{agroecologique,eco_poetique,eco_tourisme}',
  angles insight_angle[] NOT NULL DEFAULT '{biodiversite,bioacoustique,geopoetique}',
  view TEXT NOT NULL DEFAULT 'both' CHECK (view IN ('empreinte', 'marche', 'both')),
  display_mode TEXT NOT NULL DEFAULT 'both' CHECK (display_mode IN ('card', 'full', 'both')),
  icon_name TEXT DEFAULT 'Lightbulb',
  ordre INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.insight_cards ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read active cards
CREATE POLICY "Authenticated users can read active insight cards"
  ON public.insight_cards FOR SELECT TO authenticated
  USING (active = true);

-- Admins can do everything
CREATE POLICY "Admins can manage insight cards"
  ON public.insight_cards FOR ALL TO authenticated
  USING (public.check_is_admin_user(auth.uid()))
  WITH CHECK (public.check_is_admin_user(auth.uid()));

-- Trigger for updated_at
CREATE TRIGGER update_insight_cards_updated_at
  BEFORE UPDATE ON public.insight_cards
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Index for performance
CREATE INDEX idx_insight_cards_active ON public.insight_cards (active, category, min_level);

-- =============================================
-- SEED: ~30 editorial insight cards
-- =============================================

-- FORMATION - Marcheur level
INSERT INTO public.insight_cards (title, content, category, min_level, event_types, angles, view, display_mode, icon_name, ordre) VALUES
('Qu''est-ce qu''un bio-indicateur ?', 'Les espèces végétales et animales présentes autour de vous ne sont pas là par hasard. Chaque espèce raconte l''histoire du sol, de l''eau et du climat local. Un **bio-indicateur** est une espèce dont la présence (ou l''absence) révèle l''état de santé d''un écosystème. En marchant, vous collectez ces indices précieux.', 'formation', 'marcheur', '{agroecologique}', '{biodiversite}', 'both', 'both', 'Sprout', 1),
('Écouter le vivant : premiers pas en bioacoustique', 'Le paysage sonore d''un lieu est un indicateur puissant de sa biodiversité. Les **oiseaux chantent à l''aube**, les **insectes bourdonnent en journée**, les **amphibiens s''expriment au crépuscule**. Apprenez à distinguer ces couches sonores : c''est le premier pas vers l''inventaire acoustique.', 'formation', 'marcheur', '{agroecologique,eco_poetique,eco_tourisme}', '{bioacoustique}', 'both', 'both', 'Volume2', 2),
('Qu''est-ce que la géopoétique ?', 'La géopoétique, fondée par Kenneth White, propose un **nouveau rapport au monde** : habiter poétiquement la Terre. En marchant, vous ne traversez pas un paysage — vous **entrez en relation** avec lui. Chaque texte, chaque haïku que vous écrivez devient un acte géopoétique.', 'formation', 'marcheur', '{eco_poetique}', '{geopoetique}', 'both', 'both', 'BookOpen', 3),
('Comprendre les données GBIF', 'Le **GBIF** (Global Biodiversity Information Facility) est la plus grande base mondiale de données d''occurrences d''espèces. Quand vous marchez et que nous croisons vos observations avec le GBIF, vous contribuez à un **réseau scientifique mondial**. Chaque espèce observée est une donnée qui compte.', 'formation', 'marcheur', '{agroecologique,eco_tourisme}', '{biodiversite}', 'both', 'both', 'Database', 4),
('Lire un paysage agricole', 'Un champ n''est jamais juste un champ. Les **haies**, les **talus**, les **mares** et les **bandes enherbées** forment un réseau d''habitats essentiels. Apprenez à repérer ces éléments du paysage agroécologique : ils sont les corridors de la biodiversité.', 'formation', 'marcheur', '{agroecologique}', '{biodiversite}', 'marche', 'both', 'Map', 5);

-- FORMATION - Eclaireur level
INSERT INTO public.insight_cards (title, content, category, min_level, event_types, angles, view, display_mode, icon_name, ordre) VALUES
('Protocole d''inventaire floristique simplifié', 'En tant qu''Éclaireur, vous pouvez structurer vos relevés. **Méthode du quadrat** : délimitez 1m², identifiez chaque espèce, estimez son recouvrement (%). Répétez sur 5 points le long de votre marche. Ces données standardisées ont une valeur scientifique réelle.', 'formation', 'eclaireur', '{agroecologique}', '{biodiversite}', 'marche', 'full', 'ClipboardList', 10),
('Spectrogramme : lire le son comme une partition', 'Un **spectrogramme** transforme le son en image : le temps en abscisse, la fréquence en ordonnée, l''intensité en couleur. Chaque espèce a sa **signature sonore** unique. Apprenez à reconnaître les motifs : un chant d''oiseau monte et descend, un insecte produit un bourdonnement continu.', 'formation', 'eclaireur', '{agroecologique,eco_poetique}', '{bioacoustique}', 'both', 'full', 'BarChart3', 11),
('L''art du haïku de terrain', 'Le haïku japonais suit une structure 5-7-5 syllabes et capture un **instant présent**. Sur le terrain, laissez vos sens guider l''écriture : un bruissement, une odeur, un mouvement. Le **kigo** (mot de saison) ancre votre poème dans le cycle naturel. Exemples : *bourgeon* (printemps), *cigale* (été).', 'formation', 'eclaireur', '{eco_poetique}', '{geopoetique}', 'marche', 'full', 'PenTool', 12),
('Identifier les espèces avec iNaturalist', 'L''application **iNaturalist** utilise l''IA pour identifier les espèces à partir de photos. Photographiez plantes, insectes, champignons — l''IA propose une identification que la communauté scientifique valide. Vos observations deviennent des données **grade recherche** après 2 confirmations indépendantes.', 'formation', 'eclaireur', '{agroecologique,eco_tourisme}', '{biodiversite}', 'both', 'both', 'Camera', 13);

-- FORMATION - Ambassadeur level
INSERT INTO public.insight_cards (title, content, category, min_level, event_types, angles, view, display_mode, icon_name, ordre) VALUES
('Méthodologie de suivi temporel des oiseaux (STOC)', 'Le programme **STOC** (Suivi Temporel des Oiseaux Communs) du Muséum national utilise des points d''écoute standardisés. En tant qu''Ambassadeur, vous pouvez appliquer ce protocole : 5 minutes d''écoute, rayon de 100m, 2 passages par saison. Vos données alimentent les indicateurs nationaux de biodiversité.', 'formation', 'ambassadeur', '{agroecologique}', '{biodiversite,bioacoustique}', 'marche', 'full', 'Target', 20),
('Rédiger un rapport d''impact territorial', 'Vos données collectées ont une valeur pour les **collectivités** et les **entreprises**. Un rapport d''impact territorial documente : le nombre d''espèces recensées, leur statut de conservation (UICN), la couverture spatiale, et la comparaison avec les bases de référence (GBIF, INPN).', 'formation', 'ambassadeur', '{agroecologique,eco_tourisme}', '{biodiversite}', 'empreinte', 'full', 'FileText', 21);

-- FORMATION - Sentinelle level
INSERT INTO public.insight_cards (title, content, category, min_level, event_types, angles, view, display_mode, icon_name, ordre) VALUES
('Certification des données : protocole qualité', 'En tant que Sentinelle, vous êtes garant de la qualité des données. **Vérification croisée** : comparez les observations de terrain avec les bases GBIF/INPN. **Validation taxonomique** : confirmez les identifications des marcheurs débutants. **Traçabilité** : chaque observation est horodatée et géolocalisée.', 'formation', 'sentinelle', '{agroecologique}', '{biodiversite}', 'both', 'full', 'ShieldCheck', 30);

-- INSPIRATION - Marcheur level
INSERT INTO public.insight_cards (title, content, category, min_level, event_types, angles, view, display_mode, icon_name, ordre) VALUES
('« Le paysage n''est pas devant nous, nous sommes dedans »', '— **Kenneth White**, fondateur de la géopoétique. En marchant, vous ne traversez pas un décor : vous participez au vivant. Chaque pas est une rencontre avec le sol, l''air, le chant des oiseaux. Laissez cette conscience transformer votre marche en expérience poétique.', 'inspiration', 'marcheur', '{eco_poetique}', '{geopoetique}', 'both', 'both', 'Quote', 40),
('La mésange charbonnière, sentinelle des forêts', 'Présente sur la quasi-totalité des marches, la **mésange charbonnière** (*Parus major*) est un formidable indicateur écologique. Son chant matinal — *tsi-tsi-pou, tsi-tsi-pou* — est l''un des premiers à résonner au printemps. Si elle est là, c''est que l''écosystème forestier fonctionne.', 'inspiration', 'marcheur', '{agroecologique,eco_tourisme}', '{biodiversite,bioacoustique}', 'both', 'card', 'Bird', 41),
('Le silence est aussi une donnée', 'Un lieu silencieux n''est pas un lieu vide. L''**absence de son** peut révéler une pollution sonore qui fait fuir les espèces, ou au contraire un habitat préservé où le silence est une richesse. Documentez aussi les silences : ce sont des données précieuses.', 'inspiration', 'marcheur', '{eco_poetique,eco_tourisme}', '{bioacoustique}', 'marche', 'card', 'VolumeX', 42),
('Chaque marcheur est un capteur vivant', 'Vous êtes le **meilleur capteur de biodiversité** jamais inventé : vos yeux voient ce que les satellites ne captent pas, vos oreilles entendent ce que les micros automatiques manquent, votre intuition repère les anomalies qu''aucun algorithme ne détecte.', 'inspiration', 'marcheur', '{agroecologique,eco_poetique,eco_tourisme}', '{biodiversite,bioacoustique,geopoetique}', 'both', 'card', 'Heart', 43);

-- EXPERIMENTATION - Marcheur level
INSERT INTO public.insight_cards (title, content, category, min_level, event_types, angles, view, display_mode, icon_name, ordre) VALUES
('Exercice : l''écoute des 3 minutes', 'Arrêtez-vous. Fermez les yeux. Pendant **3 minutes**, comptez le nombre de **sources sonores distinctes** que vous percevez : oiseaux, vent, eau, insectes, activité humaine. Notez votre compte. C''est votre premier **indice acoustique** de ce lieu.', 'experimentation', 'marcheur', '{agroecologique,eco_poetique,eco_tourisme}', '{bioacoustique}', 'marche', 'both', 'Timer', 50),
('Défi photo : 5 textures du vivant', 'Photographiez **5 textures naturelles** autour de vous : écorce, lichen, pétale, terre, aile d''insecte. Chaque texture raconte une adaptation évolutive. Partagez vos photos sur votre profil marcheur — elles pourront être identifiées par iNaturalist.', 'experimentation', 'marcheur', '{eco_tourisme,eco_poetique}', '{biodiversite}', 'marche', 'both', 'Camera', 51),
('Écrire un kigo : votre mot de saison', 'Quel est le **mot** qui capture ce que vous ressentez ici, maintenant, en cette saison ? Ce mot — votre **kigo** — deviendra la graine d''un haïku. Écrivez-le dans votre carnet. Exemples : *givre matinal* (hiver), *premiers bourgeons* (printemps), *foin coupé* (été).', 'experimentation', 'marcheur', '{eco_poetique}', '{geopoetique}', 'marche', 'both', 'Feather', 52);

-- EXPERIMENTATION - Eclaireur level
INSERT INTO public.insight_cards (title, content, category, min_level, event_types, angles, view, display_mode, icon_name, ordre) VALUES
('Transect botanique : cartographier la diversité', 'Choisissez un **transect de 100m** le long de votre marche. Tous les 10m, identifiez les espèces végétales dans un rayon de 1m. Photographiez chaque station. En 10 points, vous aurez un **profil de diversité** du paysage traversé. Comparez avec les données GBIF de la zone.', 'experimentation', 'eclaireur', '{agroecologique}', '{biodiversite}', 'marche', 'full', 'Ruler', 55),
('Point d''écoute standardisé', 'Installez-vous à un point fixe pendant **10 minutes**. Notez chaque espèce d''oiseau entendue avec l''heure précise. Distinguez les chants (territoire) des cris (alarme, contact). Ce protocole simplifié alimente les bases de données ornithologiques nationales.', 'experimentation', 'eclaireur', '{agroecologique,eco_tourisme}', '{bioacoustique}', 'marche', 'full', 'Headphones', 56);

-- PARTAGE - Marcheur level
INSERT INTO public.insight_cards (title, content, category, min_level, event_types, angles, view, display_mode, icon_name, ordre) VALUES
('Partagez votre première observation', 'Vous avez vu une espèce, entendu un chant, ressenti un paysage ? **Partagez-le** avec la communauté ! Votre observation, même simple, contribue à la cartographie collective du vivant. Plus nous marchons ensemble, plus nos données deviennent puissantes.', 'partage', 'marcheur', '{agroecologique,eco_poetique,eco_tourisme}', '{biodiversite,bioacoustique,geopoetique}', 'both', 'both', 'Share2', 60),
('Invitez un ami à marcher', 'La communauté des Marcheurs du Vivant grandit par le **bouche-à-oreille**. Partagez votre lien d''invitation et faites découvrir les marches à quelqu''un de votre entourage. Chaque nouveau marcheur enrichit notre regard collectif sur le vivant.', 'partage', 'marcheur', '{agroecologique,eco_poetique,eco_tourisme}', '{biodiversite,bioacoustique,geopoetique}', 'empreinte', 'card', 'UserPlus', 61);

-- PARTAGE - Eclaireur level
INSERT INTO public.insight_cards (title, content, category, min_level, event_types, angles, view, display_mode, icon_name, ordre) VALUES
('Devenez mentor d''un nouveau marcheur', 'En tant qu''Éclaireur, vous pouvez accompagner un marcheur débutant lors de sa prochaine sortie. Partagez vos techniques d''observation, vos astuces d''identification, votre sensibilité au terrain. Le **mentorat** est le cœur de la transmission dans notre communauté.', 'partage', 'eclaireur', '{agroecologique,eco_poetique,eco_tourisme}', '{biodiversite,bioacoustique,geopoetique}', 'both', 'full', 'Users', 65);

-- VALORISATION - Ambassadeur level
INSERT INTO public.insight_cards (title, content, category, min_level, event_types, angles, view, display_mode, icon_name, ordre) VALUES
('Vos données au service de la RSE', 'Les entreprises engagées dans une démarche **CSRD** (Corporate Sustainability Reporting Directive) ont besoin de données de biodiversité locales fiables. Vos relevés de terrain, géolocalisés et horodatés, répondent à cette demande. **Chaque marche produit des données valorisables**.', 'valorisation', 'ambassadeur', '{agroecologique,eco_tourisme}', '{biodiversite}', 'empreinte', 'both', 'Building2', 70),
('Qualité recherche : le standard GBIF', 'Les données collectées par les Marcheurs du Vivant suivent les standards du **GBIF** (Global Biodiversity Information Facility). Quand vos observations sont croisées avec iNaturalist et validées par la communauté, elles atteignent le **grade recherche** : utilisables par les scientifiques.', 'valorisation', 'ambassadeur', '{agroecologique}', '{biodiversite}', 'empreinte', 'full', 'Award', 71),
('Impact territorial : chiffrer votre contribution', 'Sur cette exploration, les marcheurs ont collecté des données sur **X espèces** dans un rayon de **Y km**. Cette couverture spatiale et taxonomique a une valeur : elle complète les inventaires officiels (INPN) et documente l''évolution de la biodiversité ordinaire.', 'valorisation', 'ambassadeur', '{agroecologique,eco_poetique,eco_tourisme}', '{biodiversite}', 'empreinte', 'both', 'TrendingUp', 72);

-- VALORISATION - Sentinelle level
INSERT INTO public.insight_cards (title, content, category, min_level, event_types, angles, view, display_mode, icon_name, ordre) VALUES
('Tableau de bord financeurs', 'En tant que Sentinelle, vous avez accès aux **métriques d''impact** consolidées : nombre d''espèces documentées, couverture géographique, concordance avec les bases de référence, et progression temporelle. Ces indicateurs sont la preuve de la valeur scientifique de notre communauté.', 'valorisation', 'sentinelle', '{agroecologique,eco_poetique,eco_tourisme}', '{biodiversite}', 'empreinte', 'full', 'LayoutDashboard', 80),
('Certification blockchain des données', 'Les données de terrain certifiées par **Brad.ag** (signature atmosphérique blockchain) ajoutent une couche de **confiance vérifiable**. Chaque relevé est ancré dans un registre immuable : preuve de présence, preuve de mesure, preuve de qualité.', 'valorisation', 'sentinelle', '{agroecologique}', '{biodiversite}', 'empreinte', 'full', 'Lock', 81);
