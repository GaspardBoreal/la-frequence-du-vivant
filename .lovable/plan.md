

# Verifier l'existence du compte avant reinitialisation du mot de passe

## Probleme

Supabase `resetPasswordForEmail` ne revele pas si le compte existe (securite par defaut). L'utilisateur recoit un message de succes meme si l'email n'est pas enregistre.

## Solution

### 1. Fonction SQL (migration)

Creer une fonction `check_email_exists(email text)` en `SECURITY DEFINER` qui interroge `auth.users` et retourne un booleen. Cette fonction est appelee cote client via `supabase.rpc()`.

```sql
create or replace function public.check_email_exists(_email text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from auth.users where email = lower(_email)
  )
$$;
```

### 2. Modifier `handleForgotPassword` dans `MarchesDuVivantConnexion.tsx` (lignes 97-109)

- Avant d'appeler `resetPassword`, appeler `supabase.rpc('check_email_exists', { _email: email })`
- Si `false` : afficher un toast elegant avec un message du type "Aucun compte ne correspond a cet email. Rejoignez l'aventure !" puis basculer vers l'onglet inscription (`setMode('register')`) apres un court delai
- Si `true` : proceder normalement avec `resetPassword`

### 3. Modifier `useCommunityAuth.ts`

Ajouter une methode `checkEmailExists(email: string): Promise<boolean>` qui encapsule l'appel RPC, exportee dans le hook.

## Fichiers

| Fichier | Action |
|---------|--------|
| Migration SQL | Creer `check_email_exists` |
| `src/hooks/useCommunityAuth.ts` | Ajouter `checkEmailExists` |
| `src/pages/MarchesDuVivantConnexion.tsx` | Modifier `handleForgotPassword` |

