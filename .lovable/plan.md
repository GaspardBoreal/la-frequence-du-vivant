# Nettoyage des activités marcheurs orphelines

## Contexte

Tes tests d'onboarding ont laissé **46 activités** dans `marcheur_activity_logs` rattachées à **3 `user_id`** qui n'ont **plus de `community_profile`**. Aujourd'hui rien ne permet de les voir ni de les purger depuis l'admin.

## Objectif

Dans `/admin/community`, onglet **Activités**, ajouter une sous-section « Activités orphelines » qui :
1. liste les `user_id` orphelins avec compteur d'activités, types d'événements et dernière activité ;
2. permet de cocher un / plusieurs / tous ;
3. supprime après confirmation explicite — **avec un double garde-fou côté serveur** pour qu'on ne puisse jamais supprimer par erreur l'activité d'un marcheur réel.

## Architecture

### 1. Backend — RPC `admin_orphan_activity_logs` (SECURITY DEFINER, lecture)

Renvoie agrégat par `user_id` orphelin :
```
user_id, logs_count, first_seen_at, last_seen_at, event_types text[], sample_user_agent
```
Filtre : `NOT EXISTS (SELECT 1 FROM community_profiles WHERE user_id = mal.user_id)`.
Garde : `has_role(auth.uid(), 'admin')` sinon `raise exception`.

### 2. Backend — RPC `admin_delete_orphan_activity_logs(p_user_ids uuid[])` (SECURITY DEFINER, écriture)

Sécurités empilées :
- check `has_role(auth.uid(), 'admin')` ;
- check `p_user_ids` non null et taille ≤ 500 ;
- **DELETE filtré deux fois** : `WHERE user_id = ANY(p_user_ids) AND NOT EXISTS (SELECT 1 FROM community_profiles cp WHERE cp.user_id = mal.user_id)` — même si le client envoie un user_id valide, la RPC refuse de toucher à un log dont l'auteur a un profil ;
- renvoie `{ deleted_count int, affected_users uuid[] }` ;
- log dans `admin_audit_logs` si la table existe (sinon skip).

Aucune action sur `auth.users` ni sur d'autres tables — uniquement `marcheur_activity_logs`.

### 3. Frontend — `OrphanActivityLogsPanel.tsx`

Nouveau composant placé **dans l'onglet Activités existant** (`ActivityDashboard`), replié par défaut dans une `Card` « Maintenance · Activités orphelines » avec badge du nombre total.

UI :
- tableau : checkbox · user_id (tronqué, copiable) · nb logs · types (chips) · première / dernière activité ;
- header : checkbox « tout sélectionner » + bouton `Supprimer la sélection (N)` rouge, désactivé si 0 ;
- `AlertDialog` de confirmation : « Supprimer **X activités** de **Y comptes orphelins** ? Cette action est irréversible. » + bouton destructif ;
- toast succès / erreur, invalidation des queries `['orphan-activity-logs']` et `['activity-dashboard']`.

Hook `useOrphanActivityLogs()` (react-query) → appelle la RPC lecture.
Mutation `useDeleteOrphanActivityLogs()` → appelle la RPC écriture.

### 4. Garanties anti-erreur

- **Aucun `DELETE` direct depuis le client** — tout passe par la RPC qui re-valide l'orphelinage.
- Si un `user_id` redevient légitime entre l'affichage et le clic, la RPC ne supprime simplement rien pour lui (silencieux, comptabilisé dans `deleted_count`).
- Limite dure à 500 user_ids par appel.
- RLS sur `marcheur_activity_logs` inchangée — la RPC seule a le privilège.
- Confirmation obligatoire côté UI.

## Livrables

1. Migration : 2 RPC + grant `execute` à `authenticated`.
2. Composant `OrphanActivityLogsPanel.tsx` + hook + mutation.
3. Intégration dans `ActivityDashboard.tsx` (bloc repliable en bas).

Aucun changement sur les flows existants, aucun risque pour les marcheurs actifs.
