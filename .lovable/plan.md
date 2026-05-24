# Compteurs dynamiques — Taxons observés

## Constat

Dans `SpeciesExplorer.tsx`, seul le filtre trophique a des compteurs dynamiques (déjà branchés sur `filteredBeforeTrophic`). Les autres compteurs sont calculés à partir de `species` brut :

- `categoryStats` (Toutes / Faune / Flore / Champignons / Autres) — onglets **et** dropdown Catégories
- `contributorsBySource` + `totalContributors` (Marcheurs / eBird / iNat / GBIF)
- (par cohérence) compteurs implicites des Sources et Audio dans leurs dropdowns

Résultat actuel : sélectionner "Consommateurs primaires" filtre bien les cartes (8 espèces) mais les onglets affichent toujours 115/.../... et le dropdown contributeurs montre 16.

## Principe : "leave-one-out"

Chaque compteur d'un filtre F doit refléter ce qui resterait si on appliquait **tous les filtres actifs sauf F**. C'est le pattern déjà utilisé par `filteredBeforeTrophic` pour le filtre trophique.

On généralise avec **une fonction unique** `applyFilters(species, active, skip?)` qui applique les 6 filtres (`category`, `source`, `audio`, `search`, `tags`, `trophic`, `contributor`) en pouvant en sauter un.

```text
            applyFilters(species, S)            → filteredSpecies (grille + onglet actif)
applyFilters(species, S, skip:'category')       → base pour compteurs onglets/Catégories
applyFilters(species, S, skip:'contributor')    → base pour compteurs contributeurs
applyFilters(species, S, skip:'source')         → base pour compteurs Sources
applyFilters(species, S, skip:'audio')          → base pour compteurs Audio
applyFilters(species, S, skip:'trophic')        → base pour compteurs trophiques (remplace filteredBeforeTrophic)
```

## Changements `SpeciesExplorer.tsx`

1. **Refactor du pipeline de filtrage** : extraire une fonction pure locale `applyFilters(list, opts, skip?)` qui applique chaque prédicat conditionnellement à `skip !== 'X'`. Supprime les blocs `if` dupliqués actuels.

2. **5 bases mémoïsées** (une par dimension de compteur) :
   - `baseForCategory` = applyFilters(species, …, skip:'category')
   - `baseForContributor` = applyFilters(species, …, skip:'contributor')
   - `baseForSource` = applyFilters(species, …, skip:'source')
   - `baseForAudio` = applyFilters(species, …, skip:'audio')
   - `baseForTrophic` = applyFilters(species, …, skip:'trophic')  *(remplace `filteredBeforeTrophic`)*
   - `filteredSpecies` = applyFilters(species, …) *(sans skip — résultat final)*

3. **Compteurs recalculés** :
   - `categoryStats` ← dérivé de `baseForCategory` (impacte onglets `<Tabs>` + dropdown Catégories)
   - `contributorsBySource` + `uniqueMarcheurs` + `totalContributors` ← dérivés de `baseForContributor`
   - `sourceCounts` (nouveau, 3 valeurs) affichés dans le dropdown Sources : `GBIF (n) / iNat (n) / eBird (n)` à partir de `baseForSource`
   - `audioCounts` (nouveau, 2 valeurs) dans le dropdown Audio : `Avec audio (n) / Sans audio (n)` à partir de `baseForAudio`
   - `trophicCounts` ← dérivé de `baseForTrophic`

4. **Désactivation visuelle** des options à 0 (déjà fait pour trophique : `disabled + opacity-40`) — étendue aux dropdowns Catégories / Sources / Audio / Contributeurs pour ne jamais proposer un cul-de-sac.

5. **Onglet auto-fallback** : si l'utilisateur est sur l'onglet `faune` et qu'un filtre passe `categoryStats.faune` à 0 alors qu'une autre catégorie est non-vide, un `useEffect` repositionne `selectedCategory` sur `'all'` (évite l'écran "Aucune espèce…" piégeux).

6. **Reset filtre fantôme** : si `selectedContributor` n'apparaît plus dans `baseForContributor` (car un autre filtre l'a évincé), on le laisse sélectionné mais on l'affiche désactivé en tête de liste (badge "0") — l'utilisateur voit pourquoi le résultat est vide et peut cliquer "Tous".

## Détails techniques

- **Coût** : 6 passages de filtre sur `species` (≤ quelques centaines d'éléments) à chaque changement de filtre → négligeable. Pas besoin de mémoïser au-delà de `useMemo` par base.
- **Ordre des prédicats** dans `applyFilters` : du plus discriminant au moins coûteux (search → tags → category → source → audio → contributor → trophic) pour minimiser les comparaisons.
- **Source unique de vérité** : un seul tableau d'options actives `active = { category, source, audio, search, tags, trophic, contributor }` passé à `applyFilters` — toute future colonne s'ajoute en un point.
- **Aucun changement** à `BiodiversityTimeline` (le graphe "Pouls du vivant" reste branché sur `species` total — c'est la légende historique, à confirmer si l'on veut aussi le filtrer).
- **Hors scope** : `SpeciesGalleryDetailModal`, Carte tab (déjà branché sur `filteredSpecies` via `mapContent(filteredSpecies)`), localStorage persistence.

## Question ouverte (1)

Le graphe **Pouls du vivant** (115 espèces depuis le 1er mai) doit-il aussi refléter les filtres actifs (passerait à 8 points cumulés "Consommateurs primaires"), ou rester une vue panoramique stable de l'exploration ? Mon avis : **stable**, c'est la mémoire de l'exploration ; les filtres servent à explorer le pool, pas à réécrire l'historique. À confirmer.
