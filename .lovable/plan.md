## Diagnostic

Tu as raison : la logique actuelle est **fausse**. Vérification BDD sur Vincent Levavasseur :

- `auth.users` : compte créé le **11 mai 2026**, email confirmé, dernière connexion le **17 mai 2026** → il est **inscrit**.
- `event_invited_readers` : 2 lignes (DEVIAT 10 km + une autre marche), `user_id` rempli, `promoted_to_participant_at = NULL`, `invite_source = 'manuel'`.

Il apparaît donc « En attente » uniquement parce qu'il n'a jamais été **promu Participant** — pas parce qu'il n'a pas créé son compte.

## Pourquoi c'est cassé

Dans `src/components/community/exploration/MarcheursTab.tsx` (lignes 1411-1448), le bloc « Invités en attente » fait :

```ts
supabase.from('event_invited_readers')
  .select(...)
  .in('event_id', explorationEventIds)
  .is('promoted_to_participant_at', null);
```

Conséquences :

1. **Aucun filtrage sur l'état d'inscription Auth.** Toute personne avec un `user_id` dans `event_invited_readers` non promue → étiquetée « En attente », même si elle est inscrite depuis 2 semaines (cas Vincent).
2. **Les vrais invités sans compte ne s'affichent pas du tout.** Les invitations email non consommées vivent dans la table `event_invitations` (avec `invited_email`, `consumed_at IS NULL`), pas dans `event_invited_readers`. Cette table n'est jamais lue par MarcheursTab.

Donc à la question posée :

- **a.** ❌ Non — un nouvel invité **sans compte** n'apparaîtra **pas du tout** dans ce bloc (il vit dans `event_invitations`).
- **b.** ⚠️ Partiellement — une fois qu'il crée son compte, il apparaît bien… mais avec le **mauvais label « En attente »** tant qu'un admin ne le promeut pas Participant. Il restera coincé dans ce statut indéfiniment.

À noter : la edge function `event-invited-readers-list` (utilisée côté admin dans `InvitedReadersTab.tsx`) fait correctement la distinction (`event_invited_readers` → `inscrit`, `event_invitations` non consommée → `en_attente` / `expire`). Le bug est uniquement dans la vue publique exploration.

## Plan de correction

### 1. Renommer/séparer les deux états dans MarcheursTab

Restructurer le bloc en **deux sections distinctes** :

**A. « Invités en attente » (vraiment en attente)**  
Source : `event_invitations` filtrée par `event_id IN explorationEventIds`, `consumed_at IS NULL`, et `expires_at > now()` (ou NULL).  
Affichage : prénom + email + marche d'invitation + badge ambre « En attente ».  
Dédup : exclure les emails déjà présents dans `auth.users` (donc déjà inscrits).

**B. « Invités inscrits (non promus Participant) »**  
Source : `event_invited_readers` avec `user_id` non null, `promoted_to_participant_at IS NULL`, jointe à `community_profiles`.  
Affichage : carte plus claire « Lecteur inscrit · pas encore promu Participant » avec badge neutre (pas ambre).  
Dédup : exclure les `user_id` déjà présents dans `knownParticipantUserIds` (déjà fait).

### 2. Edge function dédiée (recommandé)

Pour éviter d'exposer `event_invitations` (emails) au front public, créer une edge function `exploration-pending-invitees-list` qui :

- Reçoit `exploration_id`
- Vérifie côté serveur que l'appelant a le droit de voir l'exploration (admin OR participant validé d'au moins une marche)
- Retourne `{ pending: [...], registered_not_promoted: [...] }`
- Masque les emails sauf pour les admins/organisateurs

### 3. UI

- Renommer la section actuelle « Invités en attente » → garder ce libellé **uniquement** pour la liste A.
- La liste B devient « Lecteurs inscrits (à promouvoir) » avec un CTA discret « Promouvoir » si l'utilisateur a les droits, sinon simple mention.
- Conserver le compteur séparé pour chacune ; les deux restent « non comptés dans le total marcheurs ».

### 4. Cas concret après correction

| Scénario | Section affichée | Badge |
|---|---|---|
| Email invité, pas de compte | A. Invités en attente | En attente (ambre) |
| Compte créé, jamais promu (cas Vincent) | B. Lecteurs inscrits à promouvoir | Inscrit (neutre) |
| Promu Participant | Disparaît des 2 blocs, apparaît dans la liste principale | — |
| Invitation expirée sans compte | (optionnel) section pliée « Expirées » | Gris |

## Fichiers impactés

- `src/components/community/exploration/MarcheursTab.tsx` — refonte du bloc lignes 1400-1448 + rendu lignes 1885-1920.
- `supabase/functions/exploration-pending-invitees-list/index.ts` — **nouveau**, basé sur la même logique que `event-invited-readers-list` mais scopé à une exploration et avec garde d'accès lecteur.
- (optionnel) `src/hooks/useExplorationPendingInvitees.ts` — extraire la logique du composant.

Aucune migration DB nécessaire — les deux tables existent déjà.
