## Diagnostic

Le clic « tap parcelle » ouvre **immédiatement le drawer** (`setDrawerOpen(true)` dans `handleCadastreTap`), ce qui :

1. **Masque la carte** sous le drawer → impossible d'ajuster finement la position du repère avant validation.
2. Affiche **deux UI concurrentes** au-dessus : la pill ambre « Glissez le repère, puis validez » (qui appartient au flux confirm-before-drawer) ET le drawer lui-même → confusion visuelle.

Le flux historique (`handleStartCreate` → marqueur draggable → pill « Valider » → `handleConfirmCreate` ouvre le drawer) est correct ; il faut s'y aligner pour le tap cadastre.

## Plan de résolution

### `src/components/community/exploration/ExplorationCarteTab.tsx` — `handleCadastreTap`
- Retirer `setDrawerOpen(true)` : on s'arrête à la pose du marqueur draggable.
- Conserver `setCreatePosition({ lat, lng })`, `setIsCreatingMarche(true)`, `setIsCadastreTapMode(false)`.
- L'utilisateur peut alors glisser le repère, puis cliquer **Valider** sur la pill ambre → `handleConfirmCreate` ouvre le drawer (comportement existant).
- **Annuler** sur la pill retombe via `handleCancelCreate` (déjà OK).

### Résultat attendu
- Tap parcelle → marqueur posé exactement sous le clic + pill ambre « Glissez le repère, puis validez ».
- Carte intégralement visible, repère ajustable au doigt/souris.
- Clic « Valider » → drawer « Nouvelle marche » s'ouvre avec la position consolidée.

Aucune autre modification (UI/CSS/drawer) nécessaire.
