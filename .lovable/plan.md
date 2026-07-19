## Analyse du problème

Sur DEVIAT / Jardin Monde, filtre « plantées par marcheurs » :

Données réelles en base (`marcheur_observations`) :
- `Lantana` (genre seul, 4 obs, source `walker_upload`)
- `Lantana camara` (binomial, 1 obs, source `walker_upload`)
- `Viburnum lantana` (autre taxon — épithète « lantana », à ne PAS fusionner)

→ Les deux premières lignes sont le même taxon. Elles apparaissent séparément car le pool d'espèces (`useExplorationSpeciesPool`) construit la clé sur `scientific_name || common_name`, donc « Lantana » et « Lantana camara » sont deux entrées distinctes.

### Cause racine

1. Le utilitaire `mergeGenusIntoSpecies` (dans `src/utils/taxonomyMerge.ts`) existe déjà et gère exactement ce cas (1 espèce du genre → absorption du rang genre). **Il n'est appelé nulle part.**
2. Aucun mécanisme persistant n'existe pour fusionner des paires que la règle automatique ne peut trancher (synonymes iNat/Pl@ntNet, noms vernaculaires libres saisis par les marcheurs, homonymes locaux, sous-espèces vs binomial, mauvaises orthographes).
3. Toute nouvelle synchro iNat/Pl@ntNet ré-écrase les snapshots → une fusion manuelle « one shot » serait perdue à chaque sync.

## Plan proposé

Deux niveaux : (A) fix auto immédiat côté lecture, (B) module admin persistant de curation taxonomique par marche.

### A. Correction immédiate (sans intervention humaine)

Brancher `mergeGenusIntoSpecies` dans `useExplorationSpeciesPool.ts` juste avant l'enrichissement FR. Effet : « Lantana » (genre) est absorbé par « Lantana camara » sur toutes les vues (Galerie/Liste/Découvrir/Score/Chatbot), sans toucher aux données brutes. La règle « 2+ espèces du genre → pas de fusion » protège les cas ambigus. Idempotent : rejoué à chaque render, donc résistant aux syncs.

Étendre `mergeGenusIntoSpecies` pour couvrir aussi le cas « nom vernaculaire libre sans scientifique » (ex. saisie marcheur `common_name = "Lantana"`, `scientific = null`) : si un binomial du pool a un nom FR ou commun matchant (normalisation NFD, lowercase), fusionner.

### B. Nouvel outil Admin — « Curation taxonomique » (`/admin/outils`)

Table de vérité persistante, appliquée à chaque lecture ET aux futures synchros.

**Schéma DB (nouvelle migration)**
- `species_taxonomy_aliases`
  - `marche_id uuid null` (null = règle globale, sinon scopée à une marche)
  - `alias_key text` (clé source normalisée : scientific_name OU common_name en NFD/lower)
  - `canonical_scientific_name text` (cible)
  - `canonical_common_name_fr text null`
  - `reason text` (`genus_merge`, `synonym`, `misspelling`, `vernacular`, `manual`)
  - `created_by`, `created_at`, `updated_at`
  - unique (`marche_id`, `alias_key`)
  - RLS : lecture `authenticated`, écriture réservée admin (`has_role admin`)
- RPC `get_exploration_species_pool` (et son équivalent count) : intégrer un JOIN LEFT sur `species_taxonomy_aliases` (marche_id de l'exploration + alias globaux) qui remappe la clé de regroupement avant le `GROUP BY`. Ainsi la fusion s'applique côté serveur, donc à toutes les vues (Carte, Synthèse, Chatbot, Pack Vivant, Fréquence).

**UI admin — page `AdminOutilsHub` → nouvelle carte « Curation taxonomique »**
1. Sélecteur de marche (ou « Global »).
2. Liste des espèces du pool avec compteur d'obs + vignette + source (marcheur / iNat / Pl@ntNet).
3. Détecteur de doublons probables (affiché en tête, tri par confiance) :
   - même genre + une seule binomiale (règle A auto, déjà « pré-fusionnée »)
   - Levenshtein < 2 sur scientific_name
   - même `taxon_common_name_fr` normalisé
   - synonymes iNat connus (via cache `species_thumb_cache` / taxon GBIF déjà utilisé par `gbif-taxon-search`)
4. Action « Fusionner » : sélection multi-source → choix du canonical → écriture d'un alias par entrée source. Prévisualisation « avant/après » du pool.
5. Action « Séparer » : suppression d'alias.
6. Journal des fusions (audit) avec possibilité de rollback.

**Persistance face aux futures synchros**
- Les snapshots iNat/Pl@ntNet continuent d'insérer les noms bruts (aucune perte).
- Le remappage vit dans `species_taxonomy_aliases`, appliqué à la lecture par la RPC → toute nouvelle observation d'un alias connu est fusionnée automatiquement, sans re-curation.
- Un backfill `apply-taxonomy-aliases` (edge function optionnelle) peut aussi enrichir `snapshot_species_cache` pour les exports statiques.

**Chatbot & Fréquence**
La RPC étant la source unique de vérité (mémoire `unified-species-count-rpc`), les scores et le chatbot héritent automatiquement des fusions — pas de divergence.

### Détails techniques

- `useExplorationSpeciesPool.ts` : ajouter `mergeGenusIntoSpecies(intermediate)` avant l'enrichissement FR ; conserver la clé stable pour les curations existantes en gardant la clé du binomial gagnant.
- Migration SQL : `CREATE TABLE public.species_taxonomy_aliases (...)`, GRANT `select` à `authenticated` + `all` à `service_role`, RLS `select` = `true`, `insert/update/delete` = `has_role(auth.uid(),'admin')`, trigger `updated_at`.
- RPC : `get_exploration_species_pool` refactor — CTE `resolved AS (SELECT *, COALESCE(a.canonical_scientific_name, o.scientific_name) AS canonical_key FROM ... LEFT JOIN species_taxonomy_aliases a ON a.alias_key = normalize(o.scientific_name) OR a.alias_key = normalize(o.common_name))`, puis `GROUP BY canonical_key`.
- UI : nouveau composant `src/pages/AdminTaxonomyCuration.tsx` + hook `useTaxonomyAliases(marcheId)` ; entrée dans `AdminOutilsHub`.
- Mémoire projet à mettre à jour après implémentation (feature `taxonomy-aliases-curation`).

### Livraison suggérée

1. Étape 1 (rapide, résout Lantana) : brancher `mergeGenusIntoSpecies` + extension vernaculaire.
2. Étape 2 : migration `species_taxonomy_aliases` + intégration RPC.
3. Étape 3 : UI admin `/admin/outils` (détection auto + fusion manuelle + audit).