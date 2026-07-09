## Problème

Le RPC `get_community_usage_dashboard` échoue systématiquement avec :
`ERROR: type "app_role" does not exist` (dans `NOT public.has_role(auth.uid(), 'admin'::app_role)`).

Ce projet n'utilise pas le pattern `has_role/app_role` documenté — l'admin est vérifié via `public.is_admin_user()` (autres RPC admin du projet). L'erreur est levée avant tout calcul, le hook la remonte, et `UsageDashboard` affiche « Aucune donnée d'usage disponible ».

## Correctif

**Migration SQL** — remplacer le garde d'entrée du RPC :

```sql
-- avant
IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
  RAISE EXCEPTION 'forbidden';
END IF;

-- après
IF NOT public.is_admin_user() THEN
  RAISE EXCEPTION 'forbidden';
END IF;
```

Réémettre la fonction complète via `CREATE OR REPLACE FUNCTION` (mêmes signatures, mêmes `GRANT EXECUTE TO authenticated`, `SECURITY DEFINER`, `SET search_path = public`).

## Vérification

1. `SELECT get_community_usage_dashboard(now() - interval '90 days', now())` en tant qu'admin → renvoie le JSON attendu.
2. Rechargement de `/admin/community` onglet « Usages » → KPIs, Personas, Funnel, Heatmap, Radar et Villes s'affichent.
3. Bandeau d'erreur : si le JSON est vide (0 log sur la période), afficher « Aucun signal sur cette plage — élargir la période » plutôt que le message générique (petit ajout UX dans `UsageDashboard.tsx`).

## Hors périmètre

Aucun changement sur les composants de visualisation, le hook, ni la structure du payload. Seulement le garde admin du RPC + un message UX plus précis en cas de payload vide.
