# Correctif robuste : crash navigateur sur zoom des photos (Découvrir → Enfant)

## Diagnostic

Le crash (PC, tablette, smartphone) est causé par une **explosion mémoire/GPU** dans la lightbox de zoom. Trois causes combinées :

1. **Source image trop lourde.** `photoUrl()` renvoie l'URL **originale** d'iNaturalist (souvent 3000–5000 px de large, 2–5 Mo). À `maxScale=5×`, le navigateur doit composer une texture de ~20 000 px de large. Sur Safari iPad / Chrome Android, la limite de texture WebGL/canvas (4096–16384 px) est dépassée → onglet/process tué. Sur PC, le GPU sature.
2. **Trop de re-renders pendant le pan/zoom.** `onTransform` de `react-zoom-pan-pinch` se déclenche à chaque frame (~60 fps). Chaque tick fait un `setScale()` qui re-render `ZoomInner` **entier** (toolbar, TransformComponent, image). Sur tablette, ça gèle l'UI.
3. **Animations concurrentes en arrière-plan.** Quand la lightbox est ouverte, les cartes Memory continuent à animer (`motion.div` rotateY + spring) sous le `Dialog`. Le navigateur garde le compositing actif sur l'image énorme + l'animation framer-motion → OOM.

Symptôme observé dans la session : zoom à 5.0× puis reset → l'utilisateur ferme, l'app a déjà craché silencieusement le compositor.

## Plan de correctif

### A. Source image bridée (le plus impactant)

Créer `src/components/biodiversity/discover/modes/games/zoomImageSrc.ts` : helper `safeZoomSrc(url)` qui :
- Remplace les patterns iNaturalist `/original.` → `/large.` (max 1024 px) et `/medium.` reste tel quel.
- Pour les URLs Supabase Storage : ajoute `?width=1600&quality=80` si non présent (transformation Supabase Image).
- Sinon retourne l'URL telle quelle (photos terrain déjà raisonnables).

Texture cible : ≤ 1600 px de côté ; à 4× zoom = 6400 px, sous la limite Safari (16384) et sous la pression mémoire critique.

### B. Brider et stabiliser la lightbox (`ZoomLightbox.tsx`)

- `maxScale: 5 → 4`, `wheel.step: 0.2 → 0.15`, `doubleClick.step: 1.8 → 2`.
- **Throttle `onTransform`** : au lieu de `setScale` à chaque tick, mettre à jour seulement si `|new - old| > 0.05` **ET** via `requestAnimationFrame`. Évite les renders cascade.
- Mémoïser `ZoomToolbar` (`React.memo`) pour qu'il ne re-render que sur changement de scale réel.
- Image : ajouter `decoding="async"`, `fetchPriority="high"`, `style={{ willChange: 'transform' }}` (déjà géré par TransformComponent), **retirer** `select-none` via classe et utiliser `draggable={false}` + `pointer-events` natif.
- Ajouter un **garde-fou** : si `naturalWidth × maxScale > 12000`, ramener `maxScale` dynamiquement (`Math.min(4, 12000 / naturalWidth)`).
- Précharger l'image en `new Image()` **avant** d'afficher la lightbox afin d'éviter le flash + double décodage par TransformComponent.

### C. Couper les animations sous-jacentes pendant la lightbox

Dans `MemoryGame.tsx`, `WhoAmIGame.tsx`, `KingdomSortGame.tsx`, `ZoomDetailGame.tsx` :
- Quand `zoomCard` / lightbox est ouverte, passer une prop `inert` à la grille des cartes (`<div inert>` + `pointer-events-none`) et désactiver les `motion.div` (`animate={false}` ou `transition={{ duration: 0 }}`).
- Plus simple et suffisant : **conditionner le rendu** de la grille `cards.map(...)` à `!zoomOpen`. Non — perd l'état visuel. À la place : ajouter `style={{ visibility: zoomOpen ? 'hidden' : 'visible' }}` sur le wrapper grid → le compositor ne dessine plus rien sous la lightbox. Économise GPU sans casser l'état React.

### D. Robustesse Dialog

- Ajouter un `DialogTitle` invisible (`VisuallyHidden`) dans `ZoomLightbox` pour supprimer les warnings Radix vus en console et éviter side-effects a11y.
- Retirer `onClick={() => onOpenChange(false)}` sur `DialogContent` : laisser Radix gérer le clic-overlay natif (le custom + stopPropagation interne créent des bugs de pan qui ferment la lightbox par mégarde sur tablette).
- Ajouter `onWheel` `e.stopPropagation()` au niveau du conteneur lightbox pour ne pas faire scroller la page derrière.

### E. Sécurité supplémentaire

- Ajouter un **error boundary** local `<ZoomErrorBoundary>` autour de `<ZoomInner>` : si crash, affiche un message et ferme proprement la lightbox au lieu de propager.
- Ajouter `useEffect` de cleanup : à `unmount`, force `setZoomCard(null)` côté MemoryGame (déjà partiel via `[round]`, généraliser).

## Fichiers touchés

```text
src/components/biodiversity/discover/modes/games/
├── zoomImageSrc.ts                 (NEW)  helper safeZoomSrc + computeSafeMaxScale
├── ZoomLightbox.tsx                (EDIT) throttle, memo, maxScale dynamique, DialogTitle a11y, error boundary
├── MemoryGame.tsx                  (EDIT) visibility:hidden sur grille pendant zoom + safeZoomSrc
├── WhoAmIGame.tsx                  (EDIT) idem
├── KingdomSortGame.tsx             (EDIT) idem
└── ZoomDetailGame.tsx              (EDIT) idem
```

Aucune modif backend, aucune dépendance ajoutée.

## Tests après build

1. Tablette iPad Safari : Memory → ouvrir loupe → zoomer à fond → pan → fermer. Aucun crash.
2. Smartphone Android Chrome : pinch agressif × 10 → reset → fermer. RAM stable.
3. PC : ouvrir 5 fois consécutives la lightbox sur différentes cartes. Pas de fuite (perf devtools).
4. Vérifier que la grille Memory ne « rebondit » plus quand la lightbox est ouverte (CPU baisse).
5. Confirmer que `naturalWidth × maxScale` reste sous 12000 dans la console pour 10 espèces iNat.
