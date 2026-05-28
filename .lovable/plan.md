## Problème

Sur la vignette « Pic épeiche » (Marches → Vivant → onglet Vivant, carte `EnhancedSpeciesCard`), l'image affichée n'est pas un Pic épeiche : c'est la 1re photo de l'observation iNaturalist correspondante (souvent un cliché d'habitat quand l'oiseau est identifié au chant). Le composant ne tombe pas en fallback sur la photo de référence iNat (`useSpeciesPhoto` → taxa API) parce que `species.photoData` existe déjà — même s'il pointe vers une photo non pertinente.

## Règle cible

Pour les espèces dont la source est iNaturalist et sans photo marcheur (terrain / upload direct), la vignette doit utiliser la **photo de référence du taxon** (taxa API iNat) plutôt que la 1re photo de l'observation. La photo de l'observation reste accessible dans la fiche détaillée (carrousel obs).

Cascade vignette (ordre de priorité) :

1. Photo marcheur (upload direct ou attribution iNat → marcheur)
2. Photo de référence iNat du taxon (`useSpeciesPhoto`)
3. Icône royaume (fallback générique)

La 1re photo d'observation iNat brute n'est plus utilisée comme illustration vignette.

## Changements

### 1. `src/components/audio/EnhancedSpeciesCard.tsx`

- Élargir la condition `shouldFetchPhoto` : déclencher `useSpeciesPhoto` dès que `species.photoData` n'est pas une photo marcheur certifiée (i.e. `source !== 'marcheur'` et `source !== 'citizen'`).
- Recomposer `inatPhoto` pour préférer `fetchedPhotoData` (taxon ref) à `species.photoData` quand cette dernière vient d'une observation iNat.
- La pastille source bottom-right reste : « iNat » (taxon ref) vs « Photo marcheur » vs fallback ambre.

### 2. Vérifier `SpeciesCardWithPhoto.tsx` (Synthèse → Taxons observés, mode fiche/immersion)

Même logique : `species.photos?.[0]` doit être considéré comme « photo marcheur » uniquement si effectivement marqué comme tel. Sinon, préférer la ref taxon. Adapter `shouldFetch` et `photoUrl` en conséquence.

### 3. `src/components/species/SpeciesThumb.tsx`

Ajouter un prop optionnel `localPhotoIsField?: boolean` (default `true`) — si `false`, traiter `localPhoto` comme une photo d'observation iNat et préférer le fallback `useSpeciesPhoto`.

### 4. Pas de changement BD ni d'edge function

Tout reste côté front, cohérent avec la mémoire `species-thumb-inat-fallback-logic`.

## QA

- Pic épeiche (identifié au chant, 1 obs iNat, 0 photo marcheur) → doit afficher l'oiseau via taxa API.
- Espèce avec photo marcheur → inchangé, photo marcheur visible.
- Espèce iNat avec une vraie photo d'espèce dans l'observation → vignette = taxon ref (cohérence visuelle), observation visible dans le carrousel de la fiche.
- Aucune régression sur le toggle Photos marcheurs ↔ iNaturalist.

## Mémoire à mettre à jour

`mem://features/community/species-thumb-inat-fallback-logic` : préciser que la photo d'observation iNat n'est jamais utilisée comme vignette ; la vignette est toujours soit marcheur, soit ref taxon, soit icône royaume.
