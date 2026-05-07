## Diagnostic — pourquoi la popup réapparaît

Voici la séquence réelle dans `ExplorationCarteTab.tsx` :

1. Tu places le point jaune → `pendingWaypoint` est créé → la popup s'ouvre (car `open = !!pendingWaypoint && !pickMode`).
2. Tu cliques **« Aucune ne correspond — choisir les 2 points sur la carte »** → `setPickMode({stage:'A'})` → la popup se ferme (car `pickMode` devient truthy).
3. Tu cliques sur le point 8 → `handlePickEndpoint` enregistre `pickedA` et passe à `stage:'B'`.
4. Tu cliques sur le point intermédiaire voisin → `handlePickEndpoint` :
   - retrouve (ou reconstruit) le segment correspondant,
   - met à jour `pendingWaypoint.selectedIdx` sur ce segment,
   - **fait `return null` sur `pickMode`**.
5. Conséquence : `pickMode` redevient `null`, mais `pendingWaypoint` est toujours là → la condition `open = !!pendingWaypoint && !pickMode` redevient `true` → **la popup se rouvre**.

C'est exactement ce que tu vois (capture 2) : la popup réapparaît avec « Suggéré » sur l'option 1 (qui est effectivement le segment que tu viens de choisir manuellement, étape 8 ↔ point intermédiaire 1/1). Si ensuite tu cliques **Confirmer** et que le waypoint apparaît mal placé (associé à l'étape 9), c'est un second bug : l'index du segment renvoyé par `findSegmentByEndpoints` est mal traduit en `(after_marche_id, ordre)` quand le voisin est un waypoint et non une étape.

Donc il y a **deux problèmes** à régler ensemble pour que le flux soit clair et correct.

## Plan de correction

### 1. Supprimer la popup de re-confirmation après un pick manuel

Quand l'utilisateur a explicitement cliqué sur 2 points sur la carte, son intention est sans ambiguïté : on doit **créer le waypoint immédiatement**, sans rouvrir la popup pour redemander la même chose.

Dans `ExplorationCarteTab.tsx`, fonction `handlePickEndpoint` (~ligne 621) :

- Au lieu de seulement mettre à jour `pendingWaypoint.selectedIdx` et de fermer `pickMode`, il faut **déclencher directement** `createWaypoint.mutate(...)` avec le segment résolu, puis nettoyer `pendingWaypoint`, `pickMode`, `hoveredCandidateIdx`.
- Toast de succès : « Point intermédiaire ajouté entre {label} ».
- Sortir la logique de création dans une petite helper `commitWaypoint(c: SegmentCandidate)` réutilisée par `onConfirm` du dialog **et** par le pick manuel — pour éviter la duplication.

### 2. Garantir que le segment reconstruit cible le bon couple (after_marche_id, ordre)

Toujours dans `handlePickEndpoint`, brancher la vérification suivante avant de commit :

- Re-loguer (debug temporaire) `c.after_marche_id`, `c.ordre`, `c.afterMarcheIndex`, `c.kInSegment`, `c.totalInSegment` pour le segment résolu.
- Ouvrir `findSegmentByEndpoints` (probablement dans `WaypointMarker.tsx` ou un util voisin) et vérifier que pour le couple **(étape N, waypoint W situé entre étapes N et N+1)** la fonction renvoie bien :
  - `after_marche_id = étape N`,
  - `ordre = ordre(W) - 1` si on insère **avant** W, ou `ordre(W) + 1` si on insère **après** W,
  - et **pas** `after_marche_id = étape N+1` (qui causerait l'attachement visuel à l'étape 9 que tu observes).
- Corriger le calcul dans `findSegmentByEndpoints` pour les segments mixtes (étape ↔ waypoint et waypoint ↔ waypoint) selon la position réelle du point jaune par rapport aux deux endpoints.

### 3. Ajustement UX du bandeau pick-mode

Le bandeau cyan « Cliquez sur le 2ᵉ point voisin » doit clairement annoncer ce qui va se passer :

- Étape A : « Cliquez sur le 1ᵉʳ point voisin (étape ou point intermédiaire) ».
- Étape B : « Cliquez sur le 2ᵉ point voisin — l'insertion sera validée automatiquement ».

Cela évite à l'utilisateur de chercher un bouton « Confirmer » qui n'existera plus à cette étape.

## Fichiers touchés

- `src/components/community/exploration/ExplorationCarteTab.tsx` — refacto `handlePickEndpoint`, extraction `commitWaypoint`, message du bandeau pick-mode.
- `src/components/community/exploration/WaypointMarker.tsx` (ou util voisin contenant `findSegmentByEndpoints`) — correction du calcul `(after_marche_id, ordre)` pour les segments impliquant un waypoint.

## Vérification

1. Reproduire le scénario complet (point jaune → pick step 8 → pick waypoint voisin) → le waypoint doit être créé **sans** réouverture de popup, et **placé exactement entre les 2 points choisis** sur la polyline.
2. Tester aussi le cas waypoint ↔ waypoint et étape ↔ étape adjacentes pour confirmer la régression non introduite.
3. Capture d'écran après création pour confirmer la position visuelle.