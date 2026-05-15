## Diagnostic

Vincent Levavasseur **est bien dans la base** pour l'événement `df85910e` (DEVIAT Le Réveil de la Terre), inséré à 07:04. Le RPC `list_event_invited_readers` le retourne correctement. Les logs auth montrent **5+ appels concurrents à `/auth/v1/user`** par chargement de page : c'est la signature de plusieurs instances `useAuth()` qui font chacune leur propre `getSession` + `getUser` + `is_admin_user` en parallèle.

Conséquence pour `InvitedReadersTab` :
- Chaque `useAuth()` a son **propre `useState`** → race conditions entre instances.
- `is_admin_user` peut transitoirement échouer (ou retourner `false`) pendant la course → `enabled` reste à false, ou bien la query part puis retombe en erreur.
- `retry: 1` ne suffit pas : après une erreur transitoire on tombe sur le message "Impossible de charger… Réessayez dans un instant" et l'utilisateur reste bloqué.

C'est un problème **transverse** : il touchera aussi `useCanUseContextualChat`, `MarcheursTab`, `AdminAuth`, etc. dès qu'on ajoutera des composants admin sensibles.

## Plan

### 1. Transformer `useAuth` en singleton via Context (cœur du fix)
- Créer `src/contexts/AuthContext.tsx` qui :
  - Expose le **même provider** englobant déjà l'app (à monter dans `main.tsx` ou `App.tsx`, juste sous `QueryClientProvider`).
  - Contient **une seule** instance de la logique actuelle (`getSession`, `onAuthStateChange`, `validateAndSetUser`, `checkAdminStatus`).
  - Expose `user, session, isLoading, isAdmin, isAdminChecked, signIn, signUp, signOut, resetPassword`.
- Réécrire `src/hooks/useAuth.ts` en un simple `useContext(AuthContext)` (avec garde si provider absent).
- Aucun changement d'API publique → les 13 fichiers consommateurs continuent de fonctionner sans édition.

Effets immédiats :
- 1 seul appel `getUser` + 1 seul appel `is_admin_user` par session.
- `isAdminChecked` passe à `true` une seule fois pour toute l'arbre → fin des courses.

### 2. Durcir `InvitedReadersTab` (ceinture + bretelles)
- Garder `authReady = !authLoading && isAdminChecked && !!user && isAdmin`.
- Passer `retry: 3` avec `retryDelay: attempt => Math.min(500 * 2**attempt, 4000)` pour absorber un transitoire RPC.
- Ajouter un **bouton "Réessayer"** dans la carte d'erreur qui appelle `refetch()` (au lieu de laisser l'utilisateur recharger toute la page).
- Après ajout d'un Lecteur via `InviteReaderDialog`, conserver le simple `invalidateQueries` (déjà en place).

### 3. Validation
- Recharger l'écran de l'événement `df85910e` et vérifier que Vincent apparaît dans l'onglet Lecteurs.
- Vérifier que l'événement `f6095e8d` (Jardin Monde) liste aussi Vincent.
- Vérifier que l'ajout d'un nouveau Lecteur sur un 3e événement met à jour la liste sans message d'erreur.
- Vérifier dans le réseau qu'il n'y a plus que **1 seul** appel `/user` et **1 seul** appel `is_admin_user` au chargement.

## Détails techniques

Fichiers touchés :
- **Créé** : `src/contexts/AuthContext.tsx` (provider + context)
- **Réécrit** : `src/hooks/useAuth.ts` (devient un wrapper `useContext`)
- **Édité** : `src/main.tsx` ou `src/App.tsx` (monter `<AuthProvider>`)
- **Édité** : `src/components/admin/marche-events/InvitedReadersTab.tsx` (retry agressif + bouton Réessayer)

Aucune migration SQL nécessaire — la base et les RPC sont OK.
