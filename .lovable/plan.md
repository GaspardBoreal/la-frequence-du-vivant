## Problème

`detectSegmentForPoint` choisit le segment dont la **distance perpendiculaire** est la plus petite. Quand vous cliquez entre l'étape 8 et un waypoint orange déjà présent, le clic est parfois géométriquement plus proche (en perpendiculaire) du segment voisin (vers étape 9) qu'il "déborde" encore — donc le nouveau point est rattaché au mauvais segment.

## Solution — métrique « détour »

Remplacer la métrique par la longueur de détour : pour chaque mini-segment `p1 → p2` (en incluant les waypoints existants), calculer

```text
detour = dist(click, p1) + dist(click, p2) − dist(p1, p2)
```

- Si le clic est **entre** p1 et p2 (sur ou près du segment), `detour ≈ 0`.
- Si le clic est à côté d'un segment voisin mais en réalité « hors » de ses bornes, `detour` grandit fortement.

C'est exactement ce qu'il faut pour privilégier le segment dont les **deux extrémités encadrent** le clic, plutôt qu'un segment parallèle plus long qui passe près en perpendiculaire.

## Garde-fou supplémentaire

Si le meilleur `detour` dépasse un seuil (ex. 150 m) ET qu'aucun segment ne contient vraiment le clic dans sa projection (`0 < t < 1`), retomber sur la projection classique pour éviter les faux positifs en zoom large.

## Fichiers touchés

- `src/components/community/exploration/WaypointMarker.tsx` — modifier uniquement `detectSegmentForPoint` (et au besoin ajouter une variante de `pointToSegmentKm` qui retourne aussi `t`). Aucun changement d'API, pas d'impact sur `ExplorationCarteTab.tsx`.

## Hors scope

- Pas de changement visuel (taille du marker, couleurs, polyline).
- Pas de UI de sélection manuelle de segment (option écartée).
- Pas de modification base de données.
