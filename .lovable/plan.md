## Constat

Dans l'Atelier, les **emplacements (zones)** disposent déjà d'un mode Transformer complet (`ZoneTransformLayer` + `ZoneTransformBar` + `useZoneTransform` : glisser, poignées d'échelle, lissage, annuler/valider).

Les **objets** dessinés (potager en carré, mare, pas japonais, massifs…) sont rendus par `ObjectsLayer` avec un simple `click → onSelect` : aucune poignée, aucune possibilité de déplacer ou redimensionner. `ObjectInspector` ne propose que nom / calque / couleur / note / dupliquer / supprimer.

## Ce qui sera construit

### 1. Un moteur de transformation générique (objets = Point, LineString, Polygon)
Nouveau hook `useObjetTransform` calqué sur `useZoneTransform`, mais opérant sur une **liste de coordonnées** quelle que soit la géométrie :
- copie locale non destructive (rien n'est écrit en base avant « Valider »)
- pile d'annulation (24 gestes), lissage cumulatif (Chaikin, déjà dans `src/lib/geomTransform.ts`)
- mesure avant → après (m² pour les polygones, mètres linéaires pour les tracés) via `geoMetrics`
- sauvegarde par `upsertObjet({ id, geometry })`

### 2. Couche d'édition sur la carte — `ObjetTransformLayer`
Généralisation de `ZoneTransformLayer` :
- **Déplacer** : glisser la forme (ou le pictogramme pour un objet ponctuel)
- **Redimensionner** : 8 poignées dorées sur la boîte englobante — coin = homothétie, milieu = étirement d'un axe, Maj = proportionnel
- **Pivoter** : nouvelle poignée circulaire au-dessus de la boîte (rotation autour du centre, aimantation tous les 15° avec Maj) — ajout d'un `rotateRing` dans `geomTransform.ts`
- boîte englobante pointillée, sommets fantômes, curseurs directionnels contextuels
- objets ponctuels : déplacement seul (pas d'échelle), avec halo de saisie

### 3. Barre flottante — `ObjetTransformBar`
Même langage visuel que `ZoneTransformBar`, positionnée sous le bandeau Géo/Sat/Relief/Cadastre (`MAP_CHROME_TOP_PADDING`) :
pictogramme + nom de l'ouvrage · rappels de gestes · Lisser (×n) · Annuler le geste · **surface/longueur avant → après avec facteur ×** · Valider / Abandonner. Raccourcis Échap (abandonner), Entrée (valider), ⌘/Ctrl+Z (annuler).

### 4. Point d'entrée « wahou » dans l'inspecteur
Dans `ObjectInspector`, un bloc d'actions haut de panneau : **Transformer** (activation du mode), Dupliquer, Supprimer — avec l'indication de la mesure courante mise à jour en direct pendant le geste. Double-clic sur l'objet dans la carte entre directement en mode Transformer.

### 5. Cohérence d'état
- entrer en mode Transformer sur un objet ferme un éventuel mode zone en cours (et inversement)
- l'objet en cours d'édition est masqué dans `ObjectsLayer` (rendu uniquement par la couche d'édition) pour éviter le doublon fantôme
- pas de zoom/recadrage parasite : la vue courante est conservée

## Détails techniques

Fichiers créés : `src/hooks/propriete/useObjetTransform.ts`, `src/components/propriete/palette/studio/ObjetTransformLayer.tsx`, `src/components/propriete/palette/studio/ObjetTransformBar.tsx`.
Fichiers modifiés : `src/lib/geomTransform.ts` (ajout `rotateRing`, helpers coords génériques), `ObjectsLayer.tsx` (prop `hiddenId`, `onActivate` au double-clic), `ObjectInspector.tsx` (bouton Transformer + mesure live), `PaletteStudio.tsx` (branchement du mode).
Aucune migration base : la géométrie est déjà stockée en GeoJSON dans `propriete_objets` et écrite via `upsert_propriete_objet`.
