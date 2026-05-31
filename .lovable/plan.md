## Diagnostic confirmé

L'utilisatrice "Elsa B / @elsab12" s'est renommée sur iNat en "marie Claude mazaud / @marie_claude25846". Les snapshots contiennent déjà son ID iNat numérique immuable : **`observerId = 10613937`** (capturé par le backfill et l'ingestion). Le compte d'Elsa B en base ne stocke que l'ancien username — pas l'ID numérique → le filtre ne fait jamais le lien.

## Solution C — pérennise contre tous les renommages iNat futurs

### Migration (déjà appliquée ✅)
- `external_id = '10613937'` sur le compte iNat d'Elsa B.
- Index unique partiel `(profile_id, network, external_id)` + index de lookup `(network, external_id)`.

### Code à écrire (à faire en build mode)

**1. `src/utils/citizenIdentity.ts`** — Resolver hiérarchique :
- Clé canonique = `inat:<observerId>` (top), puis `observerLogin`, puis alias normalisé.
- Pass A : indexe alias/login → `inat:<id>` à partir de toute attribution exposant un `observerId`.
- Pass B : `resolve()` retourne la clé canonique réconciliée.
- Effet : "marie Claude mazaud" (legacy) et "elsab12" (futur) tombent tous sur `inat:10613937`.

**2. `src/hooks/useMarcheurAliases.ts`** — `useMarcheurAliases` + `useMarcheursAliasesMap` lisent aussi `external_id` depuis `community_profile_science_accounts`, et ajoutent `inat:<external_id>` au set d'alias. Le filtre `useExplorationCitizenContributors` exclura alors toute attribution canonicalisée sur cet ID.

**3. `src/hooks/useScienceAccounts.ts`** + **`src/components/admin/community/ScienceAccountsEditor.tsx`** :
- `useUpsertScienceAccount` accepte `external_id` et `display_name`.
- À la sauvegarde d'un compte iNat, appel automatique en arrière-plan à `resolve-inaturalist-user` (mode login) → récupère `id` + `name` → patch la row.

**4. `supabase/functions/resolve-inaturalist-user/index.ts`** :
- Accepte un nouveau mode `{ login: "elsab12" }` → appelle `https://api.inaturalist.org/v1/users/<login>`.
- Le payload renvoyé inclut désormais `id` (numérique).

**5. Mise à jour de la mémoire** `mem://technical/community/identity-matching-logic` pour documenter la hiérarchie `observerId > observerLogin > alias`.

### Hors scope
- Pas besoin de toucher l'ingestion (`biodiversity-data`) ni le backfill (`backfill-snapshot-observer-login`) : tous deux capturent déjà `observerId`.
- Pas besoin de re-générer les `marcheur_observations` : l'attribution est déjà en place via le trigger existant.

### Résultat attendu
- Le bloc "+3 contributeurs citoyens iNaturalist" perd l'entrée `marie Claude mazaud · @elsab12 · 6 espèces`.
- Les 6 espèces restent comptées dans Elsa B (déjà le cas via marcheur_observations).
- Tout renommage futur d'un marcheur sur iNat n'a plus d'impact sur l'app.

**Passe en build mode pour que j'applique les 5 changements de code.**
