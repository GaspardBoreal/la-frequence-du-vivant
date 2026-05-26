# Onboarding « invitation-first » + séparation des invités

## Objectifs
1. Un nouvel utilisateur (rôle `marcheur_en_devenir` + 0 participation) atterrit directement sur l'onglet **Marches** avec une UI réduite au seul bloc **« Vous êtes invité·e »**.
2. Cliquer « Accepter » crée la participation, puis redirige vers la page exploration de la marche (statut Invité).
3. Côté admin, l'onglet `Marcheurs > Marcheurs` reçoit un sous-bloc « Invités » dont les membres sont exclus du compteur principal.

## 1. Détection du mode onboarding

Critère unique côté front (pas de migration) :
```
isOnboarding = profile.role === 'marcheur_en_devenir' && participations.length === 0
```
Dérivé dans `MarchesDuVivantMonEspace.tsx`, propagé en prop `onboarding` aux composants concernés. Dès la première participation insérée (donc dès l'acceptation d'une invitation), le flag bascule automatiquement.

## 2. Landing sur l'onglet Marches

`MarchesDuVivantMonEspace.tsx` :
- Si `isOnboarding`, forcer `activeTab = 'marches'` à l'initialisation (sauf si `?tab=` est explicitement défini).
- Passer `onboarding` à `MonEspaceTabBar` pour masquer/désactiver les onglets `accueil`, `carnet`, `outils` (rendu en `disabled` + tooltip « Disponible après votre première marche »).
- Passer `onboarding` à `MarchesTab`.

## 3. MarchesTab épuré

Dans `src/components/community/tabs/MarchesTab.tsx`, si `onboarding === true` :
- N'afficher QUE la section « Vous êtes invité·e » (liste des `invitedEvents` non encore acceptés).
- Cas « aucune invitation » : afficher un état vide doux (« Aucune invitation pour le moment. Demandez à un ambassadeur de vous inviter, ou explorez les marches publiques »), avec un seul CTA vers `/marches-du-vivant` (catalogue public).
- Masquer : prochaines marches, mes inscriptions, marches passées, etc.

## 4. Acceptation d'invitation

Dans `InvitedEventCard.tsx`, après l'`INSERT` réussi dans `marche_participations` :
- Invalider les queries (déjà fait).
- `navigate('/marches-du-vivant/mon-espace/exploration/' + event.exploration_id + '?from=invite&marcheEventId=' + event.id)` si `exploration_id` présent, sinon fallback `/marches-du-vivant/m/<event-id>`.
- Ajouter `exploration_id` au payload du hook `useCommunityInvitedEvents` (déjà sélectionné dans la requête, juste à exposer dans `InvitedEventRow.event`).
- Toast inchangé.

À la sortie, l'utilisateur n'est plus en onboarding (1 participation) → au prochain retour sur `/mon-espace`, tous les onglets se débloquent naturellement.

## 5. Liste admin Marcheurs : sous-bloc « Invités »

Dans `src/components/community/exploration/MarcheursTab.tsx` :
- Identifier les `invités` = `community_profiles` présents dans `event_invited_readers` pour la marche/exploration courante mais SANS ligne `marche_participations` correspondante.
- Récupération : nouvelle requête `event_invited_readers` filtrée par `event_id ∈ explorationMarches` joignant `community_profiles`, puis exclusion des user_ids déjà dans la liste participants existante.
- Rendu : section repliable « Invités en attente · {n} » placée sous la liste actuelle, carte simplifiée (avatar, prénom, date d'invitation, source, bouton « Relancer » optionnel — hors scope si trop ambigu).
- Les compteurs existants (header « X marcheurs ») restent calculés sur la liste participants → invités exclus de fait.

## Détails techniques

- `useCommunityInvitedEvents.ts` : ajouter `exploration_id` dans le select `marche_events` puis dans le type `InvitedEventRow.event`.
- `MonEspaceTabBar.tsx` : prop optionnelle `lockedTabs?: TabKey[]` ; les onglets verrouillés sont rendus en `opacity-40 pointer-events-none` avec un cadenas léger.
- `MarchesTab.tsx` : early-return d'un sous-composant `<OnboardingInvitations invitations={pendingInvites} userId={userId} />`.
- Pas de migration SQL nécessaire.
- Pas de changement RLS : `event_invited_readers` est déjà lisible par l'admin et l'utilisateur invité.

## Hors scope (à valider plus tard si besoin)
- Bouton « Relancer l'invitation » côté admin.
- Animation/onboarding tour guidé après acceptation.
- Refus explicite d'invitation.
