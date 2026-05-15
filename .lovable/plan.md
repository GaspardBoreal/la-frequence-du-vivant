## Objectif

Dans le drawer "Éditer la fiche marcheur" (/admin/community), ajouter une section permettant de consulter **tous les événements** sur lesquels l'utilisateur est :
- **Participant** (table `marche_participations`)
- **Invité** (table `event_invited_readers`, source `manuel` ou `invitation`)

## Proposition UX/UI

Une nouvelle section "**Événements**" insérée après "Relation au vivant" dans le `MarcheurEditSheet`, structurée en :

### 1. Bandeau récapitulatif (compact, lisible d'un coup d'œil)

```text
┌─────────────────────────────────────────────────────────┐
│  ÉVÉNEMENTS                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │ 12           │  │ 4            │  │ 2            │   │
│  │ Participant  │  │ Invité       │  │ À venir      │   │
│  └──────────────┘  └──────────────┘  └──────────────┘   │
└─────────────────────────────────────────────────────────┘
```

Trois petites cartes (style cohérent avec le reste du drawer, glassmorphism dark) : compteurs Participant / Invité / À venir.

### 2. Onglets segmentés "Tous · Participant · Invité"

Sous le bandeau, un sélecteur segmenté (Tabs shadcn) avec un badge compteur sur chaque onglet.

### 3. Liste timeline chronologique (la plus récente en haut)

Chaque ligne = un événement, format dense mais lisible :

```text
┌────────────────────────────────────────────────────────┐
│ ●  12 mai 2026 · à venir          [Participant]        │
│    Laboratoire à Ciel Ouvert : Biodiversité & Sols…    │
│    📍 Bordeaux  ·  Exploration Dordogne                │
│                                              [Ouvrir →]│
├────────────────────────────────────────────────────────┤
│ ○  03 mars 2026 · passé           [Invité · manuel]    │
│    Marche éco-poétique à Libourne                      │
│    📍 Libourne  ·  Invité par Sophie M.                │
│                                              [Ouvrir →]│
└────────────────────────────────────────────────────────┘
```

Codes visuels :
- **Pastille pleine ●** = Participant validé · **pastille vide ○** = Invité (lecture seule)
- **Badge couleur** : Participant (emerald), Invité (amber)
- **État temporel** discret : "à venir" / "aujourd'hui" / "passé" (texte muted)
- Ligne secondaire : lieu + exploration (ou nom de l'inviteur pour les invitations)
- Bouton **[Ouvrir →]** : navigue vers `/admin/marche-events?event=<id>` dans un nouvel onglet (pas de fermeture du drawer)

### 4. États vides et erreurs

- Vide : "Cette personne n'est inscrite à aucun événement pour le moment."
- Loading : 3 skeleton rows.
- Erreur : message + bouton retry.

## Détails techniques

### Données

Une seule edge function `community-marcheur-events-list` (admin-only, JWT + `is_admin_user` check, pattern identique à `event-invited-readers-list`) qui retourne, pour un `user_id` donné :

```ts
type MarcheurEventRow = {
  event_id: string;
  title: string;
  date_marche: string;          // ISO
  lieu: string | null;
  exploration_name: string | null;
  relation: 'participant' | 'invite';
  invite_source?: 'manuel' | 'invitation';   // si relation = 'invite'
  invited_by_prenom?: string | null;          // si relation = 'invite'
  validated_at?: string | null;               // si relation = 'participant'
  promoted_to_participant_at?: string | null; // si invité promu
};
```

L'edge function fait :
1. `marche_participations` filtré par `user_id` → join `marche_events` (+ explorations).
2. `event_invited_readers` filtré par `user_id` → join `marche_events` + résolution inviteur via `event_invitations.invited_by_user_id` ou `added_by_user_id`.
3. Fusion + tri par `date_marche desc`. Déduplication : si une personne a été invitée puis promue Participant, on ne garde que la ligne Participant (mais on indique "promu invité" en tag discret).

### Composants

- `src/components/admin/community/MarcheurEventsSection.tsx` — section complète (cartes stats + tabs + liste).
- `src/components/admin/community/MarcheurEventRow.tsx` — ligne d'événement réutilisable.
- `src/hooks/useMarcheurEvents.ts` — `useQuery(['marcheur-events', userId])`, `enabled: !!userId && open`.
- Edge function : `supabase/functions/community-marcheur-events-list/index.ts`.

### Intégration dans MarcheurEditSheet

Ajout d'une nouvelle section dans le `SheetContent` après "Relation au vivant", avant les boutons d'action. Le contenu est lazy : la query ne se lance que quand `open === true` et qu'on a un `profile.user_id`. Pas de refetch sur édition du formulaire (cache 60s).

### Sécurité

- Edge function exige header `Authorization` + valide `is_admin_user(auth.uid())` (RPC existante).
- Si non admin → 403 `forbidden`.
- Aucune donnée PII supplémentaire renvoyée que celles déjà accessibles à l'admin.

## Fichiers touchés

- **Créer** : `supabase/functions/community-marcheur-events-list/index.ts`
- **Créer** : `src/hooks/useMarcheurEvents.ts`
- **Créer** : `src/components/admin/community/MarcheurEventsSection.tsx`
- **Créer** : `src/components/admin/community/MarcheurEventRow.tsx`
- **Éditer** : `src/components/admin/community/MarcheurEditSheet.tsx` (insertion de la section)

Aucune migration SQL nécessaire — toutes les tables (`marche_participations`, `event_invited_readers`, `event_invitations`, `marche_events`, `explorations`, `community_profiles`) existent déjà.