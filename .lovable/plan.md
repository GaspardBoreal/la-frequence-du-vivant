# Fix : fullscreen trophique invisible quand ouverte depuis un Sheet/Dialog parent

## Cause

`TrophicFullscreenProvider` est monté à la racine `App` → sa `Dialog.Portal` est frère du Sheet parent dans le DOM, pas descendant React. Radix applique `hideOthers()` et le focus trap du Sheet sur la fullscreen, et les z-index `z-50` se marchent dessus.

## Solution (2 volets)

### A. Monter un provider imbriqué à l'intérieur du Sheet parent

**`src/components/biodiversity/SpeciesGalleryDetailModal.tsx`**
- Importer `TrophicFullscreenProvider`.
- Wrapper le contenu de `<SheetContent>` avec `<TrophicFullscreenProvider>{...}</TrophicFullscreenProvider>`.
- Le `useTrophicFullscreen()` de `SpeciesTrophicPosition` (via context) résout alors le provider **le plus proche** (imbriqué), qui monte sa `Dialog.Root` en descendant React du Sheet → Radix reconnaît le nested dialog, désactive proprement le focus trap parent, ne marque plus la fullscreen inerte.

Le provider racine dans `App.tsx` reste en place pour tous les autres points d'appel (Carte, Analyse IA, chatbot…) où aucun Sheet parent n'est ouvert.

### B. Empilement au-dessus du Sheet

**`src/components/biodiversity/species-modal/trophic-fullscreen/TrophicFullscreenModal.tsx`**
- Passer overlay + content de `z-50` → **`z-[60]`** (Sheet reste à `z-50`). Garantit un rendu au-dessus même si l'ordre DOM change.

### C. Micro-hardening du bouton Agrandir (facultatif mais utile)

**`src/components/biodiversity/species-modal/SpeciesTrophicPosition.tsx`**
- Sur les deux boutons `expand()` (pastille + calque), ajouter `onPointerDown={(e) => e.stopPropagation()}` pour éviter qu'un handler `onPointerDownOutside` d'un ancêtre Radix ne consomme l'événement.

## Vérification

1. `tsgo` OK.
2. Playwright headless : ouvrir `/marches-du-vivant/mon-espace/exploration/:id`, ouvrir un drawer espèce, cliquer sur la pastille « Agrandir » de la mini-scène, screenshot → l'overlay noir de la fullscreen doit couvrir toute la fenêtre avec Constellation/Spirale/Réseau visible en haut.
3. Vérifier que fermer la fullscreen ne ferme pas le drawer espèce parent (nested dialog OK).
4. Vérifier depuis un point d'appel hors drawer (pastille dans Analyse IA future) : la fullscreen s'ouvre via le provider racine.

## Fichiers modifiés

- `src/components/biodiversity/SpeciesGalleryDetailModal.tsx` — wrapper `TrophicFullscreenProvider` autour du contenu du Sheet.
- `src/components/biodiversity/species-modal/trophic-fullscreen/TrophicFullscreenModal.tsx` — `z-[60]` sur Overlay et Content.
- `src/components/biodiversity/species-modal/SpeciesTrophicPosition.tsx` — `stopPropagation` sur `onPointerDown` des deux triggers.
