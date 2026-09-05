# Recherche par email dans /admin/community

Permettre aux administrateurs de retrouver un·e marcheur·euse dans l'écran Communauté en cherchant sur son adresse email, en plus du nom, prénom et ville.

## État actuel

- `community_profiles` ne contient pas d'email. L'email ne vit que dans `auth.users`, schéma protégé non lisible directement depuis le client.
- La recherche actuelle (`src/pages/CommunityProfilesAdmin.tsx` et `src/components/admin/community/ProfilsMosaique.tsx`) ne filtre que sur `prenom`, `nom`, `ville` (et `csp_precision` dans la mosaïque).
- Seules les fonctions admin côté serveur (ex. `admin-delete-user-cascade`) récupèrent un email unitairement via le service-role key.

## Ce qui sera mis en place

1. **RPC admin `admin_get_profile_emails(user_ids uuid[])`**
   - `SECURITY DEFINER`, `search_path = public`.
   - Vérifie `public.check_is_admin_user(auth.uid())`.
   - Retourne `TABLE(user_id uuid, email text)` en joignant `auth.users`.
   - Migration incluant le `GRANT EXECUTE` nécessaire.

2. **Alimentation du front**
   - Nouveau hook `useAdminProfileEmails(userIds)` appelant `supabase.rpc('admin_get_profile_emails', { user_ids })`.
   - Dans `CommunityProfilesAdmin` : récupérer les emails des profils chargés et les fusionner dans les lignes du tableau.
   - Dans `ProfilsPanel` : même enrichissement avant de passer les profils à `ProfilsMosaique`.

3. **Extension de la recherche**
   - `CommunityProfilesAdmin` : la chaîne de recherche inclut désormais `email`.
   - `ProfilsMosaique` : le `haystack` inclut `email`.
   - Placeholders mis à jour : "Rechercher par nom, prénom, ville, email…".

4. **Affichage (optionnel mais utile pour vérifier la recherche)**
   - Ajout d'une colonne "Email" dans le tableau de l'onglet Communauté, après la colonne Ville.
   - L'email reste confiné à l'écran admin ; aucune exposition publique.

5. **Types**
   - Ajout d'un champ optionnel `email?: string | null` sur `EditableProfile` (ou sur le type enrichi transitoire).

## Détails techniques

```text
DB
  migration : CREATE OR REPLACE FUNCTION public.admin_get_profile_emails(user_ids uuid[])
              RETURNS TABLE(user_id uuid, email text)
              LANGUAGE sql
              STABLE
              SECURITY DEFINER
              SET search_path = public
              AS $$
                SELECT u.id, u.email::text
                FROM auth.users u
                WHERE u.id = ANY(user_ids)
                  AND public.check_is_admin_user(auth.uid());
              $$;
              GRANT EXECUTE ON FUNCTION public.admin_get_profile_emails(uuid[]) TO authenticated;
              GRANT EXECUTE ON FUNCTION public.admin_get_profile_emails(uuid[]) TO service_role;

Front
  src/hooks/useAdminProfileEmails.ts
    - useQuery(['admin-profile-emails', userIds], ...)
    - retourne Map<user_id, email>

  src/pages/CommunityProfilesAdmin.tsx
    - appel du hook après chargement de profiles
    - filtered : haystack = prenom + nom + ville + email
    - colonne Email ajoutée dans le <Table>
    - placeholder mis à jour

  src/components/admin/community/ProfilsPanel.tsx
    - appel du hook sur les user_id des profils
    - passe des profils enrichis à ProfilsMosaique

  src/components/admin/community/ProfilsMosaique.tsx
    - haystack inclut email
    - placeholder mis à jour
```

## Non-fait / hors périmètre

- Aucune colonne `email` ajoutée à `community_profiles` : la source de vérité reste `auth.users`.
- Aucune modification de RLS sur `community_profiles`.
- Aucune nouvelle edge function : l'accès se fait via RPC `SECURITY DEFINER`.
