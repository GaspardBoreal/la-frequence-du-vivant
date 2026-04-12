

## Correction — "Auteur inconnu" dans Textes écrits

### Diagnostic

Le problème est un blocage RLS. La requête d'auteurs dans `TextesEcritsSubTab.tsx` (ligne 76) fait :

```ts
supabase.from('community_profiles').select('...').in('user_id', userIds)
```

Or la politique RLS sur `community_profiles` ne permet de lire que :
- son propre profil
- les profils de co-participants (via `shares_marche_event`)
- les profils si on est admin

Si l'utilisateur connecté n'a pas de participation commune avec un auteur de texte, son profil est invisible → "Auteur inconnu". Les données sont correctes en base (3 textes, tous avec un `user_id` valide).

### Solution

Créer une **fonction RPC SECURITY DEFINER** qui retourne les textes publics d'un événement avec les informations auteur embarquées, contournant les restrictions RLS sur `community_profiles`.

### Etapes

1. **Migration SQL** — Créer la fonction `get_event_public_textes(p_event_id uuid)` qui retourne les textes joints aux profils auteurs en une seule requête SECURITY DEFINER

2. **Modifier `TextesEcritsSubTab.tsx`** — Remplacer les deux requêtes séparées (textes + auteurs) par un seul appel RPC qui retourne les textes avec l'info auteur intégrée dans chaque ligne

### Detail technique

```sql
CREATE OR REPLACE FUNCTION public.get_event_public_textes(p_event_id uuid)
RETURNS json LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT coalesce(json_agg(row_to_json(r)), '[]')
  FROM (
    SELECT t.id, t.user_id, t.marche_id, t.marche_event_id,
           t.type_texte, t.titre, t.contenu, t.is_public, t.ordre, t.created_at,
           cp.prenom AS author_prenom, cp.nom AS author_nom, cp.avatar_url AS author_avatar
    FROM marcheur_textes t
    LEFT JOIN community_profiles cp ON cp.user_id = t.user_id
    WHERE t.marche_event_id = p_event_id AND t.is_public = true
    ORDER BY t.created_at
  ) r;
$$;
```

Dans le composant, un seul `useQuery` appelant `supabase.rpc('get_event_public_textes', { p_event_id: marcheEventId })`, puis construction de `authorMap` directement depuis les champs `author_prenom/nom/avatar` de chaque ligne.

### Fichiers concernés

| Fichier | Action |
|---------|--------|
| Nouvelle migration SQL | Fonction RPC `get_event_public_textes` |
| `TextesEcritsSubTab.tsx` | Remplacer 2 requêtes par 1 appel RPC, supprimer la query auteurs séparée |

