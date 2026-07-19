## Diagnostic

Le cluster « arion » qui apparaît sur la carte de l'événement DEVIAT « Jardin Monde » vient bien de `marcheur_observations` filtrées via `exploration_marches` : l'événement contient plusieurs marches, et au moins une des observations `Arion` a `marche_id = <marche Jardin Monde>` alors qu'elle est géographiquement plus proche d'une autre marche DEVIAT.

Autrement dit, ce n'est pas un bug d'affichage : c'est une **mauvaise attribution de `marche_id`** à la saisie (ou lors d'un import iNat). La carte fait son travail — elle révèle un problème de qualité de données qui restait invisible jusqu'ici.

Aujourd'hui la vue Carte n'affiche ni le nom de la marche associée à chaque point ni ne signale les points « hors périmètre ». D'où l'impression que l'outil se trompe.

## Plan (UI-only, aucune modif métier)

### 1. Enrichir chaque observation avec sa marche
- Étendre le fetch de `DuplicatesMapView` pour joindre `marches (id, name, latitude, longitude, search_radius_m)`.
- Ajouter `marche_name`, `marche_lat`, `marche_lng`, `marche_radius` sur l'objet `Obs`.

### 2. Détection « hors périmètre »
- Pour chaque obs : `distanceToMarche = haversine(obs, marche)`.
- Si `distanceToMarche > (marche.search_radius_m || 500) * 1.2` → flag `outOfPerimeter = true`.

### 3. Signalétique visuelle inspirante
- Marker `outOfPerimeter` : contour **rouge pointillé** + pastille ⚠ au lieu du blanc plein.
- Filament vers le centroïde en rouge, plus opaque.
- Tooltip du point : ajoute la ligne « Marche : *nom* — Xm hors périmètre » quand applicable.
- Dans le Sheet cluster : badge rouge « Hors périmètre marche » sur les cartes concernées + affichage du nom de la marche.

### 4. Bandeau de synthèse
Dans le header info actuel, ajouter : « ⚠ N observation(s) hors périmètre marche » (cliquable → filtre visuel qui n'affiche que ces points).

### 5. Lien vers correction
Sur chaque carte-obs du Sheet, bouton discret « Voir dans l'admin marche » (deep link `/admin/marches/:id` ancré sur l'observation) pour permettre à l'admin de réassigner le `marche_id`. Pas de réassignation directe ici — on garde la vue en lecture, la fusion taxonomique reste sa mission principale.

### Fichiers modifiés
- `src/components/admin/taxonomy/DuplicatesMapView.tsx` (fetch enrichi + rendu + Sheet)
- Aucun changement DB, aucun hook, aucune RLS.

### Hors scope (à confirmer si besoin plus tard)
- Réassignation automatique du `marche_id` au point le plus proche.
- Audit global des mis-attributions hors de cette page.
