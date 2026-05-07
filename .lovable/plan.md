## Points intermédiaires (waypoints) sur le parcours

Objectif : permettre de tracer fidèlement le chemin réel entre deux points de marche officiels, sans polluer les vues qui listent les "vraies" marches.

### 1. Stockage — nouvelle table `exploration_waypoints`

Colonnes :
- `id` (uuid, PK)
- `marche_event_id` (uuid, FK → marche_events, ON DELETE CASCADE)
- `after_marche_id` (uuid, FK → marches) — étape principale qui précède le waypoint dans l'ordre
- `ordre` (integer) — position au sein du segment `after_marche_id → suivant`
- `latitude`, `longitude` (numeric)
- `label` (text, nullable) — note libre courte
- `include_in_biodiversity` (boolean, default false) — opt-in pour comptage global
- `biodiversity_synced_at`, `cadastre_synced_at` (timestamptz, nullable)
- `created_by`, `created_at`, `updated_at`

RLS :
- Lecture : tout participant à l'événement (mêmes règles que `marches`)
- Écriture / update / delete : mêmes rôles que création de marche (sentinelle, ambassadeur, admin) — via `has_role` et fonction `can_edit_marche_event(event_id)` réutilisable

Index : `(marche_event_id, after_marche_id, ordre)`.

### 2. Création / édition (les deux modes)

- **Bouton dédié** à côté de `+ point de marche` : pastille ambre `+ point intermédiaire`. Mode actif → tap sur la carte ouvre une mini-fiche (segment détecté auto, label optionnel, valider).
- **Clic long sur la carte** entre 2 étapes : détecte le segment le plus proche (projection point/segment haversine), insère à l'ordre correct.
- Marker draggable une fois posé (snap au segment voisin pour réordonner).
- Suppression via popup du waypoint.
- Permissions vérifiées côté UI (boutons cachés) ET côté RLS.

### 3. Rendu visuel

- Petit cercle ambre/sable semi-transparent (12px, halo doux), sans numéro, opacité 0.7, ring `border-amber-300/40`.
- Tooltip au survol : "Point intermédiaire · entre étape 4 et 5".
- Polyline principale **passe par les waypoints** : on construit un tableau `routePositions = [étape1, ...wp(1→2), étape2, ...wp(2→3), étape3, ...]` qui remplace `positions` dans la `<Polyline>` et `ArrowDecorators`.
- Couleur/dashArray inchangés — la cohérence vient du fait que le trait suit désormais le vrai chemin.
- Toggle "Afficher les points intermédiaires" dans le menu carte (ON par défaut). OFF → markers cachés mais polyline reste sur waypoints.

### 4. Distance affichée

Compteur bas de carte affichera deux valeurs :
```
13 étapes      ~7,2 km vol d'oiseau · ~8,4 km estimés      38 espèces
```
- **Vol d'oiseau** : somme haversine étape→étape (valeur actuelle).
- **Estimé** : somme haversine étape→waypoint→…→étape suivante (utilise les waypoints comme proxys du chemin réel).
- Sur petit écran : une seule valeur visible (`estimés` prioritaire), tap → bascule.

### 5. Biodiversité & cadastre par waypoint

Au clic sur un waypoint → popup ambre avec :
- Coordonnées + label
- Bouton **Biodiversité (500 m)** : lance `collect-event-biodiversity` adapté pour accepter `(lat, lng, radius)` au lieu d'un `marche_id`. Stocke le snapshot dans une table légère `waypoint_biodiversity_snapshots` (par waypoint_id) ou réutilise le mécanisme existant avec `source = 'waypoint'`.
- Bouton **Cadastre** : ouvre/centre le calque cadastre déjà présent (`mapStyle = 'cadastre'`) sur la position du waypoint et affiche les parcelles via le proxy LEXICON existant.
- État de fraîcheur affiché (synced_at).

### 6. Agrégation Synthèse — toggle "Inclure les points intermédiaires"

Dans l'onglet **Synthèse** :
- Toggle persisté (localStorage par event) : `Inclure les points intermédiaires dans les statistiques`.
- OFF (défaut) : compteurs et listes d'espèces inchangés.
- ON : agrège les snapshots des waypoints `include_in_biodiversity = true` au total esp/observations, déduplication par nom scientifique normalisé NFD (règle existante).
- Un petit badge `+ N pts intermédiaires` apparaît dans les KPIs concernés.

### 7. Vues impactées

- ✅ Carte marcheur (`ExplorationCarteTab`) : markers + polyline + distance + popup actions.
- ✅ Carte admin événements (`EventsMapTab` + `MarcheMapView` si applicable) : markers visibles, lecture seule, polyline mise à jour.
- ❌ Onglets **Marches**, **Marcheurs**, **Apprendre**, listes/exports/CRM : **aucun changement** — ils interrogent `marches`/`marche_events`, jamais `exploration_waypoints`.
- ❌ `useExplorationMarchesList`, `useMarcheurContributions`, exports Word/PDF/CSV des marches : intacts.

### 8. Points techniques

- Hook `useExplorationWaypoints(eventId)` (React Query, staleTime 5min).
- Hook `useRouteWithWaypoints(geoMarches, waypoints)` → mémoïse `routePositions` + `estimatedDistanceKm`.
- Mutations `useCreateWaypoint`, `useUpdateWaypoint` (drag), `useDeleteWaypoint` avec invalidation.
- Edge function `collect-waypoint-biodiversity` (clone allégée de `collect-event-biodiversity`) — 500 m hardcodé, cohérent avec règle mémoire existante.
- Migration SQL : table + RLS + trigger updated_at.
- Mémoire projet à enrichir : `mem://features/mon-espace/exploration-waypoints-logic`.

### 9. Hors périmètre (à confirmer plus tard)

- Routing réel via OSRM/ORS (la valeur "estimée" reste une approximation polyligne pour l'instant).
- Édition collaborative multi-rôles au-delà des curateurs.
- Affichage waypoints dans les exports PDF / ePub publics.

### Schéma flux

```text
[étape 4] --•--•--•-- [étape 5]
            ^waypoints ambre (ordre 1,2,3 du segment 4→5)
            polyline = [4, wp1, wp2, wp3, 5]
            distance estimée = haversine(4,wp1)+(wp1,wp2)+(wp2,wp3)+(wp3,5)
```
