## Diagnostic — Pourquoi la note de Laurence Karki est incohérente


| Source de données                                             | Espèces de Laurence (DEVIAT 11.04.26)                                                                                                                |
| ------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `marcheur_observations` (table de référence du score)         | **2 espèces** : Iris pseudacorus (bio), Carabus coriaceus (aux) — 3 lignes "Attribution depuis L'Œil"                                                |
| `biodiversity_snapshots` (utilisé par l'onglet Contributions) | **5 espèces** iNat sous le pseudo `laurencekarki` : Helichrysum, Pisaura mirabilis, Flavoparmelia caperata, Sphaeroderma rubidum, Lotus corniculatus |


**Conséquences sur la Fréquence :**

- *Diversité d'espèces* : 2/10 ⟶ devrait compter 5+ espèces uniques (union)
- *Volume* : 2 contributions ⟶ devrait inclure les 5 obs iNat (= 7)
- *Détections précieuses* : 6/35 (1 bio + 1 aux) ⟶ ne tient pas compte d'une éventuelle curation des espèces iNat (Lotier, Lichen, etc.)
- *Variété des gestes* : 3 piliers / 5 ⟶ le pilier "espèce sensible" est OK mais le pilier "photo" reste KO car aucune photo locale (les photos iNat ne sont pas comptées comme contribution photo)

La cause racine : `useExplorationParticipants` n'alimente `speciesObserved` et `speciesCount` qu'à partir de `marcheur_observations`. La table `biodiversity_snapshots` (qui matérialise les observations iNat/GBIF/eBird via alias) est ignorée par le calcul du score.

## Objectif

Rendre la Fréquence **strictement cohérente** avec ce qui est affiché dans l'onglet Contributions, en faisant des observations iNat de première classe pour le calcul du score.

## Plan — 2 volets

### Volet 1 — Source unifiée des espèces par marcheur (correctif principal)

Dans `src/hooks/useExplorationParticipants.ts`, après avoir construit `obsByMarcheur` à partir de `marcheur_observations`, **fusionner** les espèces extraites de `biodiversity_snapshots` filtrées par alias :

1. Pour chaque marcheur (crew + community + orphan), construire un `Set<string>` d'**aliases normalisés** (nom complet + concaténation + variantes inversées + logins iNat/GBIF/eBird depuis `community_profile_science_accounts`). Mutualiser via `useMarcheurAliases` côté hook ou via une RPC qui renvoie les aliases pour tous les marcheurs d'une exploration en un appel.
2. Charger `biodiversity_snapshots(species_data)` une fois pour toutes les marches de l'exploration.
3. Pour chaque attribution dont `observerName` (normalisé) ∈ aliases d'un marcheur :
  - Ajouter `scientificName` à `speciesSetByMarcheur` (déduplication automatique avec les espèces déjà comptées via `marcheur_observations`)
  - Ajouter une entrée à `obsByMarcheur` avec `photoUrl` (depuis `sp.photoData`/`sp.photos[0]`) et `observationDate` (depuis `attr.date`)
  - Incrémenter un compteur `inatPhotos[userId]` (réutilisé pour le pilier "photo")

### Volet 2 — Injecter le volume iNat dans la Fréquence

Dans `MarcheursTab.tsx` (`metricsById`, ~L.1452), enrichir les inputs de `computeSentinelleIndex` :

- `photos` : `m.stats.photos + m.stats.videos + inatPhotos[userId]` (les obs iNat avec `photoUrl` comptent comme photo) ⟶ active le pilier "photo" + augmente le Volume sans modifier la formule existante
- `speciesCount` : déjà corrigé par le Volet 1 (union des sources)
- `bioCount/auxCount/eeeCount` : déjà corrigés (la curation s'applique aussi aux espèces iNat puisque `bucketSensibleSpecies` reçoit la liste fusionnée)

### Volet 3 — Honnêteté résiduelle dans le drawer

Une fois les espèces iNat injectées, l'encart "Ce qui n'est pas (encore) compté" du `ScoreCriterionDrawer` devient obsolète pour Volume/Diversité (les chiffres convergent). Le remplacer par :

- **Volume** : afficher la décomposition `X locales + Y iNat` pour la transparence
- **Diversité** : afficher `X locales + Y iNat (Z communes)` 
- L'encart d'avertissement reste affiché uniquement si un écart résiduel existe (ex. `realContribCount > volume.raw`), signalant un bug d'alias plutôt qu'une omission de design.

## Fichiers touchés

- ✏️ `src/hooks/useExplorationParticipants.ts` — fusion des sources d'observations + nouveau champ `inatPhotos` dans `MarcheurWithStats.stats`
- 🆕 (optionnel) RPC SECURITY DEFINER `get_exploration_marcheur_aliases(exploration_id)` — renvoie `Map<userId, alias[]>` en un appel pour éviter N+1
- ✏️ `src/components/community/exploration/MarcheursTab.tsx` (`metricsById`) — ajouter `inatPhotos` aux inputs
- ✏️ `src/components/community/exploration/impact/ScoreCriterionDrawer.tsx` — nouvelle décomposition Volume/Diversité (locales vs iNat)
- ✏️ `src/lib/sentinelleIndex.ts` (optionnel) — accepter un champ optionnel `inatObservations` pour le futur, sans changer la formule

## Validation post-fix (Laurence Karki, DEVIAT)


| Métrique           | Avant             | Cible                                 |
| ------------------ | ----------------- | ------------------------------------- |
| Diversité          | 1/10 (2 espèces)  | ~3/10 (5 espèces si non curées) ou 5+ |
| Volume             | 2/10 (2 contribs) | ~3-4/10 (7 contribs)                  |
| Variété des gestes | 9/15 (3 piliers)  | 12/15 (4 piliers — photo activé)      |
| TOTAL              | 28/100            | ~35-40/100                            |


## Hors scope (à confirmer)

- **Backfill rétroactif de `marcheur_observations**` : la fusion runtime (Volet 1) est suffisante côté UI. Synchroniser la table reste utile pour la cohérence inter-vues (Mon espace, exports, etc.) mais peut être traité en deuxième temps via un cron qui rejoue le backfill iNat sur tous les couples (marcheur, marche) avec snapshots.
- **Curation automatique des espèces iNat** (bio/aux/EEE) : reste manuelle par les Ambassadeurs.

## Questions

1. **Stratégie de fusion** : on fusionne en runtime dans `useExplorationParticipants` (rapide, pas de migration) **OU** on backfill `marcheur_observations` depuis les snapshots via une edge function planifiée (plus lourd mais source unique en BDD) ? *(recommandé : runtime maintenant + backfill batch en V2)*
2. **Pilier "photo" via iNat** : créer un 6ᵉ pilier "observation citoyenne" pour rester fidèle à l'esprit "geste local" ? 