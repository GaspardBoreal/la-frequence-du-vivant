## Problème

Sur `/m/chateau-boutinet-…`, la page affiche **« Page introuvable »**. La RPC `get_public_event(_slug)` renvoie NULL car elle plante silencieusement à l'exécution :

```
ERROR: 42P01: relation "public.marche_event_organisateurs" does not exist
```

## Cause

La dernière migration `20260713070025_*.sql` (créée pour exposer `category` au front Vignoble) a introduit un sous-select qui joint une table inventée `public.marche_event_organisateurs` :

```sql
FROM public.marche_event_organisateurs meo
JOIN public.organisateurs o ON o.id = meo.organisateur_id
```

Cette table n'existe pas. Le lien organisateur ↔ marche_events n'existe pas non plus : seule la table legacy `marches` porte `organisateur_id`, pas `marche_events`. L'ancienne version de la RPC référençait `e.organisateur_id` sur `marche_events`, colonne également absente aujourd'hui — donc l'organisateur n'a jamais été réellement remonté pour les marches publiques `marche_events`, et le champ était toujours NULL côté front.

Résultat : dès que le front appelle `get_public_event` pour Château Boutinet, PostgreSQL lève l'erreur, `_result` reste NULL, `PublicEventPage` affiche « Page introuvable ».

## Correctif

Une seule migration SQL, `CREATE OR REPLACE FUNCTION public.get_public_event(_slug text)`, qui :

1. Conserve tous les champs actuels **y compris `category`** (indispensable pour déclencher `VignobleImmersion`).
2. Retire le sous-select cassé et renvoie `'organisateur', NULL` (comportement effectif déjà observé côté front, aucune régression UI).
3. Ne touche ni aux GRANTs (déjà en place) ni aux autres RPC (`get_public_event_stats`, `_biodiversity`, `_marcheurs`, …).

Aucun changement front ni type nécessaire : `PublicEvent.organisateur` est déjà typé optionnel/nullable.

## Vérification

Après migration, `SELECT public.get_public_event('chateau-boutinet-le-vignoble-vivant-2026-09-26')` doit renvoyer un JSON non nul avec `"category": "vignoble"`, et la page `/m/chateau-boutinet-…` doit charger l'immersion Terroir Noble.
