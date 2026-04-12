

## Diagnostic

The public page `/partage/:id?type=texte` fails because the `get_public_shared_contribution` RPC function crashes with a SQL error:

```
ERROR: column m.nom does not exist
```

The function references `m.nom` and `m.lieu` on the `marches` table, but the actual columns are `nom_marche` and `ville`.

The same bug exists in `get_public_marcheur_carnet` (references `m.nom` instead of `m.nom_marche`).

## Fix — Single DB Migration

Replace both RPC functions with corrected column references:

**`get_public_shared_contribution`** — 2 fixes in the `marche` subquery:
- `m.nom` → `m.nom_marche`
- `m.lieu` → `m.ville`

**`get_public_marcheur_carnet`** — 2 fixes (textes + medias subqueries):
- `m.nom` → `m.nom_marche` (both occurrences)

### Migration SQL (summary)

```sql
CREATE OR REPLACE FUNCTION public.get_public_shared_contribution(...)
-- Fix: 'nom', m.nom_marche  and  'lieu', m.ville

CREATE OR REPLACE FUNCTION public.get_public_marcheur_carnet(...)
-- Fix: 'marche_nom', m.nom_marche  (×2)
```

No frontend changes needed — the page code (`PartagePublic.tsx`) is correct. The error is purely in the database functions.

### Files impacted

| Item | Action |
|------|--------|
| SQL migration | Fix column names in both RPC functions |

