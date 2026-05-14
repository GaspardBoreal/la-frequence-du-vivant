# Fix : dates incohérentes dans Synthèse → Taxons

## Diagnostic

Dans `EventBiodiversityTab.tsx`, la transformation `allSpeciesAsBiodiversity` qui alimente `SpeciesExplorer` (cartes Taxons) attribue à chaque espèce :

```ts
lastSeen: snap.snapshot_date || ''
```

`snapshot_date` est la **date à laquelle le snapshot a été généré/synchronisé** côté backend, pas la date réelle de la dernière observation terrain. C'est pour cela que **toutes les 4 espèces affichent 14/05/2026** (jour du dernier sync) au lieu de leur vraie dernière date d'observation visible dans la fiche (modal "Sur le terrain", carrousel + onglet Liste).

De plus, lors du merge entre snapshots, `lastSeen` n'est **jamais mis à jour** : on garde la valeur du premier snapshot rencontré.

Cela viole la règle Core mémoire : *"Prioritize observationDate"*.

## Correctif

Dans `src/components/community/EventBiodiversityTab.tsx`, fonction `allSpeciesAsBiodiversity` :

1. Helper `computeLastSeen(attrs)` qui retourne le `max(attr.date)` parmi les attributions valides (date ISO parsable). Fallback sur `snap.snapshot_date` uniquement si aucune date d'observation exploitable.
2. À la création d'une espèce dans la map : `lastSeen = computeLastSeen(spAttributions) ?? snap.snapshot_date`.
3. Au merge avec une espèce existante : `existing.lastSeen = max(existing.lastSeen, computeLastSeen(newAttrs))`.

Aucun changement côté `SpeciesExplorer`, `EnhancedSpeciesCard`, hooks, RPC, ou base de données. Aucun impact sur la fiche espèce (qui lit déjà la vraie date depuis ses propres sources).

## Fichier modifié

- `src/components/community/EventBiodiversityTab.tsx` (lignes ~210-263)

## Vérification

Après correctif, ouvrir Synthèse → Taxons : chaque carte doit afficher la date la plus récente trouvée dans ses attributions (donc différente d'une espèce à l'autre quand les observations diffèrent), cohérente avec la fiche espèce.
