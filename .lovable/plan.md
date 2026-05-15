## Problème identifié
Vincent Levavasseur existe bien en base :
- dans `auth.users`
- dans `public.community_profiles`

La recherche ne renvoie rien parce que la fonction SQL appelée par la modale **plante avant de répondre**.

## Cause exacte
La RPC `public.search_community_profiles_for_invite` contient :
- `public.has_role(auth.uid(), 'admin')`

Or, dans cette base, la fonction `public.has_role(uuid, ...)` **n’existe pas**. Le projet utilise ailleurs :
- `public.check_is_admin_user(auth.uid())`

Résultat : l’appel RPC échoue côté base, et la modale affiche à tort “Aucun marcheur disponible” au lieu d’indiquer l’erreur réelle.

## Plan de correction
1. **Corriger les deux RPC d’invitation**
   - remplacer `public.has_role(...)` par `public.check_is_admin_user(auth.uid())` dans :
     - `search_community_profiles_for_invite`
     - `add_existing_reader_to_event`
   - conserver la logique de filtrage actuelle (déjà invité / déjà participant validé / recherche multi-mots)

2. **Rendre l’erreur visible dans la modale**
   - ne plus afficher un faux état vide quand la RPC échoue
   - afficher un message d’erreur explicite si la recherche backend échoue

3. **Valider le cas Vincent**
   - retester la recherche avec `Vincent` et `Vincent Levavasseur`
   - vérifier qu’il apparaît bien tant qu’il n’est ni invité ni participant validé à cet événement

## Détail technique
- La fonction actuellement déployée en base est bien la version “multi-mots”, mais son garde admin est cassé.
- La requête de test sur `search_community_profiles_for_invite('f6095e8d-44a8-4156-951f-dd604b821603', 'Vincent')` échoue avec :
  - `function public.has_role(uuid, unknown) does not exist`
- Vincent est présent avec l’utilisateur `4bd02b8a-ef51-48ca-9e9c-f4661e5af6be`.

Si vous validez, j’applique la migration SQL puis le correctif UI.