## Constats

Sur la marche DEVIAT, `aurelien.dript@gmail.com` apparaît **deux fois** dans l'onglet Marcheurs :

- une fois comme « Marcheur » (carte éditoriale `exploration_marcheurs` historique, liée à son ancien compte `ced8277b…`),
- une fois comme « Marcheur en devenir » (nouvelle carte éditoriale auto-créée `e7c8652c…`, liée au nouveau `user_id 3ad53b2b…`).

Pourtant en base : **0 participation**, juste 2 `event_invited_readers` avec `invite_source='auto_new_signup'`. Le bloc amber « Invités en attente » existe déjà mais ne s'affiche pas car la nouvelle ligne crew (auto-créée) pousse l'utilisateur dans la liste principale via `useExplorationParticipants`.

## Plan

### 1. Onglet Marcheurs : exclure strictement les invités du bloc principal

Dans `src/components/community/exploration/MarcheursTab.tsx` :

- Récupérer les `event_invited_readers` non promus (déjà fait via `pendingInvitees`) **avant** le calcul de `sortedMarcheurs`.
- Construire un `Set<userId>` des invités non promus **sans participation**.
- Filtrer `sortedMarcheurs` pour retirer toute carte dont le `userId` est dans ce set ET dont `totalContributions === 0` (aucune contribution réelle). Cela couvre les crew rows auto-créées au signup.
- Le bloc amber « Invités en attente » devient ainsi le seul endroit où ils apparaissent, peu importe la présence d'une crew row fantôme.

Aucun changement de logique métier ailleurs ; uniquement de la présentation.

### 2. Maintenance · enrichir « Activités orphelines » avec les invitations orphelines

Étendre `OrphanActivityLogsPanel` (ou créer un panneau frère `OrphanInvitedReadersPanel` rendu juste à côté dans `CommunityProfilesAdmin.tsx`) avec :

- Nouvelle RPC `admin_orphan_invited_readers()` : retourne les lignes `event_invited_readers` dont le `user_id` n'a **plus** de `community_profiles` ni d'entrée `auth.users` (compte test supprimé). Colonnes : `user_id`, `invitations_count`, `event_titles[]`, `last_invited_at`.
- Nouvelle RPC `admin_delete_orphan_invited_readers(p_user_ids uuid[])` : sécurité-définie, re-vérifie l'orphelinage puis supprime les `event_invited_readers` correspondants. Retourne `{ deleted_count, affected_users }`.
- UI : même pattern que le panneau existant (Checkbox / Sélection / AlertDialog de confirmation). Bouton « Actualiser » et libellé : « Invitations orphelines (comptes supprimés) ».
- Lien explicatif court : « Lignes `event_invited_readers` dont l'utilisateur n'existe plus. Utile pendant les tests d'onboarding. »

### 3. Bonus optionnel (non bloquant)

Permettre la sélection de **n'importe quel `user_id` invité** (même s'il a encore un profil) via un second onglet « Tester un compte » qui purge à la fois `event_invited_readers` + `community_profiles` + `auth.users` pour ce user. Utile pour repartir de zéro avec `aurelien.dript@gmail.com`. **À confirmer avec toi avant d'inclure** — c'est une fonction destructive qui touche `auth.users`.

## Détails techniques

```text
MarcheursTab.tsx
  pendingInviteesUserIds  : Set<string>
  filteredSortedMarcheurs : sortedMarcheurs.filter(m =>
    !(m.userId && pendingInviteesUserIds.has(m.userId) && m.totalContributions === 0)
  )
```

```sql
-- RPC orphan invited readers
CREATE OR REPLACE FUNCTION public.admin_orphan_invited_readers()
RETURNS TABLE(user_id uuid, invitations_count bigint, event_titles text[], last_invited_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT eir.user_id,
         count(*)::bigint,
         array_agg(DISTINCT me.title),
         max(eir.created_at)
  FROM event_invited_readers eir
  JOIN marche_events me ON me.id = eir.event_id
  WHERE NOT EXISTS (SELECT 1 FROM community_profiles cp WHERE cp.user_id = eir.user_id)
    AND NOT EXISTS (SELECT 1 FROM auth.users au WHERE au.id = eir.user_id)
  GROUP BY eir.user_id;
$$;

CREATE OR REPLACE FUNCTION public.admin_delete_orphan_invited_readers(p_user_ids uuid[])
RETURNS TABLE(deleted_count int, affected_users uuid[])
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_deleted int;
BEGIN
  IF NOT public.check_is_admin_user(auth.uid()) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  WITH del AS (
    DELETE FROM event_invited_readers
    WHERE user_id = ANY(p_user_ids)
      AND NOT EXISTS (SELECT 1 FROM community_profiles cp WHERE cp.user_id = event_invited_readers.user_id)
      AND NOT EXISTS (SELECT 1 FROM auth.users au WHERE au.id = event_invited_readers.user_id)
    RETURNING user_id
  )
  SELECT count(*)::int, array_agg(DISTINCT user_id) INTO v_deleted, affected_users FROM del;
  deleted_count := v_deleted;
  RETURN NEXT;
END;
$$;
```

## Question avant exécution

Veux-tu **aussi** que je supprime côté nettoyage la **crew row auto-créée** `e7c8652c…` pour l'exploration DEVIAT (et au passage tracer d'où elle vient) ? OUI