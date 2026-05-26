# Analyse

## Ce que disent les vérifications

| Vérification | Résultat |
|---|---|
| Compte `auth.users` | ✅ Existe, email confirmé à 07:05:23 |
| `community_profile` | ✅ Existe (prénom="Aurélien", nom="DRIPT", rôle="marcheur_en_devenir") |
| Logs `auth` | ✅ Login OK à 07:07:06 (status 200, après 3 tentatives `invalid_credentials`) |
| Requête `/user` post-login | ✅ Retourne 200 |
| Erreurs Postgres pendant la session | ❌ Aucune |
| Références restantes à `app_role` / `has_role` | ❌ Aucune dans le front, 1 dans une edge function non liée au login |
| RLS `community_profiles` | ✅ L'utilisateur peut lire son propre profil |

**Conclusion :** la connexion réussit côté serveur. Le blocage est côté client, **après** que le token soit obtenu. Le composant `MarchesDuVivantMonEspace` reste sur l'écran « Chargement… » (rendu quand `loading || !user`).

## Causes probables, par ordre de vraisemblance

1. **Le mot de passe saisi n'est pas le bon** (tu as confirmé que c'est possible). Les 3 `invalid_credentials` dans les logs corroborent. Si la session courante stockée est issue d'un click sur le lien email de confirmation (qui ouvre `/connexion` avec un access_token dans le hash), le user est en réalité connecté — mais une re-soumission du formulaire avec un mot de passe différent déclenche une nouvelle tentative qui peut perturber l'état.
2. **Race INITIAL_SESSION** dans `useCommunityAuth.ts` (pattern documenté Lovable) : l'abonnement `onAuthStateChange` est posé avant `getSession()`, et le premier événement `INITIAL_SESSION` peut arriver avec une session non encore restaurée → `loading=false` + `user=null` → la `useEffect` de `MonEspace` redirige vers `/connexion`, puis le user réapparait → boucle visible comme un « Chargement… » figé.
3. **Profil non lu** : `fetchProfile` lance la requête via `setTimeout(0)` sans gérer l'erreur. Si la requête échoue silencieusement (auth.uid encore null au moment du fetch), `profile` reste `null` → écran « Créer mon profil » au lieu de l'espace. Pas exactement « Chargement… », mais possible si le user voit ça brièvement.

# Plan de correction (en 2 temps)

## Étape A — Désambiguïsation rapide (à faire AVANT de toucher au code)

1. **Réinitialiser le mot de passe** d'aurelien.dript via « Mot de passe oublié », saisir un mot de passe simple, retenter la connexion.
   - Si ça marche → cause #1 confirmée, aucun correctif code nécessaire.
   - Si ça reste bloqué sur « Chargement… » → on passe à l'étape B.
2. Si possible, ouvrir la console navigateur pendant le blocage et noter toute erreur rouge (404, 401, RLS, "Cannot read…").

## Étape B — Correctif code (à exécuter si A ne suffit pas)

### B1. Durcir `useCommunityAuth` contre la race INITIAL_SESSION

`src/hooks/useCommunityAuth.ts` :
- Mettre `loading` à `false` **uniquement** une fois que `getSession()` a résolu (et non plus dans chaque callback `onAuthStateChange`).
- Aligner le pattern sur celui déjà éprouvé dans `AuthContext.tsx` (drapeau `initialResolvedRef`, validation explicite via `supabase.auth.getUser()`).
- Ajouter un `console.log` temporaire `[useCommunityAuth] event=… userId=…` pour tracer l'enchaînement en cas de récidive.

### B2. Sécuriser `fetchProfile`

- Logger l'erreur si la requête `community_profiles` échoue (actuellement le `.maybeSingle()` swallow toute erreur RLS).
- Refetch profil au moins une fois si `user` est défini mais `profile` reste `null` après 1 s (filet de sécurité contre la race auth.uid).

### B3. Garde-fou navigation `MonEspace`

`src/pages/MarchesDuVivantMonEspace.tsx`, ligne 96-100 :
- N'effectuer la redirection vers `/connexion` qu'après un délai de grâce de ~500 ms post-mount, pour éviter le « ping-pong » si `loading=false` + `user=null` ne durent qu'un tick.

## Étape C — Validation

- Re-tester la connexion avec aurelien.dript (PC + mobile).
- Vérifier dans la console l'enchaînement `INITIAL_SESSION` → `SIGNED_IN` → profile chargé sans `user=null` intermédiaire.
- Confirmer que l'arrivée sur `/marches-du-vivant/mon-espace` affiche bien l'onglet Accueil sans repasser par « Chargement… » plus de 1 s.

# Détails techniques (annexe)

- Aucune migration BDD n'est nécessaire — la couche serveur est saine.
- Aucun changement aux RLS — la lecture du propre `community_profile` est déjà autorisée.
- Pas de modification de `AuthContext` (utilisé uniquement par l'admin) — le bug est isolé à `useCommunityAuth`, hook dédié à la communauté.
