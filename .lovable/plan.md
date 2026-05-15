# Plan : navigation admin sans clignotement

## Diagnostic

L'écran de login d'admin apparaît brièvement à deux moments :

1. **Au chargement initial de `/access-admin-gb2025`** — `AdminAuth` affiche le spinner (`isLoading=true`), puis dès que la session est restaurée `isLoading` passe à `false` mais le check admin (`is_admin_user` RPC) n'a pas encore résolu. Pendant ce micro-délai, la condition `!user || !isAdmin` est vraie → l'écran de login flashe avant que `isAdmin=true` arrive.

2. **Au clic sur "Événements"** — chaque route admin a son propre `<AdminAuth>` qui démonte / remonte. Si entretemps Supabase a émis un événement (`TOKEN_REFRESHED`, `INITIAL_SESSION` avec un nouveau `access_token`, ou la console montre déjà des "Invalid Refresh Token"), `validateAndSetUser` repart à zéro : il remet `isLoading=true`, `isAdmin=false`, `isAdminChecked=false`. Pendant la re-validation et le RPC admin, `AdminAuth` retombe sur la branche `!user || !isAdmin` → flash login.

Cause racine : `AdminAuth` utilise une condition trop permissive (`!user || !isAdmin`) sans attendre `isAdminChecked`, et `AuthContext` réinitialise tout son état dès qu'un nouvel `access_token` arrive même si l'utilisateur reste identique.

## Objectif

Rendre la navigation admin strictement déterministe : aucun écran transitoire autre que le spinner tant que l'état d'auth n'est pas confirmé, et aucune réinitialisation visible quand le token est rafraîchi pour le même utilisateur.

## Étapes

### 1. `src/contexts/AuthContext.tsx` — état stable au refresh

- Indexer la dédup par `user.id` (et pas seulement `access_token`). Si le `user.id` validé est identique au précédent, on **met à jour la session sans toucher** à `isLoading`, `isAdmin`, `isAdminChecked`.
- Ajouter un drapeau `initialAuthResolved` interne. Tant qu'il est `false`, `isLoading=true`. Une fois la première résolution faite (session + check admin), `isLoading` ne repasse plus à `true` pour les rafraîchissements suivants.
- Sur `TOKEN_REFRESHED`, ne pas re-déclencher `is_admin_user` si `user.id` inchangé (évite le flash et économise un RPC).
- Sur `SIGNED_OUT` réel uniquement, remettre l'état à zéro.

### 2. `src/components/AdminAuth.tsx` — gating strict

Remplacer la condition d'affichage par :

```text
- if (isLoading || (user && !isAdminChecked)) → spinner
- else if (!user || !isAdmin)                 → écran login
- else                                         → children
```

Ainsi le formulaire de login ne s'affiche jamais pendant qu'on attend la confirmation du rôle admin.

### 3. `src/pages/AdminLogin.tsx` — même garde

Aligner sur la même logique : `isLoading || (user && !isAdminChecked)` → spinner ; ne rediriger vers `/admin` que lorsque `isAdminChecked && isAdmin`.

### 4. Vérification

- Recharger `/access-admin-gb2025` à froid : on doit voir uniquement le spinner puis le contenu admin.
- Naviguer Index → `/access-admin-gb2025` → "Événements" → un événement → retour : aucun flash de l'écran de login à aucun moment.
- Inspecter la console : plus de cycle `is_admin_user` redondant sur chaque navigation.

## Fichiers touchés

- `src/contexts/AuthContext.tsx` (logique de dédup et conservation d'`isAdmin` au refresh)
- `src/components/AdminAuth.tsx` (gating spinner vs login)
- `src/pages/AdminLogin.tsx` (gating cohérent)

Aucun changement SQL, aucune nouvelle edge function.
