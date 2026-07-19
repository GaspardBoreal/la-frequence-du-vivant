## Objectif
Enrichir le bandeau de filtres au-dessus de « Doublons probables détectés » dans `src/pages/AdminTaxonomyCuration.tsx` avec un tri et une recherche textuelle.

## Changements

### 1. Nouveaux états locaux
- `sortMode: 'count' | 'genus'` — défaut `'count'` (nb doublons décroissant).
- `search: string` — recherche libre.

### 2. Nouveaux contrôles UI (dans la Card de filtres existante)
Ajouter une seconde ligne (grid 2 colonnes) :
- **Select « Trier par »** : « Nombre de doublons (défaut) » | « Genre (A→Z) ».
- **Input « Rechercher une espèce »** : placeholder « nom scientifique ou vernaculaire… ».

### 3. Logique de filtrage/tri appliquée au `useMemo` `suspects`
- **Filtre** : garder un groupe si au moins une `row` matche `search` (insensible casse/accents) sur `scientific_name` OU `common_name` OU sur le `genus`.
- **Tri** :
  - `count` → somme des `row.count` du groupe, décroissant (comportement actuel amélioré).
  - `genus` → alphabétique sur `genus`.

### 4. Compteur affiché
Le titre « Doublons probables détectés (N) » reflète le résultat filtré.

## Hors périmètre
Aucune modification backend, aucun changement de la liste « Espèces observées » ni de la logique de fusion.
