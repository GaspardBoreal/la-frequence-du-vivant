## Objectif
Faire en sorte que **toutes les vues** affichent le même total d’espèces pour une même entité, avec une seule règle de calcul, en respectant le **rayon spécifique de chaque marche**.

## Diagnostic
- **Carnet** affiche encore `77 espèces` car il passe par `useMarcheCollectedData`, qui **recalcule localement** un total par exploration puis l’**assigne tel quel à chaque événement** de cette exploration.
- Concrètement, `useMarcheCollectedData` prend `exploration_id`, récupère toutes les `exploration_marches`, fusionne snapshots + marcheur_observations, puis écrit `summaries[event.id].species_count = explorationSpeciesCounts[event.exploration_id]`.
- Donc si un événement correspond à **une seule marche** dans une exploration plus large, la carte Carnet peut afficher le **total de l’exploration** au lieu du **total de la marche réellement vécue**.
- Le problème de fond est structurel : `marche_events` a bien `exploration_id`, mais **pas de lien explicite vers la/les `marches` concernées**. Tant que ce lien n’est pas canonique, chaque vue peut ré-inférer différemment, et les écarts reviendront.

## Solution proposée
### 1. Créer une source de vérité canonique au niveau **événement**
Ajouter une couche DB qui calcule :
- **par marche** : déjà couvert par `get_marche_species_count`
- **par exploration** : déjà couvert par `get_exploration_species_count`
- **par événement** : nouvelle RPC canonique, basée sur les **marches réellement rattachées à l’événement**

Règle unique :
```text
entité -> marches liées -> filtre radius par marche -> union dédupliquée par nom scientifique normalisé
```

### 2. Rendre explicite le lien `marche_event -> marche(s)`
Pour éviter toute ré-inférence fragile, introduire un mapping canonique en base :
- soit `marche_event_marches(marche_event_id, marche_id, ordre)`
- soit un champ direct si la relation est strictement 1→1

Je recommande la **table de mapping**, car elle couvre les cas futurs et les cas mixtes sans hypothèse cachée.

### 3. Backfill robuste des données existantes
Remplir ce mapping avec une stratégie sûre :
- si l’exploration de l’événement ne contient **qu’une seule marche** → liaison automatique
- sinon, inférence depuis les tables qui portent déjà `marche_event_id` **et** `marche_id` (`marcheur_medias`, `marcheur_audio`, `marcheur_textes`, etc.)
- si ambiguïté persistante → marquer l’événement comme **à vérifier**, au lieu d’afficher un total faux

### 4. Faire consommer cette méthode commune par toutes les vues
Remplacer les calculs locaux restants par les RPC canoniques :
- **Carnet** : `useMarcheCollectedData` doit lire le total **par événement** via la nouvelle RPC, pas recalculer par exploration
- **Listes / cartes / badges d’événements** : mêmes RPC canoniques
- **Vues publiques** et autres compteurs événementiels encore basés sur snapshots locaux : les réaligner sur la même couche
- garder `get_exploration_species_count` pour les vues **exploration**, et `get_marche_species_count` pour les vues **marche**

## Implémentation
1. **Migration Supabase**
   - créer la table de mapping `marche_event_marches`
   - backfill des correspondances existantes
   - créer une RPC batch `get_marche_event_species_counts(p_event_ids uuid[])`
   - créer éventuellement une RPC unitaire `get_marche_event_species_count(p_event_id uuid)`
   - faire reposer cette RPC sur la même logique que `get_marche_species_count` / `get_exploration_species_count`

2. **Refactor frontend**
   - modifier `useMarcheCollectedData` pour ne plus calculer `species_count` côté client
   - injecter le résultat de la RPC canonique par `marche_event_id`
   - conserver les autres compteurs (photos/audio/textes/kigo) si leur logique actuelle est correcte

3. **Audit des consommateurs**
   - remplacer les derniers usages de `total_species` ou de déductions locales qui affichent un total d’espèces à l’utilisateur
   - vérifier en particulier les compteurs liés aux événements et aux listes

4. **Garde-fous**
   - si un événement n’a aucune marche liée de façon certaine, ne jamais retomber sur un total exploration “par défaut”
   - retourner plutôt `0` + état explicite/loggable, ou exclure du calcul jusqu’à résolution
   - documenter la règle comme mémoire technique du projet

## Détails techniques
- La hiérarchie de rayon reste inchangée et s’applique **marche par marche** :
```text
marches.radius_m
  -> explorations.default_radius_m
  -> 500
```
- Le total d’un événement multi-marches sera :
```text
union dédupliquée des espèces canoniques de chacune de ses marches
```
- Ainsi, un événement avec 150m pour une marche et 500m pour une autre restera exact, sans recalcul divergent selon la vue.

## Résultat attendu
- **Carnet** n’affichera plus `77` pour `ROQUE GAGEAC / Jardin` si l’événement ne correspond qu’à la marche canonique à `72` ou `44` selon son rattachement réel.
- Plus aucun écran ne pourra afficher un total différent pour la même entité tant qu’il consomme la couche canonique.
- On supprime la cause racine : **l’absence de méthode événementielle canonique et l’inférence implicite exploration → événement**.