## Objectif

Lever l'ambiguïté lors du placement d'un point intermédiaire quand le tracé fait un aller-retour : laisser l'utilisateur **confirmer ou corriger** le segment d'insertion juste après avoir cliqué sur la carte.

## Comportement actuel

Le clic déclenche immédiatement la création du waypoint via `detectSegmentForPoint` (heuristique « detour »). Si la détection se trompe (cas aller-retour entre étape 7 et waypoint orange), aucun moyen de corriger sans supprimer puis recréer.

## Nouveau flux

1. Clic sur la carte en mode « point intermédiaire » → on n'écrit pas tout de suite en base.
2. Apparition d'un **marqueur fantôme** (le `waypointDraftIcon` pulsant existe déjà) à l'emplacement cliqué.
3. Ouverture d'une **modale de confirmation** (Dialog shadcn) :
   - Titre : « Où insérer ce point ? »
   - Sélecteur (Select) listant tous les segments candidats du tracé, formulés lisiblement :
     - « Entre étape 7 et étape 8 »
     - « Entre étape 7 et point intermédiaire (1/2) »
     - « Entre point intermédiaire (1/2) et étape 8 »
     - etc.
   - Le segment **présélectionné** = celui retourné par la détection auto actuelle (badge « suggéré »).
   - On affiche les 3-4 meilleurs candidats classés par score « detour », pas les 50 segments du tracé, pour ne pas noyer l'utilisateur.
   - Boutons : **Confirmer** / **Annuler**.
4. Pendant que la modale est ouverte, un **trait pointillé d'aperçu** (Polyline ambre) relie le point fantôme aux 2 endpoints du segment sélectionné, et se met à jour quand on change la sélection. Ainsi l'utilisateur voit visuellement l'insertion avant de valider.
5. **Confirmer** → création réelle via `useCreateWaypoint` avec `after_marche_id` + `ordre` du segment choisi. **Annuler** → on retire le marqueur fantôme.

## Fichiers concernés

- `src/components/community/exploration/WaypointMarker.tsx`
  - Exposer une variante `detectSegmentCandidates(...)` qui renvoie un **tableau trié** des N meilleurs segments (au lieu d'un seul), avec libellé déjà formaté.
- `src/components/community/exploration/ExplorationCarteTab.tsx`
  - Remplacer la création immédiate dans le handler de clic par : `setPendingWaypoint({ lat, lng, candidates, selectedIdx: 0 })`.
  - Ajouter le **draft Marker** + la **Polyline d'aperçu** (Leaflet) pendant que `pendingWaypoint` existe.
  - Ajouter une nouvelle modale `WaypointInsertConfirmDialog` (peut vivre dans le même fichier ou un fichier voisin).

## Hors périmètre

- Pas de changement de la métrique `detectSegmentForPoint` elle-même (déjà bonne dans 80 % des cas, juste insuffisante pour les aller-retours).
- Pas de changement DB / RLS / Edge Function.
- Pas de changement visuel des waypoints existants (taille, couleur).
- Pas de glisser-déposer pour réassigner un waypoint déjà créé (peut venir plus tard si besoin).

## Détails techniques

- `detectSegmentCandidates` : même boucle que `detectSegmentForPoint`, mais on accumule tous les segments dans un tableau, on trie par `score` (detour) croissant, on tronque à 4. Chaque entrée porte `{ after_marche_id, ordre, score, label }`.
- Le `label` est construit côté `ExplorationCarteTab` (qui connaît la numérotation des étapes et l'ordre des waypoints existants par segment) — `WaypointMarker` ne renvoie que les indices, le label est calculé dans le tab via une petite fonction utilitaire.
- L'aperçu visuel : 2 `<Polyline>` ambre pointillés (waypoint draft → endpoint A, waypoint draft → endpoint B), épaisseur 2, opacité 0.7.
- Modale : composant shadcn `Dialog` déjà utilisé ailleurs dans le projet, donc cohérent visuellement.
