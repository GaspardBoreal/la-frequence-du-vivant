# Page Sauniers — parcours enregistré et idées d'animation conservées

La page `/sauniers` cesse d'être un brouillon local : tout ce qui est fait sur la carte est enregistré dans la base, rattaché à l'événement **Les Secrets de Sauniers** (12 septembre 2026) et à son expérience.

## Ce qui change pour vous

**Plus jamais le mot « IA »** — partout sur la page, on parle de l'**Assistant** (« Idées de l'Assistant », « L'Assistant prépare six idées… », « Assistant indisponible, voici des idées de secours »).

**Le parcours existe vraiment.** À la première ouverture de la page par un administrateur connecté, les deux marches de l'événement sont créées automatiquement avec leurs 12 arrêts :

- Les Secrets de Sauniers — Amont, le village (8 arrêts)
- Les Secrets de Sauniers — Aval, le marais (4 arrêts)

Elles sont rattachées à l'événement et à son expérience. Ensuite, la page lit et écrit directement ces données : plus de version « dans le navigateur » qui diverge de la base.

**Un index de progression** s'affiche pendant cette préparation : « Lecture du parcours… », « Création de la marche du village… », « Enregistrement des 12 arrêts… », avec une barre qui avance et un état final « Parcours prêt ». En cas d'échec, le motif réel est affiché avec un bouton « Réessayer ».

**Les idées de l'Assistant sont conservées.** Les six idées générées pour un arrêt sont enregistrées et retrouvées à la prochaine ouverture. Pour chaque idée : la modifier (titre, description, durée, matériel), la supprimer, en ajouter une à la main, et régénérer les propositions de l'Assistant sans perdre celles que vous avez retouchées (une régénération propose, elle ne remplace qu'après confirmation). Supprimer un arrêt supprime ses idées.

**Chaque geste est enregistré immédiatement** : déplacer un arrêt, le renommer, le retirer du parcours, en ajouter un, changer l'ordre, basculer village/marais. Un indicateur discret « Enregistré » confirme l'écriture ; en cas d'erreur, la carte revient à l'état précédent avec un message clair.

**Visiteurs et administrateurs.** Un visiteur non connecté voit le parcours réel et les idées enregistrées, en lecture seule, sans jamais rien créer. Seul un administrateur connecté déclenche la création et les modifications — c'est ce qu'imposent les règles d'accès de la base.

## Détail technique

### Base de données (une migration)

Nouvelle table `marche_animation_idees` :
`id`, `marche_event_id` (l'événement Sauniers), `waypoint_id` → `exploration_waypoints(id) ON DELETE CASCADE`, `groupe` (`lieu` | `vivant`), `ordre`, `titre`, `description`, `duree`, `materiel`, `source` (`assistant` | `humain`), `created_by`, `created_at`, `updated_at` + trigger `updated_at`.

Ordre imposé : CREATE TABLE → GRANT (`SELECT` à `anon` et `authenticated`, écritures à `authenticated`, `ALL` à `service_role`) → ENABLE RLS → policies. Lecture publique ; écriture conditionnée à `can_edit_marche_event(marche_event_id, auth.uid())`, comme les waypoints.

### Modèle des données du parcours

- Deux lignes dans `marches` (`nom_marche` = `SEGMENT_MARCHE_NOM`, ville Ars-en-Ré, date `2026-09-12`, `radius_m` 500, `distance_km` calculée, lat/lng du premier arrêt).
- Lien `exploration_marches` vers `exploration_id = c9c70428-82cc-498f-81f7-6eb7f816e6b7` (l'expérience de l'événement).
- **Tous** les arrêts, premier inclus, deviennent des lignes `exploration_waypoints` (`marche_event_id` = `1c201e08-…`, `after_marche_id` = la marche du segment, `ordre` séquentiel, `label`, `include_in_biodiversity` true) — c'est ce qui donne à chaque arrêt un identifiant stable auquel accrocher ses idées.

### Code

- `src/hooks/sauniers/useParcoursSauniers.ts` (nouveau) : lecture des marches + waypoints, amorçage idempotent (ne crée que ce qui manque, jamais de doublon), mutations `deplacer / renommer / ajouter / supprimer / reordonner / changerSegment`, avec mise à jour optimiste et invalidation React Query.
- `src/hooks/sauniers/useIdeesAnimation.ts` (nouveau) : lecture/écriture des idées, génération via la fonction `sauniers-animation-ideas` puis insertion des six lignes, régénération avec confirmation.
- `src/hooks/sauniers/useGenerateParcours.ts` : conservé pour la suppression/reconstruction complète, réécrit pour passer par le nouveau modèle (waypoint pour l'arrêt n°1, lien `exploration_marches`).
- `src/components/sauniers/ParcoursPlanner.tsx` : abandon du `localStorage` comme source de vérité, branchement sur les hooks, ajout du bandeau de progression, libellés « Assistant ».
- `src/components/sauniers/PointWidget.tsx` : idées lues depuis la base, édition en ligne, suppression, ajout manuel, bouton « Régénérer avec l'Assistant ».
- `src/content/sauniers/animationsFallback.ts` et la fonction edge : vocabulaire « Assistant » dans les messages visibles.
- La fonction edge reste inchangée côté modèle (`openai/gpt-6-astra`, `/v1/responses`, sortie JSON stricte).

### Points de vigilance

- L'amorçage est idempotent et verrouillé côté client par un état « en cours » : deux ouvertures simultanées ne créent pas quatre marches (les marches sont retrouvées par nom + événement avant toute écriture).
- Le `localStorage` existant est ignoré, puis nettoyé, pour éviter deux vérités.
