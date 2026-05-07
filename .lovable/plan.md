# Améliorer l'insertion d'un point intermédiaire

## Diagnostic

Sur la copie 1, le tracé zigzague **avant même** d'insérer un nouveau point : les points intermédiaires existants sont déjà mal rattachés à un segment (mauvais `after_marche_id` / `ordre`). Le mode « Suggéré » de la copie 2 propose bien « Entre étape 8 et point intermédiaire 1/1 » avec un détour de 9 m… mais ce « point intermédiaire 1/1 » n'est pas celui que vous croyez voir : c'est le premier point du segment 8→9 dans la base, pas le point jaune visible en haut à gauche (qui est probablement rattaché à un autre segment, ex. 10→11 ou 11→12, d'où le zigzag).

Aucune des 4 propositions ne peut donc résoudre le problème : les **endpoints affichés ne correspondent pas aux points visibles à l'écran** car les libellés sont calculés à partir de la structure interne (souvent fausse), pas de la géométrie réelle.

## Solution proposée

Trois améliorations cumulatives, du plus simple au plus complet.

### 1. Libellés enrichis avec coordonnées et survol cartographique

Dans `WaypointInsertConfirmDialog`, au lieu de « point intermédiaire 1/1 » abstrait :
- Afficher l'**id court** ou les **coordonnées tronquées** de chaque endpoint (`p1`, `p2`).
- Au **survol d'une option**, faire clignoter sur la carte 2 gros cercles ambrés autour de `p1` et `p2` du candidat, plus la polyline ambre courante. Le ghost marker reste fixe.

→ L'utilisateur voit immédiatement quels 2 points réels sont concernés, sans deviner.

### 2. Mode « sélection directe sur la carte » (bouton dans le dialog)

Ajouter un bouton **« Choisir les 2 points sur la carte »** dans le dialog. En cliquant :
- Le dialog se réduit en bandeau flottant.
- Tous les points (étapes principales + waypoints existants) deviennent **cliquables et numérotés temporairement** (gros halos cyan).
- L'utilisateur clique sur le **point A** puis le **point B** (étape 8 puis le point jaune visible).
- Le segment correspondant est calculé déterministiquement à partir des 2 IDs choisis (peu importe la position du clic initial).
- Confirmation directe.

→ 0 % d'ambiguïté : l'utilisateur désigne explicitement les 2 voisins.

### 3. Réparer le tracé existant : drag-and-drop des waypoints entre segments

Bouton **« Réorganiser le tracé »** au-dessus de la carte. Mode édition :
- Les points intermédiaires deviennent draggables non plus seulement géographiquement (déjà le cas) mais aussi **logiquement** : un panneau latéral liste les segments (Étape 7→8, Étape 8→9, …) avec les waypoints rattachés en dnd-kit.
- L'utilisateur réordonne / déplace un waypoint d'un segment à un autre → mise à jour `after_marche_id` + `ordre` via `useUpdateWaypoint`.

→ Permet de corriger les zigzags hérités sans avoir à supprimer / recréer.

## Périmètre

- **Frontend uniquement.** Pas de migration DB, pas d'Edge Function modifiée.
- Fichiers touchés :
  - `WaypointInsertConfirmDialog.tsx` — survol + bouton « Choisir sur la carte ».
  - `ExplorationCarteTab.tsx` — état `pickingMode`, halos temporaires, panneau de réorganisation.
  - `WaypointMarker.tsx` — exposer `waypointHighlightIcon` pour le survol.
  - Nouveau `WaypointReorderPanel.tsx` (étape 3, optionnel selon priorité).
- Réutilise `useUpdateWaypoint` pour la réattribution.

## Détails techniques

- **Survol (1)** : `onMouseEnter` sur chaque bouton du dialog → `setHoveredCandidate(idx)`. La carte lit cet état et rend 2 `<CircleMarker>` ambrés (rayon 14 px) sur `p1` et `p2`.
- **Sélection directe (2)** : `pickingMode: 'idle' | 'pickA' | 'pickB'`. Chaque marqueur (étape ou waypoint) attache un `eventHandlers.click` conditionnel. Une fois A et B choisis, on cherche dans la liste générée par `detectSegmentCandidates` (étendue à `limit: Infinity`) le candidat dont `(p1, p2)` matche les 2 IDs — on récupère son `after_marche_id` et `ordre`.
- **Réorganisation (3)** : `@dnd-kit/sortable` déjà utilisé dans le projet (cf. mémoire « marcheur observations reordering »). Mutation par batch via `useUpdateWaypoint`.

## Recommandation

Implémenter **étapes 1 + 2** d'abord (valeur immédiate, faible risque). L'étape 3 peut être une seconde itération si le besoin de corriger l'existant persiste.
