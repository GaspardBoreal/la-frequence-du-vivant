# Bug : connexion `/mon-espace` rebondit vers `/connexion` sur tablette

## Diagnostic

Deux contextes d'auth coexistent sur le projet et partagent **le même client Supabase** (donc le même `localStorage` + les mêmes tokens) :

1. `src/contexts/AuthContext.tsx` (admin) — monté **globalement** dans `App.tsx` (ligne 109), donc actif aussi sur `/marches-du-vivant/mon-espace`.
2. `src/hooks/useCommunityAuth.ts` — utilisé par la page Mon Espace.

Quand un utilisateur se connecte côté communauté :

- Supabase déclenche `SIGNED_IN` → `AuthContext.handleSession` appelle `supabase.auth.getUser()` pour revalider le JWT côté serveur.
- Si cet appel échoue pour une raison transitoire (réseau hésitant, refresh-token concurrent, ITP, etc. — fréquent sur tablette Android Chrome en 4G/WiFi instable), le bloc suivant s'exécute :

```ts
if (error || !validatedUser) {
  setSignedOutState();
  await supabase.auth.signOut();   // ← TUE LA SESSION GLOBALEMENT
  return;
}
```

→ Le `signOut()` global purge le token partagé → `useCommunityAuth` reçoit `SIGNED_OUT` → `user = null` → la garde `MarchesDuVivantMonEspace` (ligne 113) redirige vers `/connexion`.

Les logs auth confirment le pattern : succession de `password` 200 OK, puis `token_revoked` + `Invalid Refresh Token: Refresh Token Not Found` (06:00:09), suivis d'une cascade de reconnexions manuelles. Sur mobile la latence est plus stable → `getUser()` passe du premier coup → pas de signOut. Sur tablette, un seul échec transitoire suffit pour casser la session.

## Correctif

Ne plus laisser le contexte **admin** purger la session **globale** : `AuthContext` doit se contenter de mettre à jour son **état local** quand `getUser()` échoue. Si le token est réellement révoqué, Supabase le signalera par un événement `SIGNED_OUT` ou `TOKEN_REFRESHED` ; aucun besoin de forcer un signOut côté client.

### Fichier modifié — `src/contexts/AuthContext.tsx`

Dans `handleSession`, remplacer :

```ts
if (error || !validatedUser) {
  console.warn('Session expired or invalid, signing out:', error?.message);
  setSignedOutState();
  await supabase.auth.signOut();
  return;
}
```

par :

```ts
if (error || !validatedUser) {
  // NE PAS appeler supabase.auth.signOut() ici : ce contexte est global
  // et la session est partagée avec useCommunityAuth. Un signOut forcé
  // déconnecterait l'utilisateur côté Mon Espace sur la moindre erreur
  // transitoire de getUser() (tablette/réseau instable).
  console.warn('[AuthContext] getUser failed, clearing local admin state only:', error?.message);
  validatedUserIdRef.current = null;
  processingTokenRef.current = null;
  initialResolvedRef.current = true;
  setAuthState({
    user: null,
    session: null,
    isLoading: false,
    isAdmin: false,
    isAdminChecked: true,
  });
  return;
}
```

L'admin reste protégé : `AdminAuth` requiert toujours `user && isAdmin` → un échec de `getUser()` rendra simplement le formulaire de login admin, sans casser la session communautaire partagée.

## Vérification

1. Se connecter en compte communautaire (Gaspard Boréal) sur tablette Android Chrome.
2. Vérifier que `/marches-du-vivant/mon-espace` reste affichée sans rebond vers `/connexion`.
3. Vérifier en parallèle que `/admin` exige toujours le login admin (pas de régression côté admin).
4. Console : plus de `Session expired or invalid, signing out` déclenché par `AuthContext` lors d'une navigation Mon Espace.

## Hors scope

- Aucune modification de `useCommunityAuth`, des routes, du schéma DB ou du UX `/connexion`.
- Le garde-fou 500 ms de `MarchesDuVivantMonEspace` reste tel quel (utile pour le tick initial).
