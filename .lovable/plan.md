# Sauniers : une marche par point d'arrêt

Aujourd'hui la page `/sauniers` crée **2 marches** (le village, le marais) et 13 arrêts rattachés à ces deux marches. On passe à **13 marches**, une par point, numérotées 1 à 13 dans l'expérience « Les Secrets de Sauniers » et donc dans l'événement public associé.

## Ce qui change

**13 marches, une par point.** Chaque point de la carte devient une marche à part entière :

- nom de la marche = nom du point (« Le Port d'Ars-en-Ré », « La vasière », …)
- description = la phrase courte du point (le sous-titre et le texte déjà écrits)
- position = les coordonnées du point sur la carte
- date du 12 septembre 2026, Ars-en-Ré, rayon de 500 m

**Numérotation 1 à 13** dans l'expérience : 1 à 8 pour les points du village, 9 à 13 pour ceux du marais, dans l'ordre actuel de la carte. Vous pourrez ensuite réordonner depuis la carte, et le numéro se met à jour partout.

**Les idées d'animation suivent leur point.** Les 72 idées déjà enregistrées (6 par point sur 12 points) restent attachées au même point, qui est désormais sa propre marche. Rien à regénérer. Le 13e point (« Nouvel arrêt », à renommer) n'a pas encore d'idées : le bouton de génération les créera.

**Les 2 anciennes marches sont supprimées définitivement**, comme demandé — y compris les relevés de biodiversité qu'elles portaient (63 et 66 espèces). Chaque nouvelle marche pourra collecter sa propre biodiversité dans son rayon de 500 m.

**La carte garde tous ses gestes** : déplacer, renommer, ajouter, supprimer, réordonner, basculer village/marais, plein écran, idées de l'Assistant. Chaque geste agit maintenant aussi sur la marche correspondante (un renommage renomme la marche, un déplacement déplace la marche, un ajout crée une nouvelle marche numérotée à la suite, une suppression supprime la marche et ses idées).

## Détail technique

### Modèle retenu

Chaque point = 1 ligne `marches` + 1 ligne `exploration_marches` (`ordre` = 1…13, `publication_status` = `published_public`) + 1 ligne `exploration_waypoints` conservée comme ancrage du point (`marche_event_id` = `1c201e08-…`, `after_marche_id` = **sa propre** marche, `ordre` = 1). L'ancrage waypoint est conservé pour ne rien casser : `marche_animation_idees.waypoint_id` est `NOT NULL` et pointe déjà dessus. **Aucune migration de schéma n'est nécessaire.**

### Reprise des données existantes (script SQL de données, `run_sql`)

1. Créer 13 marches depuis les 13 waypoints actuels (nom = `label`, lat/lng, descriptif issu de `parcoursPropose.ts` quand le nom correspond).
2. Insérer les 13 lignes `exploration_marches` avec `ordre` 1…13 (village puis marais, ordre actuel).
3. Repointer chaque waypoint : `after_marche_id` = sa nouvelle marche, `ordre` = 1. Les idées restent liées, aucune ligne d'idée touchée.
4. Supprimer les 2 anciennes marches `4fbc9ecb-…` et `5f49b994-…` (et leurs liens exploration + snapshots de biodiversité), une fois les waypoints repointés pour éviter toute cascade sur les arrêts.
5. Vérification : 13 marches dans l'expérience, 13 waypoints repointés, 72 idées toujours rattachées.

### Code

- `src/hooks/sauniers/useParcoursSauniers.ts` : lecture réécrite (les marches de l'expérience portent chacune un arrêt ; l'ordre vient de `exploration_marches.ordre`), amorçage idempotent créant 13 marches + liens + waypoints, et mutations mises à jour :
  - `renommer` → `marches.nom_marche` + `exploration_waypoints.label`
  - `deplacer` → `marches.latitude/longitude` + waypoint
  - `ajouter` → nouvelle marche + lien `ordre` suivant + waypoint
  - `supprimer` → suppression de la marche (le waypoint et ses idées partent en cascade), puis renumérotation
  - `reordonner` → écriture de `exploration_marches.ordre`
  - `changerSegment` → simple champ de segment de la marche pour le tracé, plus de bascule entre deux marches parentes
  - `reinitialiser` → supprime les 13 marches créées pour repartir à zéro
- `src/content/sauniers/parcoursPropose.ts` : conserve les 12 points de référence et leurs textes ; le segment reste un attribut du point (utilisé pour le tracé et les couleurs), plus pour désigner une marche parente.
- `src/components/sauniers/ParcoursPlanner.tsx` : libellés (« Créer les 13 marches »), numéro global 1…13 affiché sur la carte et dans la liste, indicateur de progression pendant la création (13 étapes).
- `src/hooks/sauniers/useIdeesAnimation.ts` et `useGenerationIdeesGlobale.ts` : inchangés sur le fond (clé = waypoint du point), vérification que la génération globale parcourt bien les 13 points.
- `src/hooks/sauniers/useGenerateParcours.ts` : devenu obsolète, supprimé.

### Points de vigilance

- L'amorçage reste réservé à un administrateur connecté et reste idempotent (une marche n'est créée que si aucune marche de ce nom n'est déjà liée à l'expérience).
- La suppression des 2 anciennes marches est irréversible et emporte leurs snapshots de biodiversité — confirmé.
- Après reprise, il faudra relancer la collecte de biodiversité si vous souhaitez repeupler les 13 nouvelles marches.
