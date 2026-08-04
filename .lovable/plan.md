# Le mètre du jardinier — cotation vivante des ouvrages

Aujourd'hui le mode Transformer n'annonce qu'une mesure globale (`5 m² → 5 m²`). On ajoute une **cotation d'architecte** qui s'affiche directement sur la carte, comme un calque de plan technique posé sur l'ouvrage.

## Ce que l'utilisateur voit

Un bouton **« Coter »** (icône règle) dans la barre Transformer, à côté de « Lisser ». Actif, il révèle :

- **Cotes de chaque côté** : la longueur en mètres portée sur chaque segment du polygone (ou de la polyligne), en petite étiquette crème posée sur le milieu du segment, orientée dans l'axe du trait. Sous 1 m on bascule en cm.
- **Cotes d'encombrement** : deux cotes filantes en pointillés hors de la forme — largeur (E‑O) en bas, profondeur (N‑S) à gauche — avec les traits d'attache aux extrémités, comme sur un plan papier.
- **Bandeau de mesures** dans la barre : `L × P` d'encombrement, périmètre, surface, et nombre de sommets. Tout se met à jour en direct pendant le glisser/l'échelle/la rotation.
- **Cote survolée en gras** : passer la souris sur un segment agrandit sa cote et estompe les autres — on lit une dimension précise sans bruit visuel.
- Pour un ouvrage **ponctuel**, la cotation affiche simplement les coordonnées et, s'il existe une emprise réelle, son diamètre.

Le réglage est mémorisé (localStorage) : si on aime coter, la cotation revient à chaque ouverture du mode Transformer.

## Détails techniques

- `src/lib/geomTransform.ts` / `src/components/propriete/palette/studio/geoMetrics.ts` : ajout de helpers purs — `segmentLengths(ring)`, `bboxDimensionsM(ring)` (largeur/profondeur en m via haversine), `midpoint`, `bearingDeg`, et `fmtShort(m)` (cm sous 1 m, m sinon, `ml`/`m²` conservés).
- Nouveau `src/components/propriete/palette/studio/ObjetDimensionsLayer.tsx` : rendu Leaflet des cotes — `Marker` + `divIcon` non interactifs pour les étiquettes (rotation CSS selon le cap du segment), `Polyline` pointillées pour les lignes de cote d'encombrement. Reçoit `coords`, `kind`, `color`, `hoveredIndex`.
- `ObjetTransformLayer.tsx` : monte le calque de cotes quand l'option est active et expose l'index du segment survolé (handlers sur les `Polyline` existantes), sans toucher à la logique de geste.
- `ObjetTransformBar.tsx` : bouton bascule « Coter » + bandeau `L × P · périmètre · surface`, en réutilisant `fmtMeasure`/`fmtLength`.
- `useObjetTransform.ts` : expose `dimensions` (largeur, profondeur, périmètre, segments) dérivé des `coords` courants, plus l'état `showDims` persistant.
- Aucun changement de base de données : la cotation est purement lue depuis la géométrie en cours d'édition.
