# Carte de préparation du parcours — Les Secrets de Sauniers

Une carte interactive ajoutée à la page `/sauniers` pour arrêter le tracé réel de la marche du 12 septembre 2026, puis créer d'un clic les deux marches attendues par l'application.

## Ce que vous pourrez faire

1. **Voir les 12 points proposés** sur une carte d'Ars-en-Ré : les 8 stations du village (repris mot pour mot du récit existant) et 4 points dans le marais.
2. **Cocher / décocher** chaque point. Un point décoché reste visible, en gris, et n'est pas généré.
3. **Déplacer** un point : je pose des repères approximatifs, vous les glissez à leur place exacte. Les coordonnées s'affichent sous chaque point.
4. **Ajouter un point** : un clic sur la carte crée un point, vous le nommez et lui donnez une courte description.
5. **Ordonner** le parcours : liste réordonnable par glisser-déposer, la ligne du tracé se redessine en direct, avec distance cumulée et durée estimée à 3 km/h.
6. **Basculer un point** entre le segment « Amont, le village » et « Aval, le marais ».
7. **Valider** : un récapitulatif demande confirmation avant toute écriture.

Tant que rien n'est validé, le travail est conservé dans le navigateur : on peut fermer la page et reprendre.

## Ce qui est créé à la validation

Deux marches rattachées à l'événement du 12 septembre :

- **Les Secrets de Sauniers — Amont, le village** (Ars-en-Ré)
- **Les Secrets de Sauniers — Aval, le marais** (Ars-en-Ré)

Chaque marche reçoit les coordonnées de son premier point, sa distance calculée, sa date, son thème, et un rayon de collecte de 500 m. Les autres points retenus deviennent les points intermédiaires du segment, dans l'ordre choisi, avec leur nom et la collecte du vivant activée.

Une seconde validation sur le même événement propose de remplacer le parcours existant plutôt que de le dupliquer.

## Qui peut faire quoi

La carte est visible par tous sur `/sauniers` : la coopérative voit le parcours proposé et peut le lire. Seul un administrateur connecté voit les outils de modification et le bouton de génération — c'est déjà ce qu'imposent les règles d'accès de la base sur les marches.

## Détail technique

- Nouveau composant `src/components/sauniers/ParcoursPlanner.tsx` + section dans `src/pages/SauniersProposition.tsx`.
- Points proposés déclarés dans `src/content/sauniers/parcoursPropose.ts` (label, sous-titre, texte, segment, lat/lng approximatifs à corriger).
- Carte : `RichMap` (`src/components/maps`), fond satellite par défaut (les bassins se lisent mieux), `MarcheRouteLayer` pour le tracé et les pastilles numérotées, marqueurs `draggable`.
- Distance via `haversineM` (`src/utils/geoDistance.ts`).
- Réordonnancement avec `@dnd-kit`, déjà utilisé dans le projet.
- État local persisté en `localStorage` sous une clé propre à l'événement.
- Génération dans `src/hooks/sauniers/useGenerateParcours.ts` : insertion dans `marches` (nom, ville, lat/lng, date, distance_km, radius_m, thème), puis dans `exploration_waypoints` (`marche_event_id` = `1c201e08-af92-4583-9b7d-b916f19778a6`, `after_marche_id`, `ordre`, `label`, `include_in_biodiversity`). Aucune migration : le schéma existant suffit.
- Écritures séquentielles avec message d'erreur en clair et arrêt propre si une insertion échoue ; les marches déjà créées sont listées pour éviter tout doublon silencieux.

## Ce dont j'aurai besoin ensuite

Les repères que je pose sont approximatifs : le port, l'église, la salorge et la coopérative sont identifiables, mais les 4 points du marais et l'ancien moulin devront être corrigés sur le terrain avant la marche.
