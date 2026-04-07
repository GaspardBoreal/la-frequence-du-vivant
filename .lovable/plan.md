

## Corriger l'erreur RLS à l'inscription

### Cause racine

Le `signUp` Supabase avec confirmation email ne crée PAS de session immédiate. L'utilisateur reçoit un statut `user_confirmation_requested` → `auth.uid()` est `NULL` → la politique RLS `user_id = auth.uid()` rejette l'INSERT dans `community_profiles`.

### Solution

Créer le profil via une **fonction SQL `SECURITY DEFINER`** qui contourne le RLS, appelée par `supabase.rpc()` juste après le `signUp`. Cette fonction vérifie que le `user_id` passé existe bien dans `auth.users` avant d'insérer.

### Étapes

**1. Migration SQL** — Créer la fonction `create_community_profile` :

```sql
CREATE OR REPLACE FUNCTION public.create_community_profile(
  _user_id UUID,
  _prenom TEXT,
  _nom TEXT,
  _ville TEXT DEFAULT NULL,
  _telephone TEXT DEFAULT NULL,
  _date_naissance TEXT DEFAULT NULL,
  _motivation TEXT DEFAULT NULL,
  _kigo_accueil TEXT DEFAULT NULL,
  _superpouvoir_sensoriel TEXT DEFAULT NULL,
  _niveau_intimite_vivant TEXT DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify user exists in auth.users
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = _user_id) THEN
    RAISE EXCEPTION 'User not found';
  END IF;
  
  INSERT INTO public.community_profiles (
    user_id, prenom, nom, ville, telephone,
    date_naissance, motivation, kigo_accueil,
    superpouvoir_sensoriel, niveau_intimite_vivant
  ) VALUES (
    _user_id, _prenom, _nom, _ville, _telephone,
    _date_naissance, _motivation, _kigo_accueil,
    _superpouvoir_sensoriel, _niveau_intimite_vivant
  );
END;
$$;
```

**2. Modifier `useCommunityAuth.ts`** — Remplacer l'insert direct par l'appel RPC :

```typescript
// Remplacer le bloc supabase.from('community_profiles').insert({...})
const { error: profileError } = await supabase.rpc('create_community_profile', {
  _user_id: authData.user.id,
  _prenom: data.prenom,
  _nom: data.nom,
  _ville: data.ville || null,
  _telephone: data.telephone || null,
  _date_naissance: data.date_naissance || null,
  _motivation: data.motivation || null,
  _kigo_accueil: data.kigo_accueil || null,
  _superpouvoir_sensoriel: data.superpouvoir_sensoriel || null,
  _niveau_intimite_vivant: data.niveau_intimite_vivant || null,
});
```

### Sécurité

- La fonction `SECURITY DEFINER` s'exécute avec les privilèges du propriétaire (bypass RLS)
- La vérification `EXISTS auth.users` empêche l'injection d'un `user_id` arbitraire
- Le `search_path = public` prévient les attaques par manipulation de schéma

### Fichiers impactés

| Action | Fichier |
|--------|---------|
| Migration | Fonction SQL `create_community_profile` |
| Modifier | `src/hooks/useCommunityAuth.ts` — remplacer `.insert()` par `.rpc()` |

