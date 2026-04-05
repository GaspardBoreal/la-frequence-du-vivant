

## Corriger l'affichage des marcheurs (0 au lieu de 2+)

### Cause racine

Le hook `useExplorationParticipants` interroge `marche_participations` puis `community_profiles` côté client. Les deux tables ont des politiques RLS restrictives :

- `marche_participations` : SELECT uniquement pour les co-participants du même événement + admins
- `community_profiles` : SELECT uniquement pour son propre profil + co-participants + admins

Résultat : tout utilisateur qui n'est pas lui-même participant de cet événement voit **0 marcheurs**, même s'il est connecté.

### Solution

Créer une **fonction RPC `SECURITY DEFINER`** qui retourne les participants d'une exploration en contournant les RLS de manière contrôlée. Le hook appellera `.rpc()` au lieu de faire des requêtes directes.

### Détail technique

**1. Migration SQL** — Créer la fonction `get_exploration_participants(p_exploration_id uuid)`

```sql
CREATE OR REPLACE FUNCTION public.get_exploration_participants(p_exploration_id uuid)
RETURNS TABLE (
  user_id uuid,
  prenom text,
  nom text,
  avatar_url text,
  role text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT DISTINCT
    cp.user_id,
    cp.prenom,
    cp.nom,
    cp.avatar_url,
    cp.role::text
  FROM marche_participations mp
  JOIN marche_events me ON me.id = mp.marche_event_id
  JOIN community_profiles cp ON cp.user_id = mp.user_id
  WHERE me.exploration_id = p_exploration_id;
$$;
```

**2. Modifier `useExplorationParticipants.ts`** — Source 2 (community participants)

Remplacer les requêtes directes sur `marche_participations` + `community_profiles` par un appel RPC :

```ts
const { data: communityUsers } = await supabase
  .rpc('get_exploration_participants', { p_exploration_id: explorationId });
```

Puis pour les stats média/audio/textes, récupérer tous les `marche_event_id` de l'exploration via `marche_events` (table publique en SELECT), et interroger les tables `marcheur_medias`, `marcheur_audio`, `marcheur_textes` avec ces IDs.

**3. Aussi récupérer les marche_event_ids pour les stats**

```ts
const { data: events } = await supabase
  .from('marche_events')
  .select('id')
  .eq('exploration_id', explorationId);
const eventIds = (events || []).map(e => e.id);
```

Puis utiliser `.in('marche_event_id', eventIds)` pour les requêtes médias (au lieu d'un seul `marcheEventId`).

### Impact

- `MarcheursTab` affichera les 2+ participants correctement
- Fonctionne pour les utilisateurs connectés non-participants et même potentiellement les visiteurs
- Les tables `marcheur_medias`, `marcheur_audio`, `marcheur_textes` ont des politiques SELECT publiques (filtré par `is_public = true`) — pas de blocage RLS
- Aucune modification de composant UI nécessaire, uniquement le hook et la migration

