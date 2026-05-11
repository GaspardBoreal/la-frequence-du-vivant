## Diagnostic

Sur l'exploration **DEVIAT** (`20dd3be8…`), il s'agit bien de **deux observations iNaturalist distinctes** du même observateur (Gaspard Boréal), probablement de la même plante :

| Obs iNat | Date | Lat / Lon | Identification | Affichage actuel |
|---|---|---|---|---|
| [345237977](https://www.inaturalist.org/observations/345237977) | 2026-03-22 | 45.41412, 0.00908 | `Symphytum × uplandicum` (espèce hybride) | « Consoude de Russie » |
| [360520743](https://www.inaturalist.org/observations/360520743) | 2026-05-11 | 45.41405, 0.00921 | `Symphytum` (genre seul) | « Consoude » |

Les deux points sont à **~10 m** l'un de l'autre, même chemin (Route de Brossac), même observateur. La 2e observation est volontairement laissée au rang de **genre** sur iNat (l'observateur n'a pas tranché l'espèce). Notre pool d'espèces (`useExplorationSpeciesPool`) déduplique strictement par `scientificName`, donc il les garde séparées — ce qui est **techniquement correct mais visuellement trompeur** : un genre et une espèce de ce genre apparaissent comme deux entrées.

Ce n'est pas un bug GPS — c'est un défaut de **fusion taxonomique** : une observation au rang « genre » devrait être absorbée par une observation au rang « espèce » du **même genre**, dans le **même périmètre** d'exploration.

## Plan : fusion taxonomique genre ↔ espèce

### 1. Nouveau utilitaire `src/utils/taxonomyMerge.ts`

Fonction `mergeGenusIntoSpecies(species: RawSpecies[]): RawSpecies[]` :

- Pour chaque entrée, extraire le **genre** = premier mot du `scientificName` (ex. `Symphytum × uplandicum` → `Symphytum`, `Symphytum` → `Symphytum`).
- Identifier les entrées « genre seul » : `scientificName` = un seul mot capitalisé.
- Pour chaque entrée « genre seul », chercher si **une ou plusieurs entrées « espèce »** partagent le même genre dans le pool.
  - Si **exactement une espèce** du genre existe → fusionner : on garde l'entrée espèce (plus précise), on cumule `count`, on conserve l'image existante si l'espèce n'en a pas, et on rattache les `marcheIds` couverts.
  - Si **plusieurs espèces** du même genre coexistent → on **n'absorbe pas** (ambigu) : la consoude « genre » resterait un signal légitime « non identifiée plus finement ».
  - Si **aucune espèce** du genre → garder l'entrée genre telle quelle.

### 2. Brancher la fusion dans `useExplorationSpeciesPool.ts`

Avant l'enrichissement français (`frMap`), passer `Array.from(map.values())` dans `mergeGenusIntoSpecies(...)`.

### 3. Appliquer la même fusion côté `useSpeciesObservers` / fiche espèce

Quand on ouvre la fiche `Symphytum × uplandicum`, on doit voir **les deux observations** (la 345237977 ET la 360520743), pas seulement celle au rang espèce. Étendre `useSpeciesObservers` :

- Si `scientificName` est binomial (ex. `Symphytum × uplandicum`), inclure aussi les attributions dont le `scientificName` snapshot vaut **uniquement le genre** (`Symphytum`), à condition qu'aucune autre espèce du même genre ne soit présente dans l'exploration. La même règle que la fusion garantit la cohérence.

### 4. Petit indicateur visuel sur la fiche (optionnel mais utile)

Sur la modale espèce, ajouter une mention discrète sous le nom :
*« 1 observation rattachée au rang du genre »* lorsqu'une fusion a eu lieu — pour ne rien cacher de la donnée source iNat.

## Hors-scope

- Pas de modification du schéma Supabase ni des snapshots stockés (la fusion est calculée à la volée côté client).
- Pas de fusion sur la base de proximité GPS seule : on s'appuie uniquement sur la **hiérarchie taxonomique** (genre/espèce), beaucoup plus sûre et déterministe.
- Pas de changement aux compteurs Fréquence (ils sont calculés ailleurs et déjà dédupliqués via les alias).

## Détails techniques

- `scientificName` au rang genre = pas d'espace ou suffixe `sp.` / `spp.` (à gérer aussi).
- Le `×` (hybride) doit être traité comme un caractère normal du nom binomial — déjà OK avec un simple split sur espace.
- La fusion s'applique **par exploration**, pas globalement, pour rester contextuelle.
