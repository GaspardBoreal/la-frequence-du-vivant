## Diagnostic

Sur `/propriete/maison-sous-blossac`, la carte « Dernière observation » affiche **10/05/2026** alors que la dernière obs réelle sur l'événement « POITIERS Maison Sous Blossac » est le **14/07/2026**.

Cause : dans la RPC `public.get_propriete_biodiversity`, la valeur retournée `lastEventDate` = `max(marche_events.date_marche)` — c'est la **date de l'événement**, pas la **date de la dernière observation**. Le label côté UI (`TabObserve.tsx`) est trompeur : il utilise ce champ pour dire « Dernière observation ».

La RPC parcourt déjà **tous les événements liés** à la propriété (via `linked_events` → `linked_marches`), donc le périmètre est bon ; seul le calcul de date est faux.

## Correctif

### 1. RPC `public.get_propriete_biodiversity`
Ajouter un vrai calcul `lastObservationDate` en fusionnant les 3 sources sur l'ensemble des `linked_marches` :

- `max(marcheur_observations.observation_date)` sur `marche_id ∈ linked_marches` (filtrage rayon Haversine, comme les espèces).
- `max((sp->>'observedOn')::timestamptz)` sur les entrées `snap_rows` (déjà filtrées rayon).
- `max((att->>'observedOn')::timestamptz)` sur les attributions iNat de `snap_rows`.

Retourner `lastObservationDate` (nouveau champ) en plus de `lastEventDate` (conservé pour rétro-compat / autres usages éventuels : nudge « inactif > 12 mois »).

### 2. Hook `usePropertyBiodiversity.ts`
Exposer `lastObservationDate: string | null` dans `PropertyBiodiversity`. Garder `lastEventDate` pour le nudge d'inactivité (qui mesure la dynamique événementielle, pas les observations).

### 3. UI `TabObserve.tsx`
La carte « Dernière observation » utilise `lastObservationDate` (fallback sur `lastEventDate` si null pour ne jamais afficher « — » quand un event existe).

## Hors scope
- Le nudge d'inactivité (`NudgeMarcheBanner`) continue de se baser sur `lastEventDate` (sémantique « pas de marche depuis X mois »).
- Aucun changement UI ailleurs, aucun changement de RLS.

## Vérification
Après migration : sur Maison sous Blossac, la carte doit afficher **14/07/2026** (max des `observation_date` iNat + marcheurs sur tous les events liés).
