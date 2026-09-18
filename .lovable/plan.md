# Base de connaissance Fréquence Jardin

Objectif : rassembler en un seul endroit tout ce qui permet de répondre aux questions des
utilisateurs de Fréquence Jardin — jardinier inscrit, visiteur non inscrit, paysagiste,
équipe support — puis offrir un écran d'administration pour créer, sourcer et valider les
fiches manquantes.

## 1. Ce qui existe déjà (relevé fait sur la base et le code)

**Données vivantes d'un jardin** (déjà exploitables, volumes réels aujourd'hui)
- 11 jardins, 7 analyses de sol, 9 diagnostics de flore, 9 palettes végétales
- 3 tours de jardin et 30 actions, 2 entretiens fondateurs et 13 points validés
- 3 consultations (clinique), 13 objets/ouvrages, 1 zone, 42 424 mesures de capteurs
- Biodiversité : espèces des marches liées au jardin, 162 espèces étiquetées par fonction,
  819 fiches de répartition géographique

**Savoirs de référence déjà écrits, mais dispersés dans le code**
- Plantes bio-indicatrices, palette végétale, nuancier, inspirations, recommandations
  d'ouvrages, vocabulaire du sol, méthodes d'étude de sol : environ 2 900 lignes réparties
  dans huit fichiers non consultables ni modifiables par l'équipe
- Pages publiques : 52 pages au catalogue de recherche, dont le pilier Fréquence Jardin
  et ses guides
- 10 fiches de maladies et ravageurs en base ; la table des ouvrages est vide

**Ce qui manque aujourd'hui**
- Aucune trace de questions réellement posées : le journal des échanges de l'Assistant est
  en place mais encore vide (journalisation très récente)
- Aucun savoir sur : arrosage, taille, semis et calendrier, compost, maladies courantes
  au-delà des 10 fiches, gestes d'entretien saison par saison
- Aucune réponse cadrée aux questions de non-inscrits : ce qu'est Fréquence Jardin, prix,
  données personnelles, différence avec La Fréquence du Vivant et Les Marches du Vivant
- Aucun endroit où l'équipe peut écrire, sourcer et valider une fiche

## 2. Ce que nous construisons

### a. Une cartographie vivante des sources
Un inventaire consultable dans l'application, qui liste chaque source de savoir, son état
(présente / partielle / absente), son volume réel et les questions qu'elle permet de
couvrir. Il se met à jour tout seul à partir de la base, sans chiffre saisi à la main.

### b. Un référentiel de fiches de connaissance
Une fiche = une réponse à une question, écrite ou reprise d'une source, avec :
titre, question(s) couverte(s), réponse courte (celle que cite l'Assistant), réponse
détaillée, public visé, univers, sources citées avec lien et date, statut
(brouillon → à relire → publiée), auteur, relecteur et date de validation, historique des
modifications.

Les savoirs aujourd'hui figés dans le code sont repris comme fiches de départ, avec leur
source d'origine indiquée — rien n'est réécrit ni réinventé au passage.

### c. Un écran d'administration
`/admin/outils/connaissance`, quatre onglets :
1. **Cartographie** — l'état des sources, les trous à combler, priorisés par le nombre de
   questions concernées.
2. **Fiches** — liste filtrable (public, univers, statut, source manquante), création,
   édition, validation en deux temps, recherche plein texte.
3. **Questions** — le registre des questions à couvrir : celles que vous fournirez, plus
   celles extraites automatiquement des échanges avec l'Assistant dès qu'ils arrivent.
   Chaque question est reliée à zéro, une ou plusieurs fiches ; celles sans fiche
   remontent en tête.
4. **Couverture** — un tableau de bord : part des questions couvertes par public, fiches
   sans source, fiches non relues depuis plus de six mois.

### d. Règles de rigueur
- Une fiche publiée sans source citée est impossible.
- Une fiche reprise d'une source externe garde le lien et la date de consultation.
- Une fiche issue d'un entretien validé reste verrouillée, comme aujourd'hui.
- Aucune donnée personnelle d'un jardin ne devient une fiche : les fiches sont générales,
  les données propres à un jardin restent dans le jardin.

## 3. Périmètre de cette étape

Cette étape livre la cartographie, le référentiel et l'écran d'administration, avec les
fiches de départ reprises de l'existant. Le branchement de l'Assistant sur ce référentiel
et la page publique de questions fréquentes feront l'objet d'une étape suivante, une fois
que vous aurez validé un premier lot de fiches.

## 4. Détails techniques

- Migration : `kb_articles`, `kb_article_sources`, `kb_questions`, `kb_question_articles`,
  `kb_article_versions`. RLS administrateurs ; lecture publique réservée aux fiches
  publiées et marquées publiques ; `GRANT` explicites par rôle.
- `search_vector` (tsvector français, `unaccent`) + index GIN pour la recherche plein texte.
- Trigger de version : toute modification d'une fiche publiée archive l'ancienne version.
- RPC `get_kb_coverage()` : agrège l'état des sources depuis les tables réelles
  (`proprietes`, `propriete_soil_diagnostics`, `garden_pathogens_kb`, `site_pages`,
  `species_eco_tags_kb`, `assistant_messages`…), sans chiffre codé en dur.
- Import initial : script d'amorçage idempotent depuis `plantIndicatorKb`, `plantPaletteKb`,
  `nuancierKb`, `inspirationsKb`, `ouvrageRecoKb`, `etudeDeSolMethodes`,
  `src/content/frequenceJardin/*`, avec `stable_id` par fiche.
- Extraction des questions : requête d'agrégation sur `assistant_messages` (rôle
  utilisateur), regroupement par similarité lexicale, proposition à valider — jamais
  d'insertion automatique.
- Front : `src/pages/AdminConnaissance.tsx`, composants sous
  `src/components/admin/connaissance/`, hooks sous `src/hooks/admin/useKnowledge*.ts`,
  route ajoutée dans `src/App.tsx` et carte dans `AdminOutilsHub.tsx`.
