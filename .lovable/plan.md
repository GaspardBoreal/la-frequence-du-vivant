# Fix "Agrandir" trophique — z-index vs Sheet

## Diagnostic pro

Le composant `Sheet` de ce projet (`src/components/ui/sheet.tsx`) est customisé avec **`z-[1100]`** sur l'overlay ET le content (pas le `z-50` standard shadcn).

Notre `TrophicFullscreenModal` utilise `z-[60]`. Résultat : la modale plein écran **s'ouvre bien** (Radix Portal vers `document.body`), mais elle est **stackée en dessous** du drawer `SpeciesGalleryDetailModal`. Sur la copie d'écran fournie, on voit clairement le header "Place trophique — Syrphe ceinturé" + les chips à gauche (zone non couverte par le Sheet), et le drawer opaque qui recouvre tout le reste.

Les tentatives précédentes (wrap Provider dans SheetContent, `stopPropagation`) n'adressaient pas la vraie cause : c'est un pur problème de **couches CSS**.

## Correctif (minimal, ciblé)

### 1. `src/components/biodiversity/species-modal/trophic-fullscreen/TrophicFullscreenModal.tsx`
Passer les deux `z-[60]` (Overlay + Content) → **`z-[1200]`** pour passer au-dessus du Sheet (`z-[1100]`) tout en restant sous d'éventuels toasts globaux.

### 2. `src/components/biodiversity/SpeciesGalleryDetailModal.tsx` — nettoyage
Retirer le `TrophicFullscreenProvider` imbriqué ajouté précédemment. Le provider racine dans `App.tsx` suffit (Radix Portal sort déjà de l'arbre DOM du Sheet ; le focus trap Radix gère naturellement les modales frères montées après). Cela évite deux hosts concurrents et un double `useTrophicChain`.

### 3. `src/components/biodiversity/species-modal/SpeciesTrophicPosition.tsx`
Conserver la structure actuelle (bouton pill + layer background, `stopPropagation`). Rien à changer côté trigger.

## Vérification

- Ouvrir une espèce dans le drawer → cliquer "Agrandir" → la modale plein écran couvre bien tout le viewport (au-dessus du Sheet).
- Fermer la modale (X ou Escape) → retour au drawer, le drawer reste ouvert.
- Ouvrir "Agrandir" depuis Analyse IA / Trophique (hors drawer) → fonctionne aussi via le provider racine.
- Aucun log d'erreur Radix (nested dialog).

## Portée
Deux petits changements CSS/structure. Zéro impact fonctionnel ailleurs.
