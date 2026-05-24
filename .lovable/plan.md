## Constat

Le pill `Marcheurs (113)` affiche `speciesWithFieldPhotos` venant de `SpeciesPhotoModeContext` — c'est la **taille totale** de la map `fieldPhotos.byScientificName` calculée une fois pour toute l'exploration. Aucun lien avec les filtres actifs du `SpeciesExplorer` (catégorie, sources, audio, recherche, tags, trophique, contributeur).

D'où : sélectionner "Décomposeurs & recycleurs" filtre la grille à 5 espèces, mais le pill reste à 113 (= 113 espèces de l'exploration ont au moins une photo terrain, point).

Côté iNat il n'y a même pas de compteur → asymétrie visuelle.

## Cause architecturale

`SpeciesPhotoModeContext` est un provider global (au niveau `ExplorationLayout`), volontairement découplé des composants consommateurs. Il ne connaît pas la liste filtrée de `SpeciesExplorer`. C'est correct : le contexte doit rester la source de vérité "univers complet de l'exploration".

La responsabilité du **compteur contextuel** appartient donc au consommateur (`SpeciesExplorer`), qui sait quel sous-ensemble est affiché.

## Solution — props de surcharge sur `SpeciesPhotoModeToggle`

1. **Ajouter deux props optionnelles** au composant :
   ```ts
   counts?: { marcheur: number; inaturalist: number };
   total?: number;             // fallback si counts non fourni
   ```
   - Par défaut (props absentes) : comportement actuel = `speciesWithFieldPhotos` côté marcheur, pas de count iNat. Aucune régression sur les autres usages.
   - Si `counts` fourni : on affiche les deux compteurs (Marcheurs + iNat) en mode tabular-nums, dynamiques.

2. **Dans `SpeciesExplorer`**, calculer les deux compteurs à partir de `filteredSpecies` (résultat de `applyFilters`, déjà disponible) :
   ```ts
   const photoModeCounts = useMemo(() => {
     let m = 0;
     for (const sp of filteredSpecies) {
       if (fieldPhotos.get(normalizeSpeciesKey(sp.scientificName))?.length) m++;
     }
     return { marcheur: m, inaturalist: filteredSpecies.length };
   }, [filteredSpecies, fieldPhotos]);
   ```
   - `marcheur` = nb d'espèces filtrées **qui ont aussi une photo terrain** (= "ce que vous verriez réellement en mode Marcheurs sur la sélection courante").
   - `inaturalist` = nb total d'espèces filtrées (en mode iNat, toutes ont au moins la photo de référence).

3. **Passer les counts** : `<SpeciesPhotoModeToggle counts={photoModeCounts} />`.

4. **Pill iNat** affiche désormais aussi sa pastille de compteur (cohérence visuelle, attendu utilisateur dans la copie écran).

5. **Cas zéro** (filtre vidant le mode actif) : si `counts.marcheur === 0` et `mode === 'marcheur'`, la pill reste cliquable mais sa pastille est en `opacity-50` — l'utilisateur comprend qu'il n'y a aucune photo terrain pour ce sous-ensemble, sans qu'on le force à basculer (pas de bascule automatique : on ne casse jamais la préférence utilisateur).

## Résultat attendu (exemple Décomposeurs)

- Filtre trophique = Décomposeurs (5 espèces).
- Pill : `Marcheurs (X)` où X = nombre des 5 espèces ayant ≥ 1 photo terrain ; `iNaturalist (5)`.
- Les compteurs se mettent à jour à chaque changement de filtre (catégorie, trophique, recherche, contributeur, etc.) — leave-one-out non nécessaire ici car les pills ne sont pas des filtres mais un sélecteur de **rendu** ; le compteur reflète donc le résultat final `filteredSpecies`.

## Hors scope

- Aucune modification du contexte global `SpeciesPhotoModeContext` (rétro-compatibilité totale pour les autres écrans).
- Aucune modification de `BiodiversityTimeline`, modal espèce, autres pages.
