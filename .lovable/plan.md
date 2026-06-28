
# Zoom photo — Découvrir → Enfant

Ajouter un zoom universel, discret et robuste sur **toutes** les images des 4 jeux enfants (Memory, Qui suis-je, Tri Vivant, Chasse aux détails), utilisable au clic (souris) et au geste (tablette / smartphone), sans casser les mécaniques de jeu existantes.

## 1. Principes UX

- **Discrétion** : aucun bouton +/− visible par défaut sur la vignette. Une simple **icône loupe** (`Lucide ZoomIn`, 18px, fond blanc 70 %) apparaît en bas-à-droite au survol/long-press, façon Instagram.
- **Activation explicite** : un tap court conserve la mécanique du jeu (retourner une carte, choisir une réponse, drag). Le zoom s'ouvre via :
  - clic sur la **loupe**,
  - **double-tap** sur l'image,
  - **pinch-to-zoom** à 2 doigts directement sur la vignette (intercepté seulement si écart > 10px, sinon le jeu garde la main).
- **Plein écran "lightbox"** au-dessus de tout (z-index > overlay enfant), fond `bg-black/85 backdrop-blur`. Sortie par : croix, `Esc`, tap hors image, swipe vertical, ou bouton « Revenir au jeu ».
- **Dézoom propre garanti** : à la fermeture, l'état zoom est **toujours** reset (scale=1, pan=0,0). Le jeu reprend exactement où il en était — aucune carte révélée, aucun timer perturbé (pause pendant la lightbox pour « Qui suis-je ? »).
- **Cohérence pédagogique** : dans « Qui suis-je ? », l'image en lightbox respecte le **niveau de flou/masque courant** (pas de triche). Un petit liseré rappelle « Image floutée — utilise les indices 💡 ».

## 2. Interactions zoom dans la lightbox

| Geste | Action |
|---|---|
| Molette / trackpad pinch | Zoom centré sur le curseur |
| Boutons +/− (coin bas-droit) | Pas de 25 %, min 1×, max 4× |
| Double-clic / double-tap | Toggle 1× ↔ 2.5× au point cliqué |
| Pinch 2 doigts | Zoom continu, centré sur le milieu des doigts |
| Drag (1 doigt ou souris) | Pan, clampé aux bords de l'image |
| Swipe vertical (>80px) | Ferme la lightbox |
| Bouton « Réinitialiser » | Visible uniquement si scale > 1 |

Implémentation gestes : **`react-zoom-pan-pinch`** (déjà compatible Vite/React 18, ~10kb, support tactile natif, momentum, double-tap, bornes, pan-clamp). Évite de réinventer Hammer.js et la maths du pinch.

## 3. Composant à créer

**`src/components/biodiversity/discover/modes/games/ZoomableGameImage.tsx`**

Wrapper autour de `GameCardImage` :

```tsx
<ZoomableGameImage
  species={s}
  photoBy={photoBy}
  className="w-full h-full object-cover"
  alt="…"
  // options spécifiques au jeu :
  imageStyle={{ filter: `blur(${blurPx}px)` }}  // WhoAmI
  zoomTrigger="auto"        // 'auto' (loupe + double-tap + pinch) | 'icon-only' | 'disabled'
  onOpen={() => pauseTimer?.()}
  onClose={() => resumeTimer?.()}
  lightboxCaption={<>…nom + indices…</>}
/>
```

