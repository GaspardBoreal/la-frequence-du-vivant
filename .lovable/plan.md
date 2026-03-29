

# Fix: Les marcheurs voient "Marcheur" au lieu des prénoms/noms

## Diagnostic

Dans `useExplorationParticipants.ts` (ligne 97-100), le code requête `community_profiles` pour tous les `user_id` des participants. Mais la **policy RLS SELECT** sur `community_profiles` est :

```
user_id = auth.uid() OR check_is_admin_user(auth.uid())
```

Laurence ne peut voir **que son propre profil**. Pour tous les autres participants, la requête retourne `null`, et le code utilise le fallback `'Marcheur'` (ligne 157).

## Correctif

### Migration SQL — Ajouter une policy SELECT pour les co-participants

Même pattern que pour `marche_participations` : utiliser une fonction `SECURITY DEFINER` pour éviter la récursion RLS.

```sql
-- Function to check if two users share a marche_event
CREATE OR REPLACE FUNCTION public.shares_marche_event(_viewer_id uuid, _profile_user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.marche_participations a
    JOIN public.marche_participations b ON a.marche_event_id = b.marche_event_id
    WHERE a.user_id = _viewer_id
      AND b.user_id = _profile_user_id
  );
$$;

-- New SELECT policy: co-participants can see each other's profile
CREATE POLICY "Co-participants can read profiles"
ON public.community_profiles FOR SELECT
TO authenticated
USING (
  public.shares_marche_event(auth.uid(), user_id)
);
```

Cette policy est **additive** (PERMISSIVE) : elle s'ajoute à la policy existante "Users can read own profile". Un utilisateur verra son profil + les profils de tous ses co-participants.

### Pas de changement de code

Le hook `useExplorationParticipants` fonctionne déjà correctement — il query les bons profils. Le problème est 100% RLS.

## Fichier impacté

| Fichier | Action |
|---|---|
| Migration SQL | Ajouter function `shares_marche_event` + policy SELECT sur `community_profiles` |

