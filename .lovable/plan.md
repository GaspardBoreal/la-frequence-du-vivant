# Fix "Échec enregistrement" sur les petits rayons (15 m / 25 m)

## Cause

Deux contraintes CHECK dans la base bloquent toute valeur < 50 m :

- `marches.marches_radius_m_range` → `radius_m >= 50 AND radius_m <= 50000`
- `explorations.explorations_default_radius_m_range` → `default_radius_m >= 50 AND default_radius_m <= 50000`

Quand l'UI envoie `radius_m = 15` ou `25`, Postgres rejette l'UPDATE → `toast.error('Échec enregistrement')`. Ce n'est pas un problème de RLS.

## Fix

Migration SQL alignée sur le nouveau plancher applicatif (`RADIUS_BOUNDS_M.min = 15`) :

```sql
ALTER TABLE public.marches
  DROP CONSTRAINT marches_radius_m_range,
  ADD  CONSTRAINT marches_radius_m_range
       CHECK (radius_m IS NULL OR (radius_m >= 15 AND radius_m <= 50000));

ALTER TABLE public.explorations
  DROP CONSTRAINT explorations_default_radius_m_range,
  ADD  CONSTRAINT explorations_default_radius_m_range
       CHECK (default_radius_m IS NULL OR (default_radius_m >= 15 AND default_radius_m <= 50000));
```

Aucun code applicatif à modifier (le `clamp` côté front utilise déjà `RADIUS_BOUNDS_M.min = 15`).

## Détails techniques

- Pas de migration de données : aucune ligne existante n'est < 50, donc les nouvelles contraintes seront validées immédiatement.
- Borne haute (50 000 m) inchangée.
- Tables auth/storage non touchées.
