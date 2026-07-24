## Contexte

Sur `/propriete/:slug` onglet **J'identifie**, bloc « Ce que la Fréquence du Vivant sait déjà » :

1. Les vignettes affichent des photos iNaturalist alors que l'app marcheurs (Biodiversité → Taxons observés) affiche en priorité les **photos réellement prises par les marcheurs**.
2. Le bloc « Répartition par règne » (Fungi · 3, Plantae · 100, Unknown · 23, Animalia · 98) fait doublon avec les onglets Faune/Flore/Champignons/Autres déjà affichés par `SpeciesExplorer` juste en-dessous.

## Diagnostic

**Photos marcheurs manquantes**
- `SpeciesExplorer` résout les photos terrain via `useExplorationFieldPhotos(explorationId)` — un seul `explorationId`.
- Notre propriété agrège N explorations via `usePropertySpeciesPool`, mais ne passe qu'un `latestExplorationId` à `SpeciesExplorer`. Résultat : seules les photos terrain de la dernière marche remontent, les autres retombent sur iNat.
- Le champ `photos[]` de `BiodiversitySpecies` n'inclut aujourd'hui qu'une photo (résolue via `resolvePhoto`), pas la stack complète des photos marcheurs multi-marches.

**Doublon règnes**
- `SpeciesExplorer` fournit déjà les onglets règnes avec compteurs — la ligne « Répartition par règne » au-dessus est redondante.

## Modifications

### 1. `src/hooks/propriete/usePropertySpeciesPool.ts`
- Enrichir la fusion pour collecter **toutes** les URLs de photos marcheurs (`marcheur_attrs[*].photo_url`) accumulées à travers TOUTES les explorations, triées par date desc.
- Alimenter `photos: string[]` de `BiodiversitySpecies` avec la stack complète (photos marcheurs d'abord, puis fallback iNat), pour que `SpeciesExplorer` / `SpeciesThumb` les affichent en priorité indépendamment de l'`explorationId` passé.

### 2. `src/components/propriete/BiodiversityEvidenceBlock.tsx`
- Supprimer le bloc `Répartition par règne` (lignes ~104-123).
- Conserver le reste inchangé (KPIs repliables + `SpeciesExplorer`).

## Détails techniques

- `resolvePhoto` devient `resolvePhotos(sp): string[]` qui concatène toutes les `photo_url` marcheurs (dédupliquées, triées par `observation_date` desc) puis les photos iNat en fallback.
- Lors de la fusion multi-marches, on concatène les stacks des doublons scientifiques et on dédup les URLs.
- `SpeciesExplorer` / `SpeciesThumb` consomment déjà `species.photos[0]` avec fallback iNat — aucun changement côté consumer.

## Résultat attendu

- Vignettes du bloc affichent les vraies photos terrain marcheurs (comme dans l'app marcheurs), fallback iNat uniquement si aucune photo terrain.
- Section règnes redondante supprimée : le bloc s'ouvre directement sur `SpeciesExplorer` avec ses propres onglets règnes.