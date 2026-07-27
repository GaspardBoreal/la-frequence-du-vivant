## Objectif

Dans la console **Contrôle GPS**, pouvoir saisir un marqueur (ex. le Lantana) et le **faire glisser** à sa position exacte, au lieu de passer par « Repositionner (clic carte) » ou par la saisie de coordonnées.

## Comportement proposé

1. **Marqueur déplaçable** : seul le point **sélectionné** (et, si un lot est coché, chaque point du lot) devient `draggable`. Les autres restent fixes pour éviter les déplacements accidentels.
2. **Repère visuel** : le marqueur déplaçable prend un anneau doré + curseur `grab`/`grabbing`, et une petite infobulle « Glissez pour corriger la position ».
3. **Pendant le glissé** : une ligne pointillée relie la position d'origine à la position courante, avec la distance en mètres affichée en direct (Haversine, utilitaire déjà présent).
4. **Au relâché** : mini-confirmation flottante « Nouvelle position · 128 m — Enregistrer / Annuler ».
   - *Enregistrer* → appelle la correction existante (`repositioned`, avec conservation de `original_lat/lon`).
   - *Annuler* → le marqueur revient instantanément à sa position d'avant.
5. **Lot** : si plusieurs points sont cochés, glisser l'un d'eux propose « Appliquer à la sélection (N points) » — les autres se déplacent du même vecteur, avec l'option d'éclatement 5 m déjà en place.
6. **Précision** : maintenir la carte au zoom courant pendant le glissé (pas de recadrage automatique), et rendre le glissé possible jusqu'au zoom 22 déjà autorisé.

## Détails techniques

- `src/components/propriete/gps/GpsControlConsole.tsx` :
  - `<Marker draggable={selectedId === c.id || selectedIds.has(c.id)}>` + `eventHandlers` `dragstart` / `drag` / `dragend`.
  - état local `dragDraft: { id, lat, lng, from: [lat,lng] } | null` pour l'aperçu et la confirmation ; `<Polyline>` pointillée entre `from` et la position courante.
  - `dragend` → `setDragDraft(...)` (aucune écriture immédiate) ; la validation réutilise `repositionMany([...], lat, lng)` (mode lot : delta appliqué à chaque cible).
  - désactiver la propagation du clic carte pendant un glissé pour ne pas déclencher `MapClickCapture`.
- Aucune modification base de données : la RPC `set_observation_gps_override` et le hook `useSetGpsOverridesBatch` couvrent déjà le besoin (clés UUID marcheur et URL iNaturalist).
- Les modes existants (clic carte, coordonnées collées, point de référence) restent inchangés.
