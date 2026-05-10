## Diagnostic

**Cause racine confirmée par requête SQL :**

Dans `biodiversity_snapshots.species_data[].attributions[]`, les observations iNaturalist sont stockées avec :
```
observerName = "laurencekarki"   (login iNat)
source       = "inaturalist"
```

Mais l'onglet **Contributions** (et le compteur de contributions) fait le matching ainsi :
```ts
fullNameNorm = normalize("Laurence" + " " + "Karki")  // "laurence karki"
match = observerNorm.includes(fullNameNorm)
     || fullNameNorm.includes(observerNorm)
// "laurencekarki".includes("laurence karki") → false
// "laurence karki".includes("laurencekarki") → false
```

→ **Aucun match**, donc `Aucune espèce identifiée`.

À l'inverse, l'onglet **Synthèse → Taxons observés** propose un sélecteur d'observateur basé sur les `observerName` bruts présents dans les snapshots (donc `laurencekarki`), ce qui fonctionne directement. D'où l'incohérence (0 vs 6 / 0 vs 5).

Le même bug existe dans 3 endroits :
- `MarcheursTab.tsx` `ContributionsSubTab` (l. 412-472)
- `MarcheursTab.tsx` `useWalkerContributionsCount` (l. 972-1009)
- `impact/CitizenPlatformsCard.tsx` (l. 84-90)

## Solution proposée — robuste pour tous les marcheurs iNat

**Principe :** étendre l'identité d'un marcheur à un ensemble d'**alias** (nom complet + tous ses logins de comptes science), puis matcher si l'`observerName` du snapshot **égale strictement** l'un des alias normalisés (et non plus via `includes` qui est trop permissif et casse sur les logins concaténés).

### 1. Hook partagé `useMarcheurAliases(userId, prenom, nom)`

Nouveau hook qui retourne un `Set<string>` d'alias normalisés :
- `normalize(`${prenom} ${nom}`)` → `"laurence karki"`
- `normalize(`${prenom}${nom}`)` → `"laurencekarki"` (variante concaténée, fallback)
- Tous les `username` issus de `community_profile_science_accounts` du marcheur (réseaux `inaturalist`, `gbif`, `observation_org`, etc.), normalisés.

Une seule requête, mise en cache (5 min), réutilisable dans les 3 endroits.

### 2. Nouvelle logique de matching

Remplacer le `includes` bidirectionnel par une **égalité stricte** sur le `Set` d'alias :
```ts
const observerNorm = normalize(attr.observerName);
if (aliases.has(observerNorm)) { ... }
```

Cela règle aussi les faux positifs (ex. un observateur "Laurence" matchait "Laurence Karki" par inclusion).

### 3. Application aux 3 endroits

- `ContributionsSubTab` → injecter `aliases`, remplacer le test
- `useWalkerContributionsCount` → idem (le compteur "Contributions" sur la pastille du marcheur sera juste)
- `CitizenPlatformsCard` → idem (les KPI iNat / GBIF du marcheur)

### 4. Pré-requis backfill (déjà en place)

Pour que les nouvelles obs iNat apparaissent côté snapshots (et pas seulement dans `marcheur_observations`) :
- Le snapshot biodiversité d'une marche est régénéré quand on visite l'onglet Vivant (logique existante `snapshot-sync-on-view-logic`).
- Le nouvel ajout d'un compte iNat ou d'une participation déclenche déjà `backfill-marcheur-inaturalist` (table `marcheur_observations`) **et** doit invalider le snapshot pour forcer une régénération avec les nouvelles attributions.

→ Ajouter dans le trigger `handle_science_account_backfill` et `handle_participation_backfill` un appel asynchrone à `sync-biodiversity-snapshot` pour chaque marche concernée (refresh forcé). C'est la pièce manquante pour que la chaîne soit complète : iNat → marcheur_observations → snapshot.species_data.attributions → UI Contributions.

### 5. Validation

Après déploiement :
- Recharger l'onglet Vivant des 2 marches DEVIAT pour régénérer les snapshots
- Vérifier que la fiche **Laurence Karki → Contributions** affiche bien 6 espèces (DEVIAT/Jardin) et 5 (Marcher sur un sol qui respire)
- Vérifier que la pastille "Observations" du marcheur affiche le bon compteur

## Détails techniques

**Fichiers modifiés :**
- `src/hooks/useMarcheurAliases.ts` (nouveau)
- `src/lib/observerMatching.ts` (nouveau, fonction `matchesAlias` + `normalize` partagés)
- `src/components/community/exploration/MarcheursTab.tsx` (2 zones)
- `src/components/community/exploration/impact/CitizenPlatformsCard.tsx`
- `supabase/migrations/...` : étendre les triggers iNat backfill pour forcer aussi un refresh du snapshot biodiversité de chaque marche concernée (via `pg_net` → fonction `sync-biodiversity-snapshot`).

**Mémoire à mettre à jour :**
- Ajouter une note dans `mem://technical/community/identity-matching-logic` : matching par égalité sur set d'alias (nom + logins science), jamais par `includes`.
