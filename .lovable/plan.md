# Correction des contrôles de zoom du globe « Origines & Flux »

## Constat

Dans `WorldOriginsGlobe.tsx`, les boutons `+` / `−` utilisent `controls.dollyIn(factor)`. Selon l'implémentation de three-globe / OrbitControls, l'effet perçu est inversé pour l'utilisateur : `+` éloigne au lieu de rapprocher. De plus, la plage de zoom est bornée à `minDistance = 180`, ce qui empêche de s'approcher davantage de la Terre.

## Changements

### 1. Inverser la logique des boutons (frontend uniquement)

Fichier : `src/components/community/analyse/origins/WorldOriginsGlobe.tsx`

- Bouton `+` (Plus) → doit **rapprocher la caméra** (vue plus grosse). Appellera `handleZoom` avec un facteur qui réduit la distance caméra.
- Bouton `−` (Minus) → doit **éloigner la caméra** (vue plus petite).
- Réécrire `handleZoom` pour piloter directement `camera.position.multiplyScalar(factor)` (fiable, indépendant du sens de `dollyIn`) avec clamp sur `[minDistance, maxDistance]`, puis `controls.update()`.
  - `+` → `factor = 1 / 1.35` (rapproche)
  - `−` → `factor = 1.35` (éloigne)

### 2. Étendre la plage de zoom

- `controls.minDistance` : `180` → `110` (permet de zoomer beaucoup plus près, jusqu'à une vue continentale rapprochée sans traverser la sphère, rayon globe ≈ 100).
- `controls.maxDistance` : `800` → `1000` (un peu plus de recul pour la vue planétaire).
- Activer également le zoom molette (`controls.enableZoom = true`, déjà actif par défaut) avec `zoomSpeed = 0.9` pour un feeling cohérent.

### 3. Détails UX

- Garder l'arrêt de l'auto-rotation au premier clic zoom (déjà en place).
- Conserver `handleRecenter` qui ramène à `altitude: 2.2`.
- Aucun changement sur la donnée, les arcs, la galerie ou les hooks.

## Hors scope

- Pas de modification des edge functions, migrations, ni des autres modules.
- Pas de refonte visuelle des boutons.

## Validation

Sur Mobile / Tablette / PC (1120px actuel) : cliquer `+` doit progressivement rapprocher le globe jusqu'à une vue continentale ; `−` doit le ramener en vue planétaire ; `Recentrer` doit revenir à la vue par défaut centrée sur l'événement.
