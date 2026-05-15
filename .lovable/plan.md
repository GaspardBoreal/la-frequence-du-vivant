## Diagnostic

J'ai vérifié les 3 sources qui affichent un compteur d'espèces pour l'exploration `DEVIAT / Jardin Monde` (id `20dd3be8…`) — les 3 chiffres viennent de **3 hooks différents** qui dédupliquent **différemment**, et tous lisent une table `biodiversity_snapshots` qui **n'a pas été resynchronisée depuis hier**.

### 1. Pourquoi 60 / 64 / 60 ?

| Vue | Hook | Source | Déduplication | Résultat |
|---|---|---|---|---|
| Carnet (capture 1) | `useMarcheCollectedData` | `biodiversity_snapshots.species_data` uniquement | clé = `scientificName` | **60** |
| Carte (capture 2) | `useExplorationBiodiversitySummary` | snapshots **+** `marcheur_observations` | clé = `commonName \|\| scientificName`, ajoute les obs marcheurs absentes des snapshots | **64** |
| Pouls du vivant (capture 3) | `useBiodiversityEvolution` | snapshots uniquement | clé = `scientificName` | **60** |

Les **+4** de la Carte = 4 espèces saisies par des marcheurs (table `marcheur_observations` — 94 lignes pour cette exploration) qui ne sont pas (encore) dans les snapshots iNat.

### 2. Pourquoi les saisies iNat de ce matin (chêne, vigne) sont invisibles ?

Requête sur `biodiversity_snapshots` pour les 4 marches de l'exploration :

```text
marche_id                              total_species   created_at
bf50566d-77d6-4776-a0aa-c62965d74a81   59              2026-05-14 17:55
4095a154-737b-4238-a454-8a06e6f3807e   51              2026-05-14 13:32
f94e5c2f-305d-4b37-8ce3-7687c0195cd0   51              2026-05-14 09:55
67890ed0-1279-43f5-b971-714360897e9d   51              2026-05-14 09:55
```

Les snapshots datent **d'hier**. Le cron `collect-event-biodiversity` tourne 1×/jour ; il n'y a **pas** de re-sync au montage de la page exploration. Donc tant que le cron n'est pas repassé, les nouvelles obs iNat (< 15 min) ne sont visibles nulle part — c'est attendu côté code, mais c'est un vrai trou UX.

## Plan de correction

### A. Unifier les 3 compteurs (cohérence stricte)

Source de vérité unique = `useExplorationBiodiversitySummary` (déjà fusionne snapshots + `marcheur_observations`, conforme à la mémoire `score-citizen-observations-fusion-logic`).

1. **Carnet** (`useMarcheCollectedData`) : remplacer le calcul local de `species_count` par un appel à la même fusion (snapshots + `marcheur_observations` dédupliqués par `scientificName` lowercased), pour qu'un événement remonte le **même total** que la Carte.
2. **Pouls du vivant** (`useBiodiversityEvolution`) : injecter aussi les `marcheur_observations` dans les buckets journaliers (date = `observation_date`), pour que la courbe atteigne le même total et reflète les saisies marcheurs.
3. Harmoniser la **clé de dedup** sur `scientificName.toLowerCase()` partout (le `commonName || scientificName` actuel de la Carte introduit des doublons quand le même taxon est tantôt avec, tantôt sans nom commun).

### B. Rafraîchir les snapshots à la volée (freshness iNat)

Au montage de `ExplorationDetail` (ou dès l'ouverture de l'onglet Carte / Synthèse), déclencher en arrière-plan `collect-event-biodiversity` si le snapshot le plus récent de l'exploration a **plus de 2 h** :

- Lire `max(created_at)` sur les snapshots des marches de l'exploration.
- Si `> 2h` → `supabase.functions.invoke('collect-event-biodiversity', { body: { explorationId } })` en fire-and-forget.
- Au retour : invalider les query keys `['exploration-biodiversity-summary', explorationId]`, `['marche-collected-data', …]` et `['biodiversity-snapshots-evolution', …]` pour que les 3 vues se mettent à jour.
- Afficher un petit indicateur discret « Mise à jour des observations… » pendant la resync (pas de blocage).

Conforme à la mémoire `snapshot-sync-on-view-logic` (qui prévoit déjà ce pattern mais n'est manifestement pas câblé sur cette page).

### C. (option) Bouton manuel « Rafraîchir »

Petit bouton 🔄 à côté du compteur de la Carte qui force le `collect-event-biodiversity` immédiatement, pour les cas où l'utilisateur vient de saisir et veut voir le résultat tout de suite.

## Détails techniques

- **Fichiers à modifier** :
  - `src/hooks/useMarcheCollectedData.ts` → fusionner `marcheur_observations` dans le calcul `species_count`.
  - `src/hooks/useBiodiversityEvolution.ts` → accepter un 2ᵉ paramètre `marcheurObservations[]` et créer des `DayObservation` à partir de `observation_date`.
  - `src/components/community/CarnetVivant.tsx` → passer les `marcheur_observations` (déjà chargées ailleurs ou via un nouveau hook léger).
  - `src/pages/ExplorationDetail.tsx` (ou `ExplorationLayout`) → ajouter le hook `useEffect` de resync + invalidations React Query.
  - Optionnel : nouveau composant `RefreshSnapshotsButton`.

- **Pas de migration DB** — uniquement du code front + appel d'une edge function existante.

- **Risque** : la resync coûte 1 appel iNat par marche ; le throttle est déjà géré dans l'edge function `collect-event-biodiversity` (le cron quotidien l'utilise). On limite quand même via la garde « > 2h ».

## Ce que ça donne après

- Carnet, Carte et Pouls du vivant affichent **tous le même chiffre** (≥ 64 actuellement, +2 dès que la resync ramène le chêne et la vigne d'iNat).
- À chaque ouverture de l'exploration, les obs iNat de moins de 2 h apparaissent automatiquement sans attendre le cron du lendemain.
