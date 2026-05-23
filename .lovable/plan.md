## Diagnostic

`SpeciesPhotoModeProvider` n'est monté qu'à l'intérieur de `SpeciesExplorer` (liste des espèces). Toutes les ouvertures de `SpeciesGalleryDetailModal` qui passent par CE composant héritent donc du Provider et démarrent en mode `marcheur` dès qu'il y a des photos terrain.

Les 3 autres entrées ouvrent le même modal mais **hors Provider** → `useSpeciesPhotoMode()` retombe sur le fallback no-op codé en dur à `mode: 'inaturalist'`. D'où l'incohérence :

| Chemin | Ouvre via | Sous Provider ? | Mode initial |
|---|---|---|---|
| Synthèse → Pouls du vivant → jour → espèce | `DayDetailDrawer` | ❌ | iNat (KO) |
| Synthèse → Liste espèces → jour → espèce | `SpeciesExplorer` | ✅ | Marcheur (OK) |
| Marches → … → espèce | `SpeciesExplorer` | ✅ | Marcheur (OK) |
| Apprendre → L'œil → espèce | `OeilCuration` | ❌ | iNat (KO) |

Autres call-sites du même modal qui souffrent du même bug latent : `BiodiversityMap`, `EmblematicSpeciesGallery`, `BiodiversityTestPanel`.

## Correctif

**1. Hisser le Provider au niveau de la page exploration**

Dans `src/components/community/ExplorationMarcheurPage.tsx`, envelopper le rendu par `<SpeciesPhotoModeProvider explorationId={explorationId}>`. Toutes les vues (Synthèse, Pouls du vivant, Liste espèces, Marches, Apprendre/L'œil, Carte) partagent alors **un seul** Provider — donc une seule préférence persistée et le même mode initial.

**2. Supprimer le Provider local dans `SpeciesExplorer`**

Évite un double-Provider qui réinitialiserait le state localement. `SpeciesExplorer` reste consommateur (`useSpeciesPhotoMode`) sans monter son propre Provider.

**3. Aucun changement à `SpeciesPhotoCarousel`**

La logique d'init existante (`mode === 'marcheur' && firstFieldIdx >= 0 → scrollTo(firstFieldIdx)`) est déjà bonne : une fois sous Provider, le carousel ouvre automatiquement sur la photo marcheur dès qu'elle existe.

**4. Vérification**

- Rejouer les 4 chemins : tous doivent ouvrir sur la photo marcheur quand elle existe (Campanule à feuilles de pêcher).
- Vérifier que le toggle global Photos marcheurs ↔ iNaturalist (déjà présent dans la barre Synthèse) reste cohérent entre vues.
- Vérifier que le storage `species-photo-mode:<explorationId>` n'est écrit qu'une fois et partagé.

## Fichiers modifiés

- `src/components/community/ExplorationMarcheurPage.tsx` — wrap avec `SpeciesPhotoModeProvider`
- `src/components/biodiversity/SpeciesExplorer.tsx` — retirer le `<SpeciesPhotoModeProvider>` local
