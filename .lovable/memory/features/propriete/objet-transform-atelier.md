---
name: Transformer un ouvrage de l'Atelier
description: Mode Transformer générique (déplacer / échelle / rotation / lissage) pour les objets dessinés dans l'Atelier du jardin nourricier
type: feature
---
Les objets `propriete_objets` (Point / LineString / Polygon) disposent du même rituel que les
emplacements : `useObjetTransform` (copie locale, pile d'annulation, mesure avant→après, écriture
seulement au « Valider »), `ObjetTransformLayer` (glisser la forme, 8 poignées d'échelle,
pastille dorée de rotation avec aimantation 15° sous Maj) et `ObjetTransformBar`
(sous le bandeau Géo/Sat/Relief/Cadastre, Échap / Entrée / ⌘Z).

Entrées : bouton « Transformer » en tête d'`ObjectInspector` ou double-clic sur l'objet.
L'objet édité est masqué dans `ObjectsLayer` (`hiddenId`) pour éviter le doublon fantôme.
Zone et objet ne sont jamais en transformation simultanée. Lissage réservé aux polygones.
Helpers purs : `rotateRing`, `geomCoords`, `withGeomCoords` dans `src/lib/geomTransform.ts`.
