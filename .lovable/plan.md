## Diagnostic — pourquoi le 2e clic sur le point intermédiaire jaune ne fait rien

En reproduisant mentalement le scénario de la copie d'écran (point 8 sélectionné en bleu, étoile jaune entre le 8 et le waypoint orange à gauche), deux causes très probables se cumulent :

### Cause 1 — Cible cliquable minuscule (cause principale)
Le waypoint orange (`waypointIcon`) ne fait que **7×7 px** avec `iconAnchor [3.5,3.5]`. Le halo cyan que l'on voit autour est purement décoratif (`interactive: false`, ajouté lors du fix précédent justement pour ne pas bloquer les clics). Résultat : pour valider le 2e endpoint il faut viser un disque de 7 px — au moindre décalage, Leaflet ne déclenche aucun événement et "rien ne se passe", sans même un toast d'erreur.

### Cause 2 — Filet de sécurité trop strict si la paire ne matche aucun candidat
Si malgré tout le clic touche le waypoint mais que la paire `(step8, wp)` ne figure pas dans les 4 meilleurs `SegmentCandidate` retenus (`limit = 4` sur `detectSegmentCandidates`, calculés autour du **clic initial** = étoile jaune), `handlePickEndpoint` tombe dans la branche `found < 0` et affiche un toast d'erreur, ce qui peut passer inaperçu si la cible cliquable est aussi le problème.

Aujourd'hui l'algorithme exige que la paire `{idA, idB}` corresponde aux endpoints **exacts** d'un candidat pré-calculé. C'est fragile : l'utilisateur peut très bien désigner un segment valide du tracé qui n'est pas dans le top-4.

---

## Solution proposée

### 1. Élargir la cible cliquable en mode pick (fix principal)
Dans `ExplorationCarteTab.tsx`, à l'intérieur du bloc `{pickMode && pendingWaypoint && (...)}`, transformer les `CircleMarker` cyan d'overlay en cibles **interactives** :

- Mettre `interactive: true` sur les halos cyan des steps **et** des waypoints.
- Leur attacher directement `eventHandlers={{ click: () => handlePickEndpoint({ kind, id, lat, lng }) }}`.
- Corollaire : on n'a plus besoin du `pickModeOnClick` injecté dans `WaypointMarker` ni du branchement `pickMode` sur les markers numérotés (le halo, plus large, intercepte le clic en premier puisqu'il est rendu après).

Bénéfice : zone cliquable de 18 px (steps) / 14 px (waypoints) au lieu de 7 px, et plus aucune interférence avec les popups natifs.

### 2. Recalculer les candidats à la volée si la paire n'est pas dans le top-4 (fix de robustesse)
Dans `handlePickEndpoint`, lorsque `findIndex` renvoie -1, au lieu d'abandonner avec un toast d'erreur :

- Reconstruire dynamiquement le candidat à partir de la paire `(pickedA, ep)` en parcourant `geoMarches` + `waypoints` pour retrouver `(after_marche_id, ordre)` du segment qui a ces deux ids comme endpoints consécutifs.
- Si trouvé → l'ajouter à `pendingWaypoint.candidates` et sélectionner ce nouvel index.
- Sinon seulement → toast "Ces 2 points ne sont pas voisins sur le tracé" + reset stage A.

### 3. Feedback visuel renforcé
- Toast "Point 1 sélectionné — cliquez sur le point voisin" quand `pickedA` est posé.
- Le halo `pickedA` (cyan foncé) reste tel quel.
- Curseur `crosshair` sur le conteneur Leaflet en mode pick (CSS).

---

## Détails techniques

**Fichier `ExplorationCarteTab.tsx`**
- Bloc `{pickMode && pendingWaypoint && (...)}` (lignes ~1049-1076) : passer `interactive: true` et ajouter `eventHandlers.click` sur chaque `CircleMarker`.
- `handlePickEndpoint` (lignes ~621-648) : avant l'erreur, tenter une reconstruction du segment via une nouvelle helper `findSegmentByEndpoints(aId, bId, geoMarches, waypoints)` qui retourne `{after_marche_id, ordre, p1, p2, ...} | null`.
- Nettoyer : retirer le branchement `pickMode` dans le `eventHandlers.click` du Marker numéroté (ligne ~1112) — devenu redondant et plus fragile que le halo.
- Ajouter une classe CSS sur le conteneur quand `pickMode` actif (curseur crosshair).

**Fichier `WaypointMarker.tsx`**
- Retirer le prop `pickModeOnClick` et la branche associée dans `eventHandlers.click` (devenue inutile).
- `draggable` redevient simplement `canEdit`.

**Nouvelle helper (dans `WaypointMarker.tsx`, exportée)**
```ts
export function findSegmentByEndpoints(
  aId: string, bId: string,
  geoMarches: {id,latitude,longitude}[],
  waypoints: ExplorationWaypoint[],
): SegmentCandidate | null
```
Parcourt chaque segment principal (entre 2 steps) en intercalant ses waypoints triés par `ordre`, puis renvoie le micro-segment dont `{p1.id, p2.id} === {aId, bId}`.

---

## Pourquoi ça résout le bug observé
- Cause 1 : le clic atteint maintenant un disque de 14 px → le 2e endpoint se sélectionne sans viser au pixel près.
- Cause 2 : même si la paire n'était pas dans le top-4 des candidats, elle est reconnue dynamiquement → plus de cul-de-sac silencieux.
- Bonus : la suppression du double chemin (halo décoratif + interception sur les markers réels) supprime toute possibilité de race condition Leaflet entre popup et pick-handler.