
## Diagnostic

Confirmé en base pour cette exploration (5 marches, 11 snapshots) :

| Marche | Snapshots `with_login` | Snapshots `without_login` |
|---|---|---|
| `4095a154` | 3 (359 attrs) | 0 |
| `f94e5c2f` | 2 (232 attrs) | 0 |
| `bf50566d` | 3 attrs récents | **342 attrs legacy** |
| `8b96ea79` | 3 attrs récents | **202 attrs legacy** |
| `67890ed0` | 3 attrs récents | **135 attrs legacy** |

→ Le backfill précédent n'a touché que 2 marches (scope `marcheId`). Les 3 autres marches restent peuplées d'attributions iNat sans `observerLogin`.

**Conséquence visible** : pour « Gaspard Boréal », on a en base :
- 529 attributions avec `observerLogin = "gaspardboreal"` → clé canonique = `gaspardboreal`
- 585 attributions sans login (legacy) → fallback `normalizeAlias("Gaspard Boréal")` ≈ `gaspard boreal`

Les deux clés ne correspondent pas → **2 entrées dans le filtre** au lieu d'1. Idem pour `les-marches-du-vivant` vs `Les Marches du Vivant`.

## Cause racine — deux bugs cumulés

1. **Couverture incomplète** : le backfill n'a tourné que sur 2 marches. Les snapshots historiques des autres marches n'ont jamais reçu d'`observerLogin`.
2. **Robustesse manquante du fallback** : `citizenIdentityKey()` retourne soit le login soit `normalizeAlias(name)`, mais ces deux clés ne sont **pas réconciliées entre elles**. Donc même après un backfill partiel, deux attributions du même observateur (l'une enrichie, l'autre pas) restent séparées.

## Plan de correction

### 1. Rendre `citizenIdentityKey` robuste (defense-in-depth)

Le fallback ne doit plus produire une clé incompatible avec le login. On introduit une **résolution en 2 passes** au niveau de chaque agrégateur :

- **Pass A** — scanner toutes les attributions et construire un **index local** `normalizeAlias(name) → observerLogin` à partir de toute attribution qui possède **les deux** champs.
- **Pass B** — re-résoudre chaque attribution : si elle n'a pas de `observerLogin`, chercher `normalizeAlias(name)` dans l'index ; si trouvé, utiliser le login comme clé canonique. Sinon, garder `normalizeAlias(name)`.

Ainsi, dès qu'**au moins une** attribution d'un observateur a été enrichie (par l'ingestion ou un backfill partiel), **toutes** les autres attributions du même observateur sont automatiquement reclassées sous la même identité — sans attendre un backfill complet.

Fichiers impactés :
- `src/utils/citizenIdentity.ts` — nouvelle fonction `buildCitizenIdentityResolver(attributions[])` qui retourne `(attr) => key`.
- `src/components/biodiversity/SpeciesExplorer.tsx` — section `contributorsBySource` et `uniqueMarcheurs` utilisent le resolver.
- `src/hooks/useExplorationCitizenContributors.ts` — pass A globale avant l'agrégation.
- `src/hooks/useSpeciesObservers.ts` — même traitement.
- `src/hooks/useSpeciesMarcheurPhotos.ts` et tout autre hook lisant `attributions` pour dédupliquer (à auditer rapidement avec `rg "observerName" src/hooks`).

### 2. Backfill global (vrai nettoyage des données)

Le backfill existant doit être relancé **sans scope `marcheId`** pour traiter tous les snapshots historiques.

- Étendre légèrement le bouton « Réconcilier identités iNat » dans `/admin/community` avec un retour de stats clair (`scanned / updated / patched / fetched`), pour que tu voies la progression.
- Option : ajouter un mode `dryRun` accessible via un sous-bouton « Simuler » pour estimer l'ampleur avant d'écrire.

Une fois exécuté, les ~679 attributions legacy de cette exploration (bf50566d + 8b96ea79 + 67890ed0) seront enrichies en place et les fallbacks ne seront plus nécessaires pour ces snapshots — mais le filet de sécurité (point 1) reste utile pour les obs iNat supprimées/privées (qui ne reviendront jamais avec un login).

### 3. Garde-fou ingestion (futur)

Vérifier dans `supabase/functions/biodiversity-data/index.ts` que **chaque** branche écrivant une attribution iNat capture bien `user.login` + `user.id` (pas seulement la branche principale). Toute attribution iNat sans login devient une anomalie loguée côté edge.

## Effet attendu

Après ces 3 actions :
- Le dropdown affichera **1 ligne par observateur réel**, même si la moitié de ses obs n'a pas été backfillée.
- Le compteur `iNaturalist (6)` deviendra `iNaturalist (3 ou 4)` (Gaspard, laurencekarki, Chantal, LMDV).
- Les futures fusions name↔login se feront automatiquement à l'agrégation, sans dépendance au cron de backfill.

## Détails techniques

```text
ATTRIBUTIONS (raw)
  ├─ {name:"Gaspard Boréal", login:"gaspardboreal"}   ←┐
  ├─ {name:"Gaspard Boréal", login:null}                │
  │                                                     │
  └─ Pass A ─→ index: { normalizeAlias("Gaspard Boréal") : "gaspardboreal" }
                                                        │
  Pass B ─→ key("gaspardboreal") pour les DEUX  ────────┘
```

Pas de migration SQL. Pas de breaking change d'API. Tout est rétro-compatible.
