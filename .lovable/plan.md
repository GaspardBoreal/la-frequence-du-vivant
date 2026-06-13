# Ajouter un membre CRM depuis les marcheurs

## Objectif

Sur `/admin/crm/equipe`, transformer le bouton « Ajouter un membre » en un flow à deux choix :

1. **Depuis un marcheur** (chemin principal, mis en avant) — picker avec recherche live nom/prénom dans `community_profiles`.
2. **Créer manuellement** (chemin secondaire, repli pour membres externes type prestataire).

## Expérience utilisateur

Au clic sur « Ajouter un membre », ouverture d'un **Dialog en deux temps** :

### Étape 1 — Choix de la source (split visuel)

Deux grandes cartes côte à côte, design "wahouh" :
- 🚶 **Depuis la communauté de marcheurs** — gradient `from-primary/10 to-accent/10`, icône `Footprints`, badge « Recommandé ».
- ✍️ **Créer un membre externe** — bordure simple, icône `UserPlus`.

### Étape 2a — Picker marcheur (si choix communauté)

- `Command` (cmdk shadcn) plein dialog avec :
  - Input recherche en haut : « Rechercher un marcheur (nom ou prénom)… » + auto-focus.
  - Liste virtuelle scrollable : avatar + prénom nom + ville + badge rôle (Ambassadeur/Sentinelle/Marcheur) + petit chip si déjà membre CRM (grisé, non sélectionnable).
  - Tri : Ambassadeurs/Sentinelles en premier, puis ordre alphabétique.
  - Filtre live côté client (debounce 200ms) sur `prenom ILIKE %q% OR nom ILIKE %q%` (normalisé NFD pour ignorer accents).
  - Pied : compteur « X marcheurs trouvés ».
- Au clic sur un marcheur → étape de **confirmation pré-remplie** : fonction (optionnelle, ex. « Ambassadeur Dordogne »), switch actif, bouton « Ajouter à l'équipe ».
- Création du `team_members` avec `user_id = profile.user_id`, `prenom`, `nom`, `email` (récupéré via RPC si dispo, sinon null), `photo_url = avatar_url`, `telephone`, `fonction` saisi.
- Le rôle CRM (admin/member/walker) reste attribué via le `Select` existant sur la carte du membre après création — non bloquant à l'ajout. Default suggéré : `walker`.

### Étape 2b — Formulaire manuel

Le formulaire actuel inchangé (prenom/nom/email/fonction/telephone/actif).

## Composants à créer / modifier

- **`src/components/crm/AddMemberDialog.tsx`** (nouveau) — orchestre les 2 étapes (source → picker | manuel).
- **`src/components/crm/MarcheurPicker.tsx`** (nouveau) — `Command` + liste filtrée + état "déjà membre".
- **`src/hooks/useMarcheursForCrm.ts`** (nouveau) — `useQuery` qui fetch `community_profiles` (id, user_id, prenom, nom, ville, avatar_url, role, telephone) limité aux profils avec `user_id` non null, ordonnés par rôle puis nom. Limite 1000 (suffisant à ce stade).
- **`src/pages/TeamManagement.tsx`** — remplace le `Dialog` actuel par `AddMemberDialog`, conserve l'édition existante (clic crayon ouvre le formulaire manuel pré-rempli).
- **`src/hooks/useTeamMembers.ts`** — ajoute une fonction utilitaire `getExistingUserIds()` (Set des `user_id` déjà liés) pour griser les marcheurs déjà membres.

## Détails techniques

- Recherche normalisée : helper `normalize(s)` = `s.normalize('NFD').replace(/\p{Diacritic}/gu,'').toLowerCase()` côté client.
- Email du marcheur : non stocké dans `community_profiles` (vit dans `auth.users`). On laisse `email = null` à la création ; l'admin pourra l'éditer ensuite (ou on prévoit un RPC `get_user_email` plus tard — hors scope).
- Aucune migration DB requise. Aucune RLS à modifier (lecture `community_profiles` déjà ouverte aux admins via les policies existantes).
- Mobile first : dialog plein écran < `sm`, picker `Command` en pleine hauteur.
- Pas de duplicate : avant insert, check `members.some(m => m.user_id === picked.user_id)` → toast d'erreur si déjà lié.

## Hors scope

- Synchronisation automatique de l'email depuis `auth.users`.
- Attribution du rôle CRM dans le même flow (reste sur la carte).
- Édition du lien marcheur ↔ membre existant (on ne casse pas l'existant).
