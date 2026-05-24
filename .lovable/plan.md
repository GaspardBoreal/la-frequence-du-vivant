## Objectif

Transformer l'ouverture du mode plein écran iNat (actuellement lente et silencieuse) en une expérience instantanée et cinématique : pré-calcul en arrière-plan dès l'ouverture du drawer, streaming progressif des marqueurs, indicateur d'étapes nommé + barre, et toggle 3 niveaux pour les marches.

## 1. Pré-calcul background (gain perçu immédiat)

Dès que le drawer iNat s'ouvre (avant même que l'utilisateur clique « Plein écran »), lancer en tâche de fond :

- Résolution des coordonnées GPS de chaque photo (EXIF → fallback waypoints marche → none)
- Calcul du snap-25m vers les waypoints existants
- Pré-chargement des miniatures (preload `<img>` invisibles, taille thumbnail)
- Bounding box global pour l'auto-fit

Stocké dans un hook `useFullscreenPreparation(photos)` retournant `{ ready, progress, steps, enrichedPhotos, bounds }`. Le bouton « Plein écran » affiche un mini-indicateur (`75%`) si pas encore prêt, et devient instantané quand `ready=true`.

## 2. Streaming progressif (si clic avant fin du pré-calcul)

Si l'utilisateur clique avant la fin, ouverture immédiate avec :
- Overlay d'étapes par-dessus la carte (semi-transparent, n'empêche pas de voir le décor)
- Marqueurs poussés par batch de 20 dans le state au fur et à mesure que la préparation avance
- Liste de droite peuplée en parallèle (skeleton par item → contenu)

## 3. Indicateur progressif « Étapes nommées + barre »

Carte centrale avec :

```text
  ┌─────────────────────────────────┐
  │   Préparation du plein écran    │
  │   ▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░  68%       │
  │                                 │
  │   ✓ Photos chargées (81)        │
  │   ✓ GPS EXIF extraits (75)      │
  │   ⟳ Calcul fallback marches…    │
  │   ○ Snap aux waypoints          │
  │   ○ Génération marqueurs        │
  └─────────────────────────────────┘
```

5 étapes avec icônes : `○` todo · `⟳` in-progress (spin) · `✓` done (vert anim scale-in). Barre globale = moyenne pondérée. Disparaît en fade-out 300ms quand prêt.

## 4. Toggle marches — 3 niveaux

Dans le bandeau haut, un segmented control compact à 3 segments :

```text
  Marches:  [ Off ]  [ Tracés ]  [ Tracés + waypoints + labels ]
```

- **Off** : carte épurée, uniquement marqueurs photos
- **Tracés** : polylines des marches en couleur atténuée (30% opacity)
- **Tracés + waypoints + labels** : polylines pleines + waypoints numérotés + nom de marche au survol

Préférence persistée dans `localStorage` (`inat-fs-marches-mode`).

## 5. Effets wahouh

- **Compteurs animés top banner** : les 3 chiffres (EXIF / Marche / Sans GPS) comptent de 0 → N avec easing (réutiliser `useAnimatedCounter` existant), 800ms, déclenchés quand `ready=true`
- **Cascade marqueurs** : chaque marqueur apparaît avec `scale-in` (0.95 → 1) + léger ressort, stagger 15ms, ordonnés par marche puis date — utiliser `framer-motion` `AnimatePresence` + `initial/animate`
- **Auto-fit cinématique** : une fois tous les marqueurs posés, `map.flyToBounds(bounds, { duration: 2, padding: [60,60] })` depuis une vue large

## 6. Bandeau supérieur — layout final

```text
  ┌──────────────────────────────────────────────────────────────────────┐
  │  ← Fermer    🟢 75 EXIF   🟡 6 Marche   🔴 0 Sans GPS    Marches: [Off|Tracés|+Waypoints]  │
  └──────────────────────────────────────────────────────────────────────┘
```

Les 3 chips restent cliquables pour filtrer (comportement actuel conservé).

## Détails techniques

**Fichiers modifiés/créés :**
- `src/hooks/useFullscreenPreparation.ts` (nouveau) — orchestration pré-calcul avec progress callback, 5 étapes, AbortController
- `src/components/community/exploration/InatUploadFullscreen.tsx` — refacto : consomme `useFullscreenPreparation`, ajoute overlay étapes, streaming batchs, toggle marches, cascade marqueurs, auto-fit cinématique
- `src/components/community/exploration/InatFullscreenLoadingOverlay.tsx` (nouveau) — UI étapes + barre, semi-transparent
- `src/components/community/exploration/InatFullscreenMarchesToggle.tsx` (nouveau) — segmented control 3 niveaux, persisté localStorage
- `src/components/community/exploration/InatUploadPrepDrawer.tsx` — lance la préparation background dès le mount (passe le hook au parent ou via callback), affiche `%` sur le bouton si pas prêt

**Préparation par étape (poids) :**
1. Photos chargées (5%) — `photos.length > 0`
2. GPS EXIF lus depuis metadata (25%) — parallèle, déjà en mémoire
3. Calcul GPS fallback marche (35%) — résolution waypoint centroid par `marche_event_id`
4. Snap waypoints 25m (15%) — pour chaque photo avec GPS, test distance aux waypoints
5. Génération marqueurs + preload thumbs (20%) — `Promise.all` sur `Image()` preload, max 6 en parallèle

**Marches toggle implementation :**
- Mode `off` : ne pas rendre les `Polyline` ni waypoints sur RichMap (prop `showMarches=false`)
- Mode `traces` : `<RichMap waypointsOpacity={0.3} hideWaypointMarkers />`
- Mode `full` : `<RichMap />` standard (comportement actuel)

**Animation marqueurs :**
- `AnimatePresence` autour de la liste de markers
- `motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: index * 0.015, type: 'spring', stiffness: 300 }}`

**Auto-fit :**
- Après `ready=true` et premier render, `setTimeout(200)` puis `mapRef.current?.flyToBounds(bounds, { duration: 2, easeLinearity: 0.25, padding: [60,60] })`
- Désactivé si l'utilisateur a déjà interagi (pan/zoom) — listener `movestart`

**Aucun changement DB** — tout est frontend.

## Hors scope

- Modification de la logique de repositionnement GPS (déjà fonctionnelle)
- Son ambient (écarté pour cette itération)
- Sélection multi-marches (le 3-niveaux est plus simple et suffit)
