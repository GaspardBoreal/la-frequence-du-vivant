# Correctif drawer iNat — 0 candidate alors que 81 photos perso

## Diagnostic (vérifié en DB)

Vincent Levavasseur a bien **81 photos perso** dans `marcheur_medias` (`user_id = …f4661e5af6be`, `is_public = true`), toutes liées au `marche_event_id = efe36e8c-…` qui appartient bien à l'exploration courante.

Le drawer en retourne **0** à cause d'une **confusion d'identifiants** :

- Le parent passe `explorationMarcheIds` = `[7 UUIDs]` qui sont des `exploration_marches.marche_id` (entité legacy `marches`).
- Le hook `useMarcheurUnidentifiedPhotos` filtre `marcheur_medias.marche_event_id IN explorationMarcheIds`.
- Or `marcheur_medias.marche_event_id` référence `marche_events.id` (ici `efe36e8c-…`), qui n'est PAS dans la liste passée → 0 résultat.

Vérifié :
```text
exploration_marches.marche_id  → 180bd4b9, 445a5db1, …  (7 ids)
marche_events.id               → efe36e8c-…             (1 id)
marcheur_medias.marche_event_id = efe36e8c-…  ✅
```

`marcheur_observations.marche_id` référence par contre **bien** les `exploration_marches.marche_id` (vérifié : 406/406). Donc deux référentiels coexistent.

## Correctif

### 1. `src/hooks/useMarcheurUnidentifiedPhotos.ts`
- Ajouter param `explorationEventIds: string[]` (ids `marche_events`).
- Query `marcheur_medias` → `.in('marche_event_id', explorationEventIds)` (au lieu de `explorationMarcheIds`).
- Query `marcheur_observations` → garde `.in('marche_id', explorationMarcheIds)` (correct).
- `enabled` : exige au moins l'une des deux listes non vide.
- Clé de cache : ajouter `eventIdsKey`.

### 2. `src/components/community/exploration/InatUploadPrepDrawer.tsx`
- Nouveau prop `explorationEventIds: string[]`.
- Forwarder au hook.
- La query `marche_events` qui mappe titre/date/GPS doit `.in('id', explorationEventIds)` (pas `explorationMarcheIds`) — actuellement aussi cassée pour la même raison.

### 3. `src/components/community/exploration/MarcheursTab.tsx`
- `ContributionsSubTab` reçoit déjà `explorationEventIds` indirectement via le parent (variable `explorationEventIds` existe ligne 1395). Ajouter le prop `explorationEventIds` à la signature et le passer au drawer.

## Hors scope
- La sub-query `marcheur_observations` reste sur l'ancien référentiel `marches` — fonctionnel pour les obs existantes ; pas de refactor du modèle data.
- Pas de modification RLS.

Pas de migration DB, pas de mémoire à mettre à jour (le flow documenté reste identique).
