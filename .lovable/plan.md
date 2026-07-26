## Objectif

Afficher, en haut de la vue « Observations verrouillées » de l'étape *J'analyse le sol* — et en tête de l'impression correspondante — une représentation cartographique de la propriété avec les points de prélèvement A→E.

## Choix technique

La carte d'édition (bloc 2) utilise Leaflet + tuiles cadastre : elle ne s'imprime pas de façon fiable (tuiles asynchrones, contrôles, zoom, fond gris à l'impression). Pour le carnet scellé, on dessine un **plan vectoriel autonome (SVG)**, généré à partir des données déjà disponibles (`parcelles[].geometry` + `samples[].lat/lng`). Même rendu à l'écran et sur papier, instantané, sans réseau, et beaucoup plus « planche d'architecte » que la capture d'une carte web.

## Nouveau composant : `SoilSamplesPlan.tsx`

`src/components/propriete/analyze/SoilSamplesPlan.tsx`

- Entrées : `parcelles` (géométries), `samples` (labels, coords, lieu, résultats), `reading` (dominantes).
- Projection locale : bbox des géométries + points, correction du facteur `cos(latitude)` pour garder les proportions réelles, padding, viewBox normalisé.
- Rendu, style « planche cadastrale ancienne » sur fond `--ds-cream` :
  - trame de fond très légère (quadrillage 10 m, pointillés discrets) ;
  - parcelles en polygone vert forêt, remplissage translucide, liseré doré extérieur, référence cadastrale en petites capitales au centre de chaque parcelle ;
  - épingles de prélèvement reprenant exactement le glyphe de la carte d'édition (goutte crème, contour forêt, lettre sérif) pour continuité visuelle, avec ombre douce ;
  - fils de rappel fins reliant chaque épingle à son étiquette (lieu + pastille de résultat dominant) quand la place le permet ;
  - échelle graphique (barre + « X m ») calculée depuis la bbox, rose des vents minimaliste (N), cartouche en bas : nom de la propriété, nombre de prélèvements, nombre géolocalisés.
- Animation à l'écran uniquement (framer-motion) : tracé des parcelles en `pathLength`, puis chute des épingles en cascade (~60 ms d'écart) avec léger rebond. Aucune animation quand `printOnly`.
- Cas dégradés : aucune parcelle → plan centré sur les seuls points avec cadre en pointillés ; aucun point géolocalisé → cartouche sobre invitant à positionner les prélèvements (bouton crayon vers le bloc 2 à l'écran, texte neutre à l'impression).

## Intégration `AnalyzeSummary.tsx`

- Nouvelles props optionnelles : `parcelles?: ProprieteParcelle[]`.
- Bloc inséré dans `showFirst`, **juste avant** `SoilSignature`, sous un intitulé éditorial (« Le plan · où la terre a été ouverte »), pleine largeur, ratio ~16/9 desktop / 4/3 mobile, crayon d'édition vers le bloc `prelevements` (masqué en `printOnly`).
- Marqué `print-avoid-break` pour rester d'un seul tenant sur la page.

## Intégration impression

- `TabAnalyze.tsx` : passe `parcelles` à `AnalyzeSummary` (déjà chargées ligne 111) — impression « J'analyse (seul) » couverte automatiquement.
- `CombinedPrintLayout.tsx` : ajoute une prop `parcelles` transmise à l'`AnalyzeSummary` `printSection="first"` du cahier complet ; vérifier que `PrintChoiceDialog` / `usePrintCombined` propagent bien les parcelles déjà utilisées par le portrait.
- `src/index.css` : régler la hauteur du plan en `@media print` (bloc `analyze-printing` / `combined-printing`) pour qu'il tienne dans le tiers haut de la première page, et forcer les couleurs (`print-color-adjust: exact`).

## Détails techniques

- Support des géométries `Polygon` et `MultiPolygon` (aplatissement des anneaux), tolérance aux géométries nulles (repli sur `centroid_lat/lng` en petit repère croix).
- Aucun appel réseau, aucune dépendance ajoutée ; couleurs via tokens `--ds-forest`, `--ds-gold`, `--ds-cream`, `--ds-line`.
- Aucune modification du bloc 2 d'édition ni de la logique de données.
