## Diagnostic (analyse pro)

### Ce que tu vois
Dans le filtre "iNaturalist (5)" de la fiche événement, **un seul compte iNat** (`les-marches-du-vivant`) apparaît en **deux entités distinctes** :
- `Les marches du Vivant` (4 obs)
- `Les Marches du Vivant` (1 obs) — majuscule à "Marches"

### Cause racine (2 bugs cumulés)

**Bug #1 — On stocke un identifiant mutable**
Dans `supabase/functions/biodiversity-data/index.ts` (ligne 319), le pipeline iNat fait :
```ts
observerName: item.user?.name || item.user?.login || 'Anonyme'
```
On stocke `user.name` (= **display name**, modifiable à volonté par l'utilisateur depuis son profil iNat), au lieu de `user.login` (= **slug d'URL, immuable**, ici `les-marches-du-vivant`).

Conséquence : si le display name change ne serait-ce que d'une majuscule entre deux syncs (ou si tu le corriges plus tard), chaque variante crée un "fantôme" dans nos snapshots déjà figés. C'est exactement ce qui s'est passé sur tes 5 observations test.

**Bug #2 — Le filtre UI dédoublonne sur la chaîne brute**
Dans `src/components/biodiversity/SpeciesExplorer.tsx` (ligne 252), la clé du Map est `(attr.observerName || '').trim()` — donc sensible à la casse, aux accents, aux espaces. Pourtant `normalizeAlias()` existe déjà et est utilisé partout ailleurs (`useExplorationCitizenContributors`, `useMarcheurAliases`, etc.) pour précisément éviter ça.

Résultat : `"Les marches du Vivant"` ≠ `"Les Marches du Vivant"` au sens du Map, alors qu'ils devraient être fusionnés.

---

## Solution pro (sécurisée pour ce compte ET les prochains)

Architecture en 3 couches : on remonte l'identité immuable, on dédoublonne partout, on migre l'existant.

### 1. Backend — capturer l'identité iNat canonique

**Fichier** : `supabase/functions/biodiversity-data/index.ts` (~ligne 319, attribution iNat)

Enrichir l'attribution avec **3 champs stables** (au lieu d'un seul `observerName` ambigu) :
```ts
{
  source: 'inaturalist',
  observerLogin: item.user?.login || null,     // ← NOUVEAU : slug immuable (clé canonique)
  observerId: item.user?.id ?? null,           // ← NOUVEAU : ID numérique iNat (encore plus stable)
  observerName: item.user?.name || item.user?.login || 'Anonyme', // display, gardé pour affichage
  observerProfileUrl: item.user?.login
    ? `https://www.inaturalist.org/people/${item.user.login}` : null,
  originalUrl: ...,
}
```
→ On ne touche pas aux snapshots existants (rétro-compat), on ajoute juste des champs JSON optionnels.

### 2. Frontend — dédoublonner sur l'identité canonique

**Règle universelle** : la clé de groupement d'un contributeur iNat = `observerLogin` (si présent) sinon `normalizeAlias(observerName)` en fallback pour les snapshots historiques.

Helper centralisé `src/utils/citizenIdentity.ts` :
```ts
export const inatIdentityKey = (a: Attribution) =>
  a.observerLogin?.toLowerCase().trim() || normalizeAlias(a.observerName || '');

export const inatDisplayName = (a: Attribution) =>
  a.observerName?.trim() || a.observerLogin || 'Anonyme';
```

**Fichiers à corriger** (tous utilisent aujourd'hui `observerName` brut comme clé) :
- `src/components/biodiversity/SpeciesExplorer.tsx` (le bug que tu vois — Map ligne 252 + Map `uniqueMarcheurs` ligne 271)
- `src/hooks/useExplorationCitizenContributors.ts` (déjà OK via `normalizeAlias`, à upgrader vers `inatIdentityKey`)
- `src/hooks/useMarcheurInatProfile.ts` (matching alias → URL)
- `src/hooks/useSpeciesObservers.ts`, `useExplorationCitizenContributors`, `useSpeciesMarcheurPhotos` : passer au key canonique
- Tous les autres fichiers de la liste `rg observerName` (~15 fichiers) : audit ciblé, on remplace les `.trim().toLowerCase()` ad-hoc par le helper

### 3. Migration — réconcilier les snapshots existants

Edge function ponctuelle `backfill-snapshot-observer-login` (one-shot, idempotente) :
1. Lit tous les snapshots avec `source='inaturalist'` mais sans `observerLogin`.
2. Pour chaque `originalUrl` iNat (`/observations/{id}`), appelle `https://api.inaturalist.org/v1/observations/{id}` (batch par 30 IDs, public, pas de JWT requis), récupère `user.login` + `user.id`.
3. Patche les attributions du `species_data` JSON in-place.
4. Cache en mémoire pour éviter de re-fetcher 2× le même obs.

Pour tes 5 obs test, ça unifie immédiatement les deux "Les marches du Vivant" en un seul contributeur `les-marches-du-vivant`.

### 4. Bonus sécurité (prochains comptes)

- **`useMarcheurAliases`** : ajouter automatiquement le `login` iNat (pas que le display name) quand `community_profile_science_accounts.network='inaturalist'` est lié. Aujourd'hui ça marche déjà parce que tu colles `les-marches-du-vivant` dans le champ username, mais on documente la convention : **username iNat = login slug, pas display name**.
- **`resolve-inaturalist-user` edge function** : déjà existante, on l'utilise pour valider qu'un username saisi correspond bien à un login iNat existant (UI : check vert dans le formulaire d'ajout de compte science).
- **Memory `mem://technical/community/identity-matching-logic`** : mise à jour pour graver la règle "iNat identity = `user.login`, jamais `user.name`".

---

## Section technique condensée

| Étape | Fichier | Type |
|---|---|---|
| 1 | `supabase/functions/biodiversity-data/index.ts` | enrich `observerLogin` + `observerId` |
| 2 | `src/utils/citizenIdentity.ts` | helper `inatIdentityKey` |
| 2 | `src/components/biodiversity/SpeciesExplorer.tsx` | switch Map keys |
| 2 | ~6 hooks (`useExploration*`, `useSpecies*`) | switch Map keys |
| 3 | `supabase/functions/backfill-snapshot-observer-login/index.ts` | one-shot backfill |
| 4 | `src/hooks/useMarcheurAliases.ts` | doc + validation login |
| 4 | `mem://technical/community/identity-matching-logic` | update règle |

### Hors-scope (non touché)
- DB schéma : aucune migration, on enrichit du JSON existant
- Auth / RLS : aucune
- Pipeline OAuth iNat (les 4 secrets) : indépendant, ne bloque pas ce fix

### Test de validation
Après déploiement + backfill : sur la fiche événement `f6095e8d-…`, le filtre iNaturalist doit afficher **`les-marches-du-vivant (5)`** en une seule ligne, et plus jamais se dédoubler même si tu renommes le compte iNat demain.
