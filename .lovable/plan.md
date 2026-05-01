# Correctif : "Connectez-vous pour voir et gérer vos contributions" après création d'une marche

## Diagnostic

Dans `src/components/community/ExplorationMarcheurPage.tsx` :

```ts
// Lignes 73-81 — source actuelle du userId
const { data: session } = useQuery({
  queryKey: ['session-exploration'],
  queryFn: async () => {
    const { data } = await supabase.auth.getSession();
    return data.session;
  },
});
const userId = session?.user?.id;
```

Puis ligne 355 :
```tsx
{!userId ? (
  <div>Connectez-vous pour voir et gérer vos contributions.</div>
) : ( ...VoirTab / EcouterTab / LireTab / VivantTab... )}
```

### Pourquoi ça casse après "+ point de marche"

1. `useQuery(['session-exploration'])` met en cache la session au montage **sans** s'abonner à `onAuthStateChange`.
2. Quand `CreateMarcheDrawer` réussit, il appelle `queryClient.invalidateQueries(...)` pour `exploration-marcheur-steps` et `exploration-marches`. Ces invalidations + le remount de la liste des étapes (le nouveau `activeMarcheId` change la `key` du `motion.div`) déclenchent une cascade de refetch et de nouveaux montages d'enfants.
3. Pendant cette fenêtre, `supabase.auth.getSession()` peut transitoirement retourner `null` (auto-refresh de token, lecture localStorage non garantie réactive). La requête `session-exploration` étant en `staleTime: 0` est facilement re-fetched et écrase `userId` à `undefined`.
4. Une fois `userId` perdu, **aucun mécanisme ne le restaure** dans cette page : il n'y a pas d'écouteur `onAuthStateChange`. L'utilisateur doit recharger / se reconnecter.

Le hook `useAuth()` est déjà importé dans le fichier (ligne 16) et utilisé pour `isAdmin` (ligne 97). Il maintient un `user` validé côté serveur et **abonné à `onAuthStateChange`** : c'est la bonne source de vérité.

## Correction

### 1. `src/components/community/ExplorationMarcheurPage.tsx`

- **Supprimer** le `useQuery(['session-exploration'])` (lignes 74-81).
- **Récupérer** `user`, `isLoading: authLoading`, `isAdmin` depuis `useAuth()` en une seule destructuration (ligne 97).
- Remplacer `const userId = session?.user?.id;` par `const userId = user?.id;`.
- Adapter la garde d'affichage (ligne 355) pour distinguer trois états :
  - `authLoading` → petit skeleton/spinner discret (évite le flash "Connectez-vous" pendant le refresh de token).
  - `!userId` → message "Connectez-vous…" (cas réel non-authentifié).
  - sinon → onglets sensoriels.

```tsx
const { user, isLoading: authLoading, isAdmin } = useAuth();
const userId = user?.id;
...
{authLoading ? (
  <div className="text-center py-8 text-white/30 text-xs">Chargement…</div>
) : !userId ? (
  <div className="text-center py-8 text-white/40 text-sm">
    Connectez-vous pour voir et gérer vos contributions.
  </div>
) : (
  <> /* onglets inchangés */ </>
)}
```

### 2. Vérification du `useEffect` track page-view (ligne 116-120)

Ce `useEffect` appelle `trackActivity(userId!, ...)` même si `userId` est undefined. Ajouter `userId` à la garde et aux deps :

```ts
useEffect(() => {
  if (effectiveExplorationId && userId) {
    trackActivity(userId, 'page_view', `exploration:${effectiveExplorationId}`, { explorationId: effectiveExplorationId });
  }
}, [effectiveExplorationId, userId, trackActivity]);
```

### 3. Aucune autre modification nécessaire

- `CreateMarcheDrawer` reste tel quel (ses invalidations sont saines).
- Les onglets enfants (`VoirTab`, `EcouterTab`, etc.) reçoivent toujours `userId` en prop ; ils continueront de fonctionner — mais désormais `userId` ne disparaîtra plus pendant les refresh de token.

## Bénéfices

- Plus besoin de se déconnecter/reconnecter après création d'une marche.
- Robustesse globale : toute la page suit la session live (déconnexion dans un autre onglet, refresh de token, expiration) au lieu d'une photo prise au montage.
- Pas de migration DB, pas de changement de RLS, pas d'impact sur les autres pages.

## Fichiers modifiés

- `src/components/community/ExplorationMarcheurPage.tsx` (≈ 10 lignes touchées)
