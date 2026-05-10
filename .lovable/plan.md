## Diagnostic

Le clic sur "Voir la carte" **ouvre bien la popup** (les logs confirment : warning React `DialogContent`, tuiles Leaflet chargées dans la session replay, slider à 80 manipulé). Mais **elle est invisible et inaccessible** car cachée derrière le lightbox photo.

### Cause racine — conflit de z-index

| Élément | z-index |
|---|---|
| `MediaLightbox` (overlay plein écran) | `z-[60]` |
| Popover métadonnées dans le lightbox | `z-[70]` |
| `Dialog` shadcn (Overlay + Content) | `z-50` ← trop bas |

La popup s'ouvre **derrière** le voile noir du lightbox → impression que "rien ne s'exécute".

### Indice secondaire

Warning console : `Missing Description or aria-describedby` pour `DialogContent` → manque `DialogDescription` (accessibilité, à corriger en passant).

## Plan de résolution

### 1. Forcer le z-index de la popup carte au-dessus du lightbox
Dans `PhotoLocationDialog.tsx`, passer une `className` à `<DialogContent>` avec `z-[80]`. Mais comme le `DialogOverlay` est rendu en interne par `DialogContent` avec un `z-50` figé, deux options :

- **Option A (ciblée, retenue)** : ne plus utiliser `DialogContent` directement. Importer `DialogPortal`, `DialogOverlay`, `DialogPrimitive.Content` depuis `@radix-ui/react-dialog` et reconstruire un wrapper local qui force overlay + content à `z-[80]` / `z-[81]`. Aucun impact sur les autres dialogs du projet.
- **Option B (rejetée)** : modifier `src/components/ui/dialog.tsx` pour bumper le z-index global → effet de bord sur tous les autres dialogs.

### 2. Corriger l'accessibilité
Ajouter `<DialogDescription className="sr-only">Carte interactive ultra-zoomée sur la position GPS de la photo</DialogDescription>` pour supprimer le warning React.

### 3. Garantir que l'overlay capte le clic en dehors
Vérifier que `onOpenChange(false)` ferme bien la popup en cliquant sur le voile (Radix par défaut) — déjà OK.

### 4. Vérification
- Rouvrir le lightbox d'une photo géolocalisée.
- Cliquer "Voir la carte" → popup visible centrée au-dessus du lightbox, carte zoom 19, marqueur pulsant.
- Vérifier les 3 sliders (style, rayon) + les 2 wahouhh (boussole / Earth 3D).
- Console : plus de warning aria-describedby.

## Hors-scope

Pas de modification du shadcn primitive global, pas de changement de la collecte EXIF, pas de migration SQL.
