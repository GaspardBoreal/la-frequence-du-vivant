## Diagnostic (vérifié en base)

La liste « Vous êtes invité·e » lit la table `event_invited_readers`. Ces lignes ne sont créées qu'**une seule fois**, au moment de l'inscription du marcheur, par le trigger `auto_invite_new_signup_to_shared_events`. Modifier ensuite le réglage « Partager aux nouveaux inscrits » d'une marche n'a **aucun effet rétroactif**.

Constat sur le profil Olivier Lépine (28872ce1…) : ses 3 lignes datent toutes du 02/08 01:54 (son inscription).
- Il voit encore `AGROECOLOGIE "Marcher sur un sol qui respire"` alors que le partage y est désormais OFF.
- Il ne voit pas `Les Secrets de Sauniers`, dont le partage a été activé après son inscription.

## Ce qui sera mis en place

### 1. Synchronisation automatique au changement de réglage (base de données)
Nouveau trigger sur `marche_events`, déclenché quand `share_with_new_signups` change :

- **Passage à ON** → ajoute une invitation `auto_new_signup` pour tous les profils au rôle `marcheur_en_devenir` qui ne sont ni déjà invités, ni déjà inscrits à la marche.
- **Passage à OFF** → supprime uniquement les lignes `invite_source = 'auto_new_signup'` de cette marche, en épargnant celles dont le marcheur s'est inscrit entre-temps (participation existante ou `promoted_to_participant_at` renseigné). Les invitations manuelles et par lien ne sont jamais touchées.
- Chaque ajout/retrait est journalisé dans `event_invited_readers_audit` (`auto_share_on` / `auto_share_off`).

### 2. Rattrapage immédiat de l'existant
Une passe unique aligne la base sur l'état actuel des réglages : Olivier perd l'invitation AGROECOLOGIE et gagne « Les Secrets de Sauniers ».

### 3. Rafraîchissement côté application
Le hook `useCommunityInvitedEvents` garde aujourd'hui les données 60 s en cache et ne réagit à rien.
- Abonnement Realtime sur `event_invited_readers` filtré par `user_id`, avec invalidation de la requête à chaque insertion/suppression (nettoyage propre via `removeChannel`).
- Revalidation au retour d'onglet/focus, pour que le marcheur voie une liste à jour même sans rechargement.

### 4. Repère côté admin
Dans le panneau « Partager aux nouveaux marcheurs inscrits » d'une marche, un message de confirmation précise combien d'invitations ont été ajoutées ou retirées après le basculement du réglage.

## Détails techniques

- Migration : fonction `sync_shared_event_invited_readers()` en `SECURITY DEFINER`, trigger `AFTER UPDATE OF share_with_new_signups ON public.marche_events` avec `WHEN (OLD.share_with_new_signups IS DISTINCT FROM NEW.share_with_new_signups)`.
- Le trigger d'inscription existant reste inchangé.
- Fichiers touchés côté front : `src/hooks/useCommunityInvitedEvents.ts` (realtime + invalidation) et le composant admin `ShareNewSignupsPanel`.
