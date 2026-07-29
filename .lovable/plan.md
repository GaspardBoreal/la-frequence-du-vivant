# Emplacements : un vrai mode « Transformer »

Aujourd'hui un emplacement (ex. « Mare ») ne peut être que tracé, renommé, coloré ou supprimé. Sa géométrie est figée. On ajoute un **mode Transformer** activable sur l'emplacement sélectionné, disponible dans les deux vues (bloc carte « Emplacements de la palette » et Atelier plein écran), avec les trois gestes demandés.

## 1. Déplacer (glisser-déposer)

- Au survol de la zone en mode Transformer, curseur `move` et remplissage légèrement renforcé.
- Pointer-down dans le polygone → translation en temps réel de tous les sommets (delta calculé en coordonnées écran puis reprojeté en lat/lng, donc fidèle quel que soit le zoom).
- Le pan de la carte est désactivé pendant le drag, réactivé au relâchement.
- Aide contextuelle : badge flottant « ✥ Déplacement — relâchez pour poser ».

## 2. Redimensionner par homothétie

- 8 poignées (4 coins + 4 milieux) sur la boîte englobante de la zone, dessinées en cercles crème bordés de la couleur de l'emplacement, + une poignée de rotation optionnelle au-dessus (voir question ci-dessous).
- Glisser une poignée applique une **mise à l'échelle homothétique** autour du centre opposé :
  - coin = homothétie proportionnelle (ratio identique lat/lng, la forme ne se déforme pas) ;
  - milieu de bord = étirement sur un seul axe (utile pour une mare allongée) ;
  - `Maj` enfoncé sur un bord force aussi l'homothétie proportionnelle.
- Facteur d'échelle borné (0.05× min) pour éviter l'effondrement.
- Pendant le geste, une **étiquette live** affiche la nouvelle surface estimée (`… m²`) et le ratio (`×1,34`), calculée avec `geometryAreaM2` déjà présent dans `studio/geoMetrics.ts`.

## 3. Lisser les contours

- Bouton « ⌇ Lisser » dans la barre de transformation, applicable en cumul (chaque clic lisse un cran de plus, indicateur « Lissage ×2 »).
- Algorithme : **Chaikin (corner-cutting)** sur l'anneau fermé, précédé d'une simplification Douglas-Peucker légère quand le tracé main levée contient beaucoup de points (les tracés freehand font souvent 200+ sommets). Résultat : contour organique et fluide, sans la crispation actuelle, tout en gardant la surface quasi identique.
- Bouton compagnon « Anguler » (retour au tracé précédent) via la pile d'annulation.

## Barre de transformation et sauvegarde

Une barre flottante en bas de la carte apparaît dès l'entrée en mode Transformer :

```text
[✥ Déplacer] [⤢ Échelle] [⌇ Lisser] [↺ Annuler] │ 412 m² → 553 m²  │ [Valider] [Annuler]
```

- Toutes les manipulations se font sur une **copie locale** de la géométrie : rien n'est écrit tant que « Valider » n'est pas cliqué (ou `Entrée`) ; `Échap` annule et restaure la forme d'origine.
- Historique d'annulation local (pile des états de géométrie) pour `↺` et `Ctrl+Z`.
- À la validation : `onPatchZone(zone, { geometry, surface_m2 })` → `upsertZone` existant, qui persiste déjà géométrie et surface.
- Mode indisponible si la zone est **verrouillée** (`verrouille`) ou en `readOnly` — le bouton l'indique clairement.

## Détails techniques

Nouveaux fichiers :

- `src/lib/geomTransform.ts` — utilitaires purs sans dépendance Leaflet : `translateRing`, `scaleRing(ring, anchor, kx, ky)`, `chaikinSmooth(ring, iterations)`, `simplifyRing(ring, toleranceM)`, `ringBounds`.
- `src/components/propriete/palette/ZoneTransformLayer.tsx` — couche react-leaflet : polygone fantôme, poignées `CircleMarker`/`Marker` avec `divIcon`, gestion pointer events, désactivation de `map.dragging` pendant les gestes.
- `src/components/propriete/palette/ZoneTransformBar.tsx` — barre flottante (surface avant/après, boutons, raccourcis clavier).

Fichiers modifiés :

- `ZonesMapBlock.tsx` — état `transformZoneId`, montage de la couche + barre, entrée dans le mode via le chip actif.
- `ZoneChipMenu.tsx` — nouvelle entrée « ✥ Transformer la forme » (grisée si verrouillée).
- `studio/PaletteStudio.tsx` — même couche réutilisée sur la carte de l'Atelier, pour ne pas avoir deux comportements différents.

Aucun changement de schéma en base : `geometry` et `surface_m2` existent déjà sur `propriete_zones`.

## Question

Aussi une **poignée de rotation** (faire pivoter l'emplacement) en plus des trois fonctions demandées 