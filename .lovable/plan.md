## Objectif

Aujourd'hui, Vincent (et tout marcheur) voit deux blocs : « Mes aventures à venir » (inscrit) et « Sentiers à explorer » (tout le reste). Les **invitations personnelles** (table `event_invited_readers`) sont totalement invisibles côté marcheur. Il faut révéler ce 3ᵉ état avec une UX qui donne envie, en jouant sur la **différence de chaleur** entre « invité personnellement » et « ouvert à tous ».

## Trois états canoniques

| État | Source | Statut visuel | Action principale |
|---|---|---|---|
| **Inscrit** ✅ | `marche_participations` | vert émeraude, pastille pleine, badge « Vous êtes attendu » | Préparer la marche |
| **Invité personnellement** ✉️ | `event_invited_readers` (sans participation) | ambre/doré, halo doux, ruban « Invitation personnelle » | Accepter l'invitation |
| **À découvrir** 🧭 | public, ni inscrit ni invité | neutre/sobre, pastille creuse | S'inscrire à cette aventure |

## Onglet « Marches » — réorganisation en 3 sections

```text
┌────────────────────────────────────────────────────┐
│ ✨ Mes aventures à venir                           │  ← inscrit
│   [carte verte · "Inscrit" · contre-J / lieu]      │
├────────────────────────────────────────────────────┤
│ ✉️ Vous êtes invité·e          (NOUVEAU)           │  ← invité non-inscrit
│   [carte ambre · "Invitation personnelle" · qui    │
│    vous invite + petit mot · CTA Accepter]         │
├────────────────────────────────────────────────────┤
│ 🧭 Sentiers à explorer                             │  ← public
│   [carte sobre · CTA S'inscrire]                   │
├────────────────────────────────────────────────────┤
│ 👣 Empreintes passées                              │  ← inchangé
└────────────────────────────────────────────────────┘
```

### Section nouvelle « Vous êtes invité·e » — détails wahouhh

- **Carte ambrée** avec un léger halo `shadow-[0_0_24px_-8px_hsl(var(--amber)/0.4)]` et bordure dégradée.
- **Ruban d'angle** : « Invitation personnelle » (icône `MailOpen`).
- **Ligne d'accroche** : *« Camille vous a invité·e à cheminer sur ce sentier »* (prénom de l'inviteur récupéré côté hook).
- **Compteur narratif** : « Réponse attendue avant le 30 juin · J-12 » (calculé sur `date_marche`).
- **Double CTA** :
  - 🌿 *Accepter et m'inscrire* (primary) — promeut l'invitation en participation.
  - 🤔 *Plus tard* (ghost) — laisse l'invitation visible.
- **Micro-animation** au mount : fade-in + lift, plus un *shimmer* doré subtil qui passe une fois sur le ruban.
- **Empty state** : section masquée s'il n'y a aucune invitation (pas de bruit visuel).

### Section « Mes aventures à venir » — léger enrichissement

- Si l'inscription **provient d'une invitation acceptée** (`promoted_to_participant_at` non null), afficher un mini chip discret « ✉️ Sur invitation de Camille » sous la date — preuve sociale chaleureuse, sans dupliquer la carte.

### Section « Sentiers à explorer »

- Inchangée visuellement, mais **les invités sont retirés** de cette liste (sinon double affichage).

## Onglet « Carnet » — rappel temporel des invitations

Le Carnet est l'espace mémoire. Y intégrer une **frise filtrable** des marches par relation :

- En tête du Carnet : 3 micro-onglets segmentés *Toutes · Vécues · Invitations restées en silence*.
- **« Invitations restées en silence »** = invitations passées non honorées (date_marche < today, pas de participation). Ton délicat, non culpabilisant : *« Ces sentiers vous attendaient. Ils repasseront. »* — laisse une trace douce et permet à l'admin/ambassadeur de mesurer l'engagement implicite.
- Pour chaque entrée : pastille couleur (vert vécu / ambre invité / gris public) cohérente avec l'onglet Marches.

## Données — un seul nouveau hook

Créer `useCommunityInvitedEvents(userId)` qui interroge `event_invited_readers` avec join `marche_events` + nom de l'inviteur (via `event_invitations.invited_by_user_id` → `community_profiles.prenom`, ou `added_by_user_id`).
Renvoie `{ event, invitedByPrenom, inviteSource, invitationId, isPromoted, isPast }[]`.

`MarchesDuVivantMonEspace` dérive ensuite :
- `invitedUpcoming` = invités non promus, date ≥ today
- `invitedPast` = invités non promus, date < today  (pour Carnet)
- `registeredFromInvitation` = `Map<eventId, prenom>` pour décorer la section Inscrit

## Action « Accepter et m'inscrire »

Réutiliser le flow existant `marche_participations.insert(...)`. Au succès, le trigger côté DB met déjà `promoted_to_participant_at`. Côté front : `invalidateQueries` sur `community-participations` + `community-invited-events`. La carte ambre disparaît avec une transition `AnimatePresence` et **réapparaît dans « Mes aventures à venir »** avec un highlight d'1,5 s — l'utilisateur voit le passage de l'invitation à l'inscription.

## Détails techniques

- **Fichiers à créer** :
  - `src/hooks/useCommunityInvitedEvents.ts`
  - `src/components/community/marches/InvitedEventCard.tsx`
- **Fichiers à modifier** :
  - `src/components/community/tabs/MarchesTab.tsx` (nouvelle section + filtre des invités hors « Sentiers à explorer » + chip « sur invitation » dans Inscrit)
  - `src/components/community/tabs/CarnetTab.tsx` + `CarnetVivant` (segmented filter + section silencieuse)
  - `src/pages/MarchesDuVivantMonEspace.tsx` (brancher le hook, passer `invitedUpcoming` et `registeredFromInvitation` à `MarchesTab`)
- **Aucun changement SQL** : tables `event_invited_readers`, `event_invitations`, `marche_participations` suffisent. RLS existante autorise déjà la lecture par le user invité (à confirmer au moment de l'implémentation, sinon RPC `SECURITY DEFINER` minimaliste).
- **Design tokens** : utiliser `--accent` (ambre) déjà défini, ne pas hardcoder de couleurs. Halo via `shadow` sémantique et `bg-gradient-to-br from-amber-500/10 to-amber-300/5`.
- **Responsive** : section invitation pleine largeur sur mobile, max 1 carte par ligne ; sur desktop, conserve la même colonne unique pour rester narratif.

## Ce qui n'est PAS dans le scope

- Pas de notification mail/push (le déclenchement d'invitation est admin-only et reste côté admin).
- Pas de modification du back-office admin (déjà traité dans le drawer Marcheur).
- Pas de système de réponse « Je décline » — l'invitation reste simplement non-acceptée jusqu'à la date.