Détails internes :
- Loupe discrète : `absolute bottom-2 right-2 bg-white/70 backdrop-blur rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition`, toujours visible sur touch (`@media (hover: none)`).
- Détection double-tap maison (300 ms) → ouvre lightbox + applique zoom 2.5× au point tappé.
- Détection pinch sur la vignette : sur `touchstart` à 2 doigts, `e.preventDefault()` + ouvrir lightbox immédiatement avec initialScale calculé.
- Lightbox via Radix `Dialog` (z-index déjà à 1200, au-dessus de l'overlay enfant). Contenu :
  - `<TransformWrapper minScale={1} maxScale={4} doubleClick={{ mode: 'toggle', step: 1.5 }} pinch={{ step: 5 }} wheel={{ step: 0.2 }} centerOnInit limitToBounds>`
  - Toolbar flottante bas-centre : `−`, scale actuel (`1.8×`), `+`, `↺ reset`, `✕`.
  - Légende manuscrite (police Caveat) avec nom commun + scientifique.

## 4. Intégration dans les 4 jeux

| Jeu | Intégration | Précaution |
|---|---|---|
| **MemoryGame** | Remplacer `GameCardImage` par `ZoomableGameImage` côté face-révélée uniquement (jamais sur le dos). `zoomTrigger='icon-only'` pour ne pas confondre avec le flip. Tap simple = continue à retourner. | Le clic carte doit rester prioritaire ; la loupe utilise `stopPropagation`. |
| **WhoAmIGame** | `ZoomableGameImage` sur le `MysteryFrame`. Transmet `imageStyle={{ filter, clipPath }}` pour respecter le niveau d'indice. Au `onOpen`, geler le score (pas d'auto-malus). | Image floutée reste floutée en lightbox + bandeau « Indice 💡 pour voir mieux ». |
| **KingdomSortGame** | `ZoomableGameImage` sur la carte centrale, mode `'icon-only'` (le drag dnd-kit reste prioritaire). Loupe en haut-gauche pour ne pas gêner le drag handle. | `pointerDown` du dnd-kit ignore les clics sur la loupe (`data-no-dnd`). |
| **ZoomDetailGame** | `ZoomableGameImage` autorisée, initial `transform: scale()` conservé en `imageStyle`. Mode `'icon-only'` (le but du jeu est déjà un détail). | Reset complet à chaque nouvelle manche : `key={round}` force la remontée du composant. |

## 5. Reset robuste

- `TransformWrapper` reçoit `key={lightboxOpen ? 'open' : 'closed'}` → recrée l'état à chaque ouverture, garantit `scale=1` au retour.
- `onClose` du `Dialog` appelle `resetTransform()` puis `setLightboxOpen(false)` dans cet ordre.
- Quand un jeu change de manche (`round` ++) la lightbox est fermée de force via `useEffect([round])`.
- L'état zoom n'est **jamais** persisté dans le state du jeu — il vit uniquement dans le wrapper.

## 6. Accessibilité / Perf

- `role="button" aria-label="Agrandir la photo"` sur la loupe.
- `Esc` ferme la lightbox (déjà géré par Radix Dialog).
- Focus trap natif Radix, focus restitué sur la vignette à la fermeture.
- Préchargement image haute-res : on garde la même URL (déjà résolue par `useDiscoverData`) — pas de double fetch. Ajout `loading="eager"` uniquement dans la lightbox.
- Sur tablette, désactivation du scroll body pendant la lightbox (`overflow:hidden` sur `<body>`).

## 7. Détails techniques

- Dépendance : `react-zoom-pan-pinch` (à ajouter, MIT, maintenu, SSR-safe).
- Fichiers créés :
  - `src/components/biodiversity/discover/modes/games/ZoomableGameImage.tsx`
- Fichiers modifiés :
  - `MemoryGame.tsx` (remplace `<img>` / `<GameCardImage>` côté face révélée)
  - `WhoAmIGame.tsx` (wrap `MysteryFrame` ou directement l'image interne — passage d'un slot via prop)
  - `MysteryFrame.tsx` (expose une prop `renderImage` ou applique `ZoomableGameImage` en interne avec filtre courant)
  - `KingdomSortGame.tsx` (carte au centre)
  - `ZoomDetailGame.tsx` (image principale)
- Pas de modif backend, pas de modif data.

## 8. Tests rapides après build

1. Memory : tap retourne carte ✓, loupe sur carte révélée ouvre lightbox ✓, fermeture → carte reste révélée ✓.
2. Qui suis-je : flou conservé en lightbox ✓, timer/score gelés ✓, indice débloqué après fermeture continue ✓.
3. Tri vivant tablette : drag fonctionne ✓, loupe ouvre sans déclencher de drop ✓.
4. Chasse aux détails : nouvelle manche → lightbox forcée fermée ✓, scale reset ✓.
5. Pinch 2 doigts sur iPad → ouvre directement en zoom ✓.
