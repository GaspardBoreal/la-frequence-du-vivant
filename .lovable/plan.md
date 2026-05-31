# Réconciliation robuste marcheurs ↔ contributeurs iNaturalist

## Problème

Les snapshots iNat exposent désormais `observerId` (ID numérique). Le resolver canonicalise donc chaque attribution sous `inat:<id>`. Mais les `community_profile_science_accounts` iNat existants ont presque tous `external_id = NULL` (jamais résolus). Résultat : le set d'alias d'un marcheur ne contient que le login (`les-marches-du-vivant`) — il ne matche pas la clé canonique `inat:<id>`. Le marcheur apparaît alors en doublon comme contributeur citoyen.

Cas observé : « Les marches du Vivant » (marcheur LD) + « Les Marches du Vivant @les-marches-du-vivant » (contributeur citoyen, 70 espèces). Elsa B avait le même problème, résolu manuellement.

## Solution — 2 verrous complémentaires

### 1. Fix immédiat côté lecture (defense-in-depth, sans BDD)

Modifier `src/hooks/useExplorationCitizenContributors.ts` : au lieu de tester uniquement `knownAliases.has(canonical)`, tester **toutes les formes possibles** d'identité du contributeur :

- `inat:<observerId>` (canonique)
- `observerLogin` normalisé
- `normalizeAlias(observerName)`

Si **au moins une** est dans `knownAliases`, on exclut. Cela rattrape immédiatement tout marcheur dont le science account a juste un `username` (login) renseigné, même sans `external_id`. Zéro migration nécessaire pour que ça marche.

### 2. Backfill systémique des `external_id` manquants

Edge function one-shot `backfill-inat-external-ids` :

- SELECT tous les `community_profile_science_accounts` où `network='inaturalist' AND external_id IS NULL`
- Pour chacun, appeler l'API iNat `GET /users/{login}` (déjà câblée dans `resolve-inaturalist-user`)
- UPDATE `external_id` + `display_name` canonique
- Throttle 1 req/s pour respecter rate-limit iNat

Déclenchée une fois manuellement depuis Admin → Outils (ou via bouton temporaire). Idempotent : on peut la relancer.

### 3. Garde-fou pour le futur

`useUpsertScienceAccount` appelle déjà `resolve-inaturalist-user` en fire-and-forget depuis le précédent fix (Elsa B). On ajoute juste un log côté edge function si la résolution échoue, pour diagnostiquer plus tard. Aucune autre modif nécessaire — les nouveaux comptes sont déjà OK.

## Fichiers touchés

```text
src/hooks/useExplorationCitizenContributors.ts   # multi-form alias match
supabase/functions/backfill-inat-external-ids/   # one-shot backfill (nouveau)
  index.ts
supabase/config.toml                              # déclaration fonction
src/pages/AdminOutilsHub.tsx                     # bouton "Backfill iNat IDs" (optionnel)
mem://technical/community/identity-matching-logic # MAJ : multi-form fallback
```

## Détails techniques

**Multi-form match (cœur du fix #1) :**

```ts
const matchesKnownMarcheur = (a, knownAliases): boolean => {
  if (!knownAliases) return false;
  const id = a?.observerId;
  if (id != null && knownAliases.has(`inat:${id}`)) return true;
  const login = (a?.observerLogin || '').toLowerCase().trim();
  if (login && knownAliases.has(login)) return true;
  const alias = normalizeAlias(a?.observerName || '');
  if (alias && knownAliases.has(alias)) return true;
  return false;
};
```

Appliqué juste avant `byKey.set(...)`. Plus de `knownAliases.has(canonical)` rigide.

**Backfill (fix #2) :** réutilise le code de `resolve-inaturalist-user` (mode `{ login }`) en boucle. Aucune nouvelle dépendance externe.

## Hors scope

- Pas de regen des snapshots (les `observerId` y sont déjà).
- Pas de modif de la table : pas besoin, le multi-form match couvre les comptes sans `external_id` même si le backfill échoue pour certains.
- Pas de changement UX visible (le marcheur disparaît juste de la liste citoyens).

## Validation post-déploiement

1. Recharger l'onglet Marcheurs sur l'exploration ROQUE GAGEAC.
2. Vérifier que « Les Marches du Vivant @les-marches-du-vivant » n'apparaît plus comme contributeur citoyen.
3. Vérifier que le compteur « +N contributeurs citoyens » passe de 3 à 2.
4. Vérifier que LD reste avec ses 72 fréquences (rien ne doit bouger côté marcheur).
