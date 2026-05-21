## Problème

**Trichodes alvearius** (Coléoptère mangeur d'abeilles) affiche une photo iNat aléatoire (fetch live) au lieu d'une des 2 photos terrain prises par Gaspard Boréal (marcheur éditorial) et stockées dans le snapshot iNat de l'event.

## Cause racine

Dans `useExplorationSpeciesPool.ts`, la règle actuelle ne couvre pas le cas où :
- Aucune `marcheur_observations` directe pour l'espèce
- Mais des `species_data[].photos[]` existent dans le snapshot, dont certaines avec `attributions[].observerName` = marcheur éditorial de l'event

Résultat : `imageUrl = null` → `CuratedSpeciesCard` fallback sur `useSpeciesPhoto` qui appelle iNat live (photo aléatoire hors périmètre).

## Règle complète à appliquer

**Priorité photo vignette** (4 niveaux) :

1. **Upload direct marcheur** — `marcheur_observations.photo_url` la plus récente (déjà implémenté)
2. **Photo iNat postée par un marcheur éditorial** — `species_data.photos[i]` dont `attributions[i].observerName` (NFD normalisé) matche un nom de marcheur de l'exploration, la plus récente
3. **Première photo du snapshot** — `species_data.photos[0]` (toujours une observation réelle dans le rayon de l'event)
4. **iNat live** — fallback `useSpeciesPhoto` uniquement si le snapshot n'a aucune photo

Toutes les URLs iNat sont normalisées en `/medium.jpg` (vs `/square.jpg`) pour une vignette nette.

## Modification

### `src/hooks/useExplorationSpeciesPool.ts`

1. Étendre la requête `biodiversity_snapshots` pour récupérer aussi `species_data` complet (déjà fait) **et garder seulement le snapshot le plus récent par marche** (parité avec `useSpeciesMarcheurPhotos`).
2. Ajouter une requête `exploration_marcheurs` (prénom + nom) → construire un Set des noms normalisés (NFD, lower, trim).
3. Pendant la passe snapshots, pour chaque espèce, parcourir `photos[]` + `attributions[]` :
   - Si une attribution matche un marcheur éditorial → mémoriser cette photo comme **"field photo via iNat"** avec sa date.
   - Sinon, mémoriser la 1re photo du snapshot comme **fallback "snapshot photo"**.
4. Lors du calcul final de `imageUrl` :
   - Priorité 1 : `marcheur_observations.photo_url` la plus récente (déjà fait)
   - Priorité 2 : meilleure "field photo via iNat" (la plus récente)
   - Priorité 3 : meilleure "snapshot photo"
   - Priorité 4 : laisser `null` → composant fallback sur iNat live
5. Toutes les URLs iNat issues du snapshot → normalisées via `.replace('/square.', '/medium.')`.

### Normalisation NFD (réutiliser la même logique que ailleurs)

```ts
const normName = (s: string) =>
  s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
```

## Hors-scope

- Pas de changement visuel sur la carte.
- Pas de modification du carrousel détaillé (déjà conforme via `useSpeciesMarcheurPhotos`).
- Pas de fix sur les autres consommateurs : tous lisent `species.imageUrl` du pool → correctif propagé automatiquement.

## Vérification

1. Recharger Apprendre → L'Œil sur Deviat.
2. **Trichodes alvearius** : doit afficher l'une des 2 photos `inaturalist-open-data.s3.amazonaws.com/photos/662558593/medium.jpg` ou `662208790/medium.jpg` (postées par Gaspard Boréal).
3. **Azurés / Polyommatus** et papillons précédents : doivent toujours montrer la photo marcheur (régression nulle).
4. Une espèce sans aucune photo (ni marcheur, ni snapshot) : doit toujours fallback sur iNat live.
