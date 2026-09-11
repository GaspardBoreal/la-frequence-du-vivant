---
name: Sauniers — une marche par point d'arrêt
description: Page /sauniers : chaque point de la carte est une marche autonome numérotée 1..n dans l'expérience, avec ancrage waypoint pour les idées d'animation
type: feature
---

Modèle du parcours « Les Secrets de Sauniers » (event `1c201e08-af92-4583-9b7d-b916f19778a6`, exploration `c9c70428-82cc-498f-81f7-6eb7f816e6b7`) :

- 1 point de carte = 1 ligne `marches` (nom = nom du point, descriptif = sous-titre + texte, lat/lng, date 2026-09-12, radius 500 m) + 1 ligne `exploration_marches` (`ordre` = numéro 1..n, `published_public`) + 1 ligne `exploration_waypoints` (`after_marche_id` = **sa propre** marche, `ordre` = 1).
- Les anciennes marches « Amont, le village » / « Aval, le marais » ont été supprimées (avec leurs snapshots) le 11/09/2026 — ne pas les recréer.
- Le segment village/marais est mémorisé dans `marches.sous_themes` sous forme de tag `segment:amont` / `segment:aval`.
- Les idées d'animation (`marche_animation_idees`) restent clés sur `waypoint_id` : le waypoint est l'ancrage stable du point, ne jamais le supprimer sans supprimer la marche.
- Renommer/déplacer un point met à jour la marche **et** le waypoint ; réordonner écrit `exploration_marches.ordre`.
