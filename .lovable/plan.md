# Zoom dynamique sur les vues Réseau · Constellation · Spirale

## Objectif

Permettre au marcheur de **zoomer (+ / −), de se déplacer (pan) et de réinitialiser** la vue sur chacune des trois visualisations trophiques, sans perdre la lisibilité des informations (labels, halos, arcs, overlays).

## Principe directeur — un seul moteur de zoom mutualisé

Les trois vues partagent déjà la même structure : un `<svg viewBox="0 0 W H">` rendu dans un conteneur responsive. On centralise donc la logique zoom/pan dans **un seul composant réutilisable**, plutôt que de la dupliquer trois fois.

```text
┌──────────────────────────────────────────────────┐
│  ZoomableSvgStage (wrapper)                      │
│  ┌────────────────────────────────────────────┐  │
│  │  <svg viewBox={dynamicViewBox}>            │  │
│  │     … contenu existant inchangé …          │  │
│  │  </svg>                                    │  │
│  └────────────────────────────────────────────┘  │
│  ┌─ overlay flottant bas-droite ─┐                │
│  │  [ − ] [ 100% ] [ + ] [ ⟲ ]   │                │
│  └───────────────────────────────┘                │
└──────────────────────────────────────────────────┘
```

## UX — comment ça se vit

- **Boutons +/−** en bas-droite (au-dessus du `TrophicBeamOverlay`), style cohérent (glassmorphism, tokens sémantiques). Paliers : 1× → 1.5× → 2× → 3× → 4× (max), min 1×.
- **Indicateur central** affichant le facteur courant (ex. `150%`), cliquable pour reset.
- **Bouton reset** (icône `Maximize2`) qui rétablit viewBox + selection focus.
- **Molette souris** (desktop) : zoom centré sur le curseur (`wheel` + `preventDefault`).
- **Pinch tactile** (mobile/tablette) : 2 doigts → zoom centré sur le milieu du pinch.
- **Drag pour panner** quand `zoom > 1` (curseur `grab` / `grabbing`). En `zoom = 1`, le drag est désactivé pour ne pas gêner la sélection d'espèces (clic).
- **Double-clic / double-tap** sur une étoile : zoom 2× centré sur elle (bonus, optionnel).
- **Focus automatique** : quand une espèce est sélectionnée et que `zoom > 1`, la vue se recentre doucement sur le nœud (animation viewBox 400 ms).

### Préservation de l'information

- **Labels & halos restent lisibles** : on applique un facteur inverse aux éléments textuels (`fontSize`, `strokeWidth`) via une variable CSS `--zoom` pour qu'ils ne grossissent pas démesurément. Les arcs et étoiles, eux, grossissent normalement (c'est le but).
- **Overlay et chips de filtre** (mangeurs/proies/recycleurs) restent **hors zoom**, ancrés au conteneur — ils ne bougent jamais.
- **Ghost arcs** et tooltips conservent leur sémantique ; les tooltips Radix se positionnent toujours correctement car le wrapper ne casse pas le flux DOM.

## Architecture technique

### Nouveau fichier : `src/components/community/synthese/trophic/ZoomableSvgStage.tsx`

Composant générique :

```ts
interface Props {
  width: number;            // W ou SIZE original
  height: number;
  children: ReactNode;      // tout le contenu <svg>
  className?: string;
  selectedFocus?: { x: number; y: number } | null; // recentrage auto
  minZoom?: number;         // défaut 1
  maxZoom?: number;         // défaut 4
}
```

Internes :
- `useState` pour `{ zoom, cx, cy }` (centre du viewBox).
- `viewBox` calculé : `cx - W/(2z)  cy - H/(2z)  W/z  H/z`, clampé aux bornes pour empêcher de sortir de la scène.
- Handlers : `onWheel`, `onPointerDown/Move/Up` (pan), `onTouchStart/Move` (pinch via `TouchEvent.touches`).
- Expose une **CSS var `--zoom`** sur le conteneur pour les compensations de texte/stroke.
- Animation viewBox via `framer-motion` (`animate` sur un objet, ou `motion.svg` avec `animate` sur attributs).

### Modifications minimales dans les trois Tabs

Dans `ReseauTab.tsx`, `ConstellationTab.tsx`, `SpiraleTab.tsx` :

1. Remplacer `<svg viewBox={...} className="w-full h-auto block">…</svg>` par
   ```tsx
   <ZoomableSvgStage width={W} height={H} selectedFocus={selectedPos}>
     {/* contenu SVG existant inchangé */}
   </ZoomableSvgStage>
   ```
2. Calculer `selectedPos` à partir du nœud sélectionné (les coordonnées sont déjà disponibles dans chaque vue : `nodePositions.get(selected.id)` ou équivalent).
3. **Aucune autre logique métier ne change** : beams, overlays, sélection, ghost arcs, halo pulsant restent identiques.

### Compensation des labels (1 ligne CSS par texte concerné)

Sur les `<text>` et `<circle>` de label/halo, ajouter par exemple :
```tsx
style={{ fontSize: `calc(11px / var(--zoom, 1))` }}
```
Appliqué uniquement aux 2–3 sélecteurs de texte/stroke existants par vue.

## Hors-scope

- Pas de mini-map.
- Pas de changement des données, du classifier, ni de la logique de beams.
- Pas de zoom sur l'overlay UI ni sur les chips.
- Pas de persistance du niveau de zoom entre sessions.

## Vérification

1. Onglet Synthèse → Réseau : cliquer `+` plusieurs fois → les arcs et étoiles grossissent, les labels restent lisibles, le drag fonctionne, l'overlay reste fixe.
2. Idem Constellation et Spirale : zoom identique, comportement homogène.
3. Sélectionner une espèce zoomée → la vue se recentre doucement sur elle.
4. Molette + pinch testés desktop/mobile.
5. Reset (`⟲`) revient à 100 % et viewBox d'origine.
