# Correction de l'erreur `function public.has_role(uuid, unknown) does not exist`

## Diagnostic

Le projet n'utilise pas le pattern standard `public.has_role(uuid, app_role)` + enum `app_role`. À la place, il dispose de `public.check_is_admin_user(uuid)` (et `public.is_admin_user()`).

Mes deux dernières migrations (`20260521191804` et `20260521193148`) ont introduit des appels `public.has_role(_admin_id, 'admin')` qui n'existent pas → toute action admin (toggle public, lecture du rayonnement) plante.

## Fonctions impactées
1. `public.toggle_event_public(uuid, boolean)`
2. `public.get_event_rayonnement(uuid)` (redéfinie 2 fois)

## Correctif

Une nouvelle migration recréera ces deux fonctions à l'identique en remplaçant :

```sql
IF NOT public.has_role(_admin_id, 'admin') THEN
```

par :

```sql
IF NOT public.check_is_admin_user(_admin_id) THEN
```

Aucun changement de schéma, aucune perte de données, aucun impact sur le frontend. Le bouton "Rendre public" et le panneau de métriques refonctionneront immédiatement.
