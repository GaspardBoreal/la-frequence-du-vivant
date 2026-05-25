# Partage automatique des événements aux nouveaux inscrits

## Décisions retenues
- **Cible** : tous les nouveaux marcheurs, sans condition.
- **Déclenchement** : futurs inscrits uniquement (pas de backfill rétroactif).
- **Notification** : ajout silencieux (aucun email), visible dans Mon Espace > Marches comme un Lecteur invité classique.
- **Décochage** : on conserve les entrées déjà créées (acquis pour les marcheurs concernés).

## 1. Schéma BDD

### `marche_events`
- Ajouter `share_with_new_signups boolean NOT NULL DEFAULT false`.
- Index partiel `WHERE share_with_new_signups = true` pour le trigger.

### `event_invited_readers`
- Ajouter `invite_source text` avec valeurs : `'invitation' | 'manuel' | 'auto_new_signup'` (NULL toléré pour l'existant ; backfill : `invitation` si `invitation_id` not null, sinon `manuel`).
- Cela remplace la dérivation actuelle dans `useCommunityInvitedEvents` (qui se basait uniquement sur `invitation_id`).

### Audit / traçabilité
- Réutiliser la table d'audit existante si présente, sinon créer `event_invited_readers_audit` (event_id, user_id, action, source, performed_by, created_at) pour tracer chaque ajout auto.
- À vérifier pendant l'implémentation (suivre le pattern des autres tables d'audit du projet : `marcheur_media_gps_audit`, etc.).

## 2. Trigger d'auto-invitation

Trigger `AFTER INSERT ON community_profiles` (SECURITY DEFINER) :
1. Pour chaque event où `share_with_new_signups = true` ET `date_marche >= now()` (futurs uniquement, pas d'événements passés).
2. INSERT dans `event_invited_readers` avec :
   - `user_id` = nouveau marcheur
   - `event_id` = event partagé
   - `added_by_user_id` = NULL (système)
   - `invite_source = 'auto_new_signup'`
   - `invitation_id = NULL`
3. ON CONFLICT DO NOTHING (idempotent).
4. Log dans la table d'audit.

Note : le trigger ne s'active que sur de **nouveaux** `community_profiles`. Cocher un événement plus tard n'affecte que les inscrits **après** le cochage — conforme à la décision « Futurs uniquement ».

## 3. UI Admin événements

### Liste (`MarcheEventsAdmin` + `EventsFiltersBar`)
- Nouveau filtre « Partage nouveaux inscrits » : `Tous | Oui | Non` (Select à côté du filtre Type/Statut).
- Badge visuel sur les vignettes des événements partagés (icône Sparkles + libellé « Partagé aux nouveaux »).
- Étendre `EventsFilters` et `useMarcheEventsQuery` pour le nouveau critère.

### Formulaire édition événement
- Switch « Partager aux nouveaux marcheurs inscrits » dans la carte « Publication / Visibilité ».
- Texte d'aide : « Tout nouveau marcheur sera silencieusement ajouté comme Lecteur invité dès son inscription. Les marcheurs déjà inscrits ne sont pas concernés. »
- Décocher : aucune action destructive sur les `event_invited_readers` déjà créés.

## 4. UI Marcheur

Aucune modification visible nécessaire : `useCommunityInvitedEvents` retourne déjà les events, et l'onglet `CarnetTab` / `MarchesTab` les affiche. On enrichit juste la sémantique de `invite_source` pour pouvoir, plus tard (étape 4), distinguer un parcours découverte.

## 5. Sécurité & RLS

- Trigger en `SECURITY DEFINER` (bypass RLS pour insert système).
- Policies existantes sur `event_invited_readers` à vérifier : un utilisateur doit pouvoir lire ses propres entrées `auto_new_signup` (déjà couvert si la policy actuelle filtre par `user_id = auth.uid()`).
- Pas de PII exposée.

## 6. Préparation étape 4 (parcours découverte)

Pas implémenté maintenant, mais le schéma le permet :
- `invite_source = 'auto_new_signup'` identifie les events à mettre en avant dans un futur onboarding disruptif (carousel « À découvrir », story Wahouhh, etc.).
- Un champ optionnel `discovery_order int` sur `marche_events` pourra être ajouté plus tard pour ordonner le parcours.

## Fichiers impactés

**Migration SQL** :
- ALTER `marche_events` (colonne + index)
- ALTER `event_invited_readers` (colonne `invite_source`)
- Backfill `invite_source` des lignes existantes
- Création table audit (si besoin)
- Création trigger + fonction `auto_invite_new_signup()`

**Frontend** :
- `src/hooks/useMarcheEventsQuery.ts` — type `EventsFilters` + requête
- `src/components/admin/marche-events/EventsFiltersBar.tsx` — nouveau Select
- `src/components/admin/marche-events/EventCard.tsx` (ou équivalent) — badge
- Formulaire édition event (à localiser : probablement `MarcheEventForm.tsx` ou similaire) — switch
- `src/hooks/useCommunityInvitedEvents.ts` — utiliser `invite_source` BDD au lieu de la dérivation

## Mémoire à créer après livraison
`mem://features/admin/event-share-new-signups-logic` — toggle + trigger silent invitation, source `auto_new_signup`.
