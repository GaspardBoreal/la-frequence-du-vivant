# Atlas du cortège : retrouver les photos manquantes à l'impression

Sur la planche imprimée, l'Achillée millefeuille apparaît sans photo alors que l'application en ligne affiche bien une photo de terrain. La vignette reste vide (ni photo, ni picto de secours).

## Cause

L'atlas d'impression rapproche les photos de terrain par **égalité stricte** du nom : il cherche `Achillea millefolium` ou `Achillée millefeuille` dans le pool d'espèces de la propriété. Or l'observation du marcheur est enregistrée au **genre** : `Achillea` / « Achillée ». Aucune correspondance, donc aucune photo de terrain. Et si la photo de référence distante ne charge pas, l'image cassée laisse un cadre vide au lieu du pictogramme de famille.

## Ce qui change

- L'atlas réutilise la logique de rapprochement déjà employée à l'écran (nom exact, puis genre, puis nom vernaculaire) pour retrouver la photo de terrain. L'Achillée retrouve sa photo.
- Le badge « Terrain » ne s'affiche que lorsque la photo vient réellement du marcheur.
- Si une image échoue au chargement, la vignette bascule automatiquement sur le pictogramme de famille : plus jamais de case vide.

## Détails techniques

- `src/components/propriete/identify/print/FloraAtlasPrintPlates.tsx` :
  - remplacer la table `fieldByName` (exact seulement) par un index à trois niveaux — nom scientifique normalisé, genre, nom vernaculaire normalisé — aligné sur `src/lib/plantIndicatorMatcher.ts` (`norm` + `genus`, suffixes `sp.`/`spp.` retirés) ;
  - résolution photo : terrain exact → terrain genre → terrain vernaculaire → `useSpeciesThumbs` (cache serveur) → picto `FamilyIcon` ;
  - ajouter un `onError` sur `<img>` qui masque l'image et révèle le fallback picto.
- Aucun changement de données ni de mise en page ; les autres planches restent identiques.
