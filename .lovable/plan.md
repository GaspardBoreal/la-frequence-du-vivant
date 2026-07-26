## Constat (vérifié en base)

Pour la propriété **Jardin Monde DEVIAT** :

| Source | Total | Détail |
|---|---|---|
| `get_propriete_biodiversity` (espace Propriété) | **226** | Animalia 99 · Plantae 101 · Fungi 3 · Unknown 23 |
| `get_exploration_species_count` (Mon espace › Taxons observés) | **226** | animalia 99 · plantae 101 · fungi 3 · others 23 |
| `get_exploration_species_pool` (liste affichée) | **226** | — |

Les chiffres sont donc **déjà identiques** : même déduplication (`lower(unaccent(...))` + alias de curation), même filtrage par rayon Haversine, même union snapshots ∪ observations marcheurs.

Il reste deux vrais problèmes :

1. **Libellés en anglais** dans l'interface : le bandeau « En appui — biodiversité connue » affiche les clés brutes du règne (`3 Fungi`, `101 Plantae`, `23 Unknown`, `99 Animalia`), alors que Mon espace dit « Faune / Flore / Champignons ». Idem pour les filtres de la carte « Cortège révélé » (`Plantae`, `Animalia`, `Fungi`, `Other`).
2. **Aucune garantie structurelle** que les deux compteurs restent alignés : ce sont deux fonctions SQL distinctes, et si la propriété est reliée à des événements de plusieurs explorations, l'agrégation propriété et la vue marcheur pourraient divergier à l'avenir.

## Ce qu'on met en place

### 1. Vocabulaire français unique des règnes
Créer un helper partagé (`src/lib/kingdomLabels.ts`) :
- normalisation d'une clé de règne quelconque (`Plantae`, `plants`, `Aves`, `Insecta`, `Unknown`, `Other`, `null`) vers 4 catégories, exactement comme `SpeciesExplorer` ;
- libellés FR : **Flore**, **Faune**, **Champignons**, **Autres / indéterminés** (singulier/pluriel gérés) ;
- ordre d'affichage stable : Flore → Faune → Champignons → Autres.

### 2. Compteur de propriété branché sur la fonction de Mon espace
Nouveau hook `usePropertySpeciesCount(proprieteId)` :
- récupère les `exploration_id` des événements liés (même requête que `usePropertySpeciesPool`) ;
- appelle **`get_exploration_species_count`** pour chacune (la fonction utilisée par Mon espace › Biodiversité) ;
- fusionne côté client les listes `species` par nom scientifique normalisé (évite tout double comptage si plusieurs explorations partagent des espèces) ;
- expose `total`, `byKingdom` (4 catégories FR) et `explorationIds`.

L'espace Propriété consomme ce hook pour tous les chiffres d'espèces / règnes : « Espèces observées », « Règnes présents », bandeau « En appui », synthèse. `usePropertyBiodiversity` reste la source des données non-espèces (événements, dates de dernière observation, top espèces).

### 3. Écrans corrigés
- `TabAnalyze.tsx` — bandeau « En appui — biodiversité connue » : puces en français, ordre stable, catégorie « Autres / indéterminés », total affiché à côté du titre.
- `BiodiversityEvidenceBlock.tsx` — cartes « Espèces observées » / « Règnes présents » alimentées par le nouveau hook, puces de règnes en français avec leurs icônes.
- `TabSynthesize.tsx` — lignes « Espèces observées » et « Règnes présents » alignées sur le même compteur.
- `RevealMapBlock.tsx` — chips de filtre en français (Tout · Flore · Faune · Champignons), couleurs et logique de filtrage inchangées.

### 4. Vérification
- Comparaison chiffrée pour DEVIAT : le total affiché dans la Propriété doit être **226**, identique à Mon espace (99 Faune · 101 Flore · 3 Champignons · 23 Autres).
- Contrôle visuel via capture de `/propriete/jardin-monde-deviat` (onglets J'analyse et Portrait) pour confirmer l'absence de tout libellé anglais.

## Détails techniques

- Aucune migration SQL : les deux RPC existantes suffisent, on cesse simplement d'utiliser `kingdoms` brut de `get_propriete_biodiversity` pour l'affichage.
- Le hook réutilise le cache react-query par exploration (`['exploration-species-count', id]`), donc aucun appel réseau supplémentaire si la vue marcheur a déjà chargé la donnée.
- Aucun changement de logique métier de comptage : dédup, rayon et alias restent gérés côté SQL.
