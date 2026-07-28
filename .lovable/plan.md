## Diagnostic (vérifié)

La route n'est plus en 404 — la page s'affiche. Elle reste bloquée sur « Vérification de la demande… » pour une raison précise et confirmée par lecture du code installé :

- Le projet utilise `@supabase/supabase-js` **2.52.1** (vérifié dans `package.json` et `node_modules`).
- Cette version **ne contient pas le namespace `supabase.auth.oauth`** (aucune méthode `getAuthorizationDetails` / `approveAuthorization` / `denyAuthorization` dans `auth-js` installé — vérifié par recherche dans le bundle).
- `src/pages/OAuthConsent.tsx` appelle `oauthApi().getAuthorizationDetails(...)` : l'objet est `undefined`, l'appel lève une erreur **à l'intérieur d'un `async` sans `try/catch`**, donc rien n'est affiché et le spinner tourne indéfiniment.

C'est exactement le symptôme de votre capture : pas de 404, pas de message d'erreur, spinner éternel.

## Correction

### 1. Mettre à jour le SDK Supabase
Passer `@supabase/supabase-js` de `2.52.1` à la dernière `2.x` (2.110.x), qui expose le namespace `auth.oauth` nécessaire au serveur d'autorisation OAuth 2.1. Mise à jour mineure, rétrocompatible avec l'usage actuel (auth, requêtes, RPC, realtime, storage).

### 2. Rendre l'écran de consentement incassable
Dans `src/pages/OAuthConsent.tsx` :
- envelopper tout le chargement dans `try/catch` afin qu'aucune erreur ne puisse plus laisser un spinner infini ;
- détecter explicitement l'absence du namespace `auth.oauth` et afficher un message clair plutôt que de rester muet ;
- afficher un état d'erreur lisible (message + bouton « Réessayer »).

### 3. Vérification avant publication
- Contrôle du build et du typage après montée de version.
- Chargement de `/.lovable/oauth/consent?authorization_id=test` en local : la page doit répondre par un message explicite (autorisation invalide) et non par un spinner.

### 4. Puis, côté vous
1. Publier.
2. Dans Claude, recliquer **Connecter**.
3. Sur la page de consentement, se connecter si demandé (`gaspard.boreal@gmail.com`), puis **Autoriser**.
4. Claude doit revenir aux Connecteurs avec **La Fréquence du Vivant** connecté.

Si un message d'erreur précis s'affiche à ce moment-là (au lieu du spinner), envoyez-le : il désignera directement la dernière pièce manquante côté configuration Supabase (Authorization Path ou Dynamic OAuth Apps).

## Détails techniques
- Fichiers touchés : `package.json` (version SDK), `src/pages/OAuthConsent.tsx`.
- Aucun changement de base de données, aucun nouveau secret.
- Aucun impact sur les politiques RLS : Claude continuera d'agir strictement avec les droits du compte connecté.
