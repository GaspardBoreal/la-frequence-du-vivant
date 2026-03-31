
Objectif: corriger définitivement le faux état “connecté/admin” qui laisse cliquer sur “Suggérer par IA” alors que le token Supabase est invalide côté serveur.

Constat confirmé par les logs :
- La fonction `suggest-citations` répond bien, mais en `401` et non en crash.
- Les logs Auth Supabase montrent `session_not_found` sur `GET /user`.
- Donc le problème réel n’est plus l’Edge Function elle-même : c’est une session locale périmée/supprimée côté navigateur.
- Le front admin autorise encore l’accès car `useAuth()` s’appuie sur `getSession()` + RPC admin, ce qui peut laisser un “admin fantôme” tant que le token stocké localement n’a pas été invalidé côté UI.

Fichiers à corriger :
- `src/hooks/useAuth.ts`
- `src/pages/AdminFrequences.tsx`
- éventuellement `supabase/functions/_shared/auth-helper.ts` pour améliorer le diagnostic, mais la cause principale est côté front

Correctif proposé :

1. Durcir la validation d’auth admin côté front
- Dans `useAuth.ts`, ne plus considérer la session comme fiable sur la seule base de `getSession()`.
- Après récupération de session, appeler `supabase.auth.getUser()` pour valider que le token correspond encore à une session serveur active.
- Si `getUser()` échoue :
  - vider l’état `user/session/isAdmin`
  - déclencher `supabase.auth.signOut()` pour nettoyer le stockage local
  - éviter d’afficher l’interface admin comme si l’utilisateur était encore authentifié

2. Revalider l’utilisateur dans `onAuthStateChange`
- À chaque événement auth, revalider avec `getUser()` avant de lancer `checkAdminStatus`.
- Cela évite qu’un token expiré ou révoqué continue d’ouvrir `/admin/...`.

3. Bloquer proprement le bouton “Suggérer par IA”
- Dans `AdminFrequences.tsx`, avant `functions.invoke`, appeler `supabase.auth.getUser()`.
- Si l’utilisateur n’est plus valide :
  - afficher un message clair du type “Votre session a expiré, reconnectez-vous”
  - ne pas appeler l’Edge Function
- En cas de `FunctionsHttpError`, lire le corps d’erreur retourné si possible pour distinguer :
  - session expirée / token invalide
  - accès non admin
  - erreur IA réelle

4. Améliorer l’expérience utilisateur admin
- Si la session est invalide, rediriger ou réafficher le formulaire `AdminAuth` au lieu de laisser l’utilisateur dans une page admin cassée.
- Cela supprimera la boucle actuelle “clic → non-2xx status code”.

5. Diagnostic serveur optionnel
- Ajouter un log plus explicite dans `_shared/auth-helper.ts` quand `getUser()` échoue, pour voir immédiatement dans les logs si c’est :
  - header absent
  - token invalide
  - session supprimée
- Pas indispensable au correctif, mais utile pour éviter de futures ambiguïtés.

Pourquoi je pense que c’est bien la bonne cause :
- Les logs Edge indiquent `POST | 401`, pas `500`
- Les logs Auth indiquent explicitement `session_not_found`
- Le front récupère une session locale via `getSession()` mais cette session n’existe plus côté Supabase Auth
- L’Edge Function fait correctement `getUser()` et refuse donc le token

Résultat attendu après correctif :
- plus de faux accès admin avec session périmée
- message utilisateur clair au lieu de “Edge Function returned a non-2xx status code”
- “Suggérer par IA” fonctionne si la session est valide, sinon demande une reconnexion

Validation à faire ensuite :
1. Ouvrir `/admin/outils/frequences` avec une session expirée : l’UI doit forcer la reconnexion
2. Se reconnecter puis cliquer sur “Suggérer par IA” : la fonction doit répondre normalement
3. Vérifier qu’un vrai non-admin reçoit bien un refus explicite
4. Vérifier que les autres pages admin utilisant `useAuth()` bénéficient aussi du correctif
