# Diagnostic — où sont passées les 5 espèces ?

## Ce que disent les données

Exploration `20dd3be8…` (5 marches). Comptage **aujourd'hui** :

| Source | Espèces uniques |
|---|---|
| Snapshots iNat (∪ des 5 marches) | **77** |
| Observations marcheurs | **75** |
| **Union (= ce que l'UI affiche)** | **89** |

Tu te souviens de **94** → il manque **5 espèces**.

## Ce qui s'est passé

1. **Les snapshots ont été ré-écrasés aujourd'hui** entre 15:14 et 15:15 (4 marches sur 5). La 5ᵉ marche (`f94e5c2f…`) date du 19/05 07:30 — elle n'a **pas** été resynchronisée dans la même passe → désynchro partielle.
2. La fonction `sync-biodiversity-snapshot` fait un **`DELETE` + `INSERT`** brut (lignes 69-94) : aucune version conservée. **L'ancien snapshot à 94 espèces est définitivement perdu**, on ne peut pas lister nominalement les 5 disparues.
3. Pourquoi iNat renvoie moins d'espèces qu'avant : l'API iNaturalist est volatile (changement de rayon effectif, repli d'observations sous une espèce parente après identification communautaire, observations passées en "captive/cultivated", `quality_grade` recalculé, pagination tronquée si timeout). Une simple résync peut faire fluctuer le total de ±5 à ±15 espèces sur une zone moyenne.
4. Aucune ligne dans `data_collection_logs` pour la passe du 19/05 15:14 → la resync a transité par `snapshot-sync-on-view` (déclenchement implicite à la visite) **sans logging**, donc invisible côté admin.

## Conclusion : 2 causes structurelles

- **A. Pas d'historisation** des snapshots → toute régression iNat est silencieuse et irréversible.
- **B. Resync "on-view" non journalisée + non atomique** sur les 5 marches → on peut avoir un état mixte (4 marches v2 + 1 marche v1).

---

# Plan de remédiation

## 1. Historiser les snapshots (cœur du fix)

Ajouter `biodiversity_snapshots_history` (même schéma + `archived_at`, `replaced_by_snapshot_id`, `delta_species jsonb`). Modifier `sync-biodiversity-snapshot` :
- avant `DELETE`, lire l'ancien snapshot, l'archiver dans la table d'historique
- calculer `delta_species` = `{ added: [...], removed: [...] }` (diff par `scientificName` normalisé)
- conserver les N=20 dernières versions par marche (purge soft)

Bénéfice : à tout moment on peut répondre "quelles espèces ont disparu entre le 17/05 et le 19/05 ?".

## 2. Garde-fou anti-régression

Dans la même edge function, si `nouveau_total < ancien_total * 0.85` (perte > 15 %) :
- **ne pas écraser** ; insérer le nouveau snapshot avec flag `status='quarantine'`
- l'UI continue de servir l'ancien snapshot `status='active'`
- créer une entrée dans `data_collection_logs` avec `status='quarantine'` + `summary_stats.regression_pct` pour qu'un admin valide manuellement

## 3. Journaliser la resync "on-view"

`snapshot-sync-on-view` doit écrire dans `data_collection_logs` (mode `on-view`) → traçabilité complète.

## 4. Atomicité par exploration

Quand la resync est déclenchée pour une exploration, la lancer en **batch sur les 5 marches** au lieu d'une à une au fil des vues, pour éviter l'état mixte observé (4 marches v2 + 1 marche v1).

## 5. Outil admin "Diff biodiversité"

Petit panneau dans la fiche exploration admin : timeline des versions de snapshots avec, pour chaque resync, la liste `+espèces ajoutées` / `-espèces retirées` (lue depuis `delta_species`). Cela répond directement à "quelles espèces ont disparu ?" la prochaine fois.

## Hors scope

- Pas de modification de la logique de comptage (union snapshots ∪ marcheur_observations reste la référence).
- Pas de retraitement rétroactif : les 5 espèces du 17/05 sont perdues (aucune trace en base). On peut tenter une recollecte iNat ciblée, mais elle ne rendra que ce qu'iNat veut bien servir aujourd'hui.

## Fichiers touchés

- migration : `biodiversity_snapshots_history` + index sur `(marche_id, archived_at desc)`
- edge function : `supabase/functions/sync-biodiversity-snapshot/index.ts` (archivage + garde-fou)
- edge function : `supabase/functions/snapshot-sync-on-view` (logging + batch exploration)
- UI admin : nouveau composant `BiodiversityHistoryTimeline.tsx` dans la fiche exploration
