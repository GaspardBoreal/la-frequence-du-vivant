

# Fix: Edge Function `suggest-citations` crash sur `getClaims`

## Cause racine

`auth-helper.ts` utilise `supabase.auth.getClaims(token)` qui n'existe pas dans `@supabase/supabase-js@2`. L'appel leve une erreur, la fonction renvoie 401 "Invalid token" sans rien logger.

## Correction

Dans `supabase/functions/_shared/auth-helper.ts`, remplacer `getClaims` par `auth.getUser()` :

```typescript
// Avant (lignes 41-42)
const token = authHeader.replace('Bearer ', '');
const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);

// Après
const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
```

Adapter les references en aval :
- `claimsError` → `authError`
- `claimsData.claims.sub` → `authUser.id`
- `claimsData.claims.email` → `authUser.email`

## Impact

Ce fichier est partage par toutes les edge functions admin. La correction repare `suggest-citations` et securise les autres fonctions utilisant `validateAuth()`.

## Fichier impacte

| Fichier | Action |
|---|---|
| `supabase/functions/_shared/auth-helper.ts` | Remplacer `getClaims` par `getUser()` |

