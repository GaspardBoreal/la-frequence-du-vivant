## Ce que le diagnostic montre

Vérifié en direct sur le projet :

- Le serveur MCP publié répond correctement : `/.well-known/oauth-protected-resource` renvoie bien le serveur d'autorisation Supabase.
- Le serveur d'autorisation Supabase est actif, l'enregistrement dynamique de clients (DCR) fonctionne (test réel : client créé).
- Un appel `/oauth/authorize` redirige bien vers `https://la-frequence-du-vivant.com/.lovable/oauth/consent?authorization_id=...`, et cette page répond 200 sur le domaine publié.
- Les logs de la fonction `mcp` ne montrent **aucun** appel porteur d'un jeton : Claude n'a jamais obtenu de code d'autorisation. L'échec est donc bien **avant** le consentement, au moment du renvoi vers la page de connexion — ce que confirme votre réponse.

Le maillon fragile est le passage « page de consentement → page de connexion → retour à la page de consentement ». La page de consentement décide de rediriger vers la connexion à partir d'un unique `getSession()` appelé au tout premier rendu ; si la session n'est pas encore réhydratée, ou si le retour ne se fait pas, la demande d'autorisation est perdue et l'utilisateur reste bloqué sur un écran de connexion sans indication.

## Ce qu'on met en place

1. **Ne plus perdre la demande d'autorisation**
   - Dès l'arrivée sur `/.lovable/oauth/consent`, mémoriser l'URL complète (avec `authorization_id`) en `sessionStorage`.
   - Attendre l'événement `INITIAL_SESSION` de Supabase (au lieu d'un `getSession()` unique au premier rendu) avant de conclure « non connecté » : supprime la fausse redirection quand l'utilisateur est déjà connecté.
   - Écouter `onAuthStateChange` : si la session arrive pendant que la page est ouverte, l'écran de consentement s'affiche sans rechargement.

2. **Retour garanti après connexion**
   - Sur la page de connexion, si l'utilisateur est **déjà authentifié** et qu'un `next` (ou une demande d'autorisation mémorisée) est présent, le renvoyer immédiatement vers le consentement au lieu d'afficher le formulaire.
   - Appliquer aussi le `next` aux chemins qui ne le respectent pas encore (connexion sociale / retour après confirmation email).

3. **Écran de reprise explicite**
   - Sur la page de consentement, ajouter les états manquants : « demande expirée », « vous n'êtes pas connecté avec le bon compte » (rappel de l'email attendu), et un bouton **« Reprendre l'autorisation »** qui rejoue la demande mémorisée.
   - Message clair si l'`authorization_id` n'est plus valide : inviter à relancer « Connecter » depuis Claude plutôt que laisser un écran muet.

4. **Vérification réelle avant de vous rendre la main**
   - Rejouer le parcours complet en automatisant un navigateur avec la session de Gaspard : `/oauth/authorize` → consentement → « Autoriser » → retour du code.
   - Contrôler ensuite dans les logs de la fonction `mcp` qu'un appel **avec jeton** arrive et qu'il est accepté (audience `authenticated`, revendication `client_id` présente). Si le jeton est refusé à ce stade, corriger la configuration `auth.oauth.issuer` en conséquence — mais ce point ne pourra être confirmé qu'une fois le code obtenu.

## Détail technique

Fichiers concernés : `src/pages/OAuthConsent.tsx` (attente `INITIAL_SESSION`, `onAuthStateChange`, mémorisation `sessionStorage`, états expiré / mauvais compte / reprise) et `src/pages/MarchesDuVivantConnexion.tsx` (redirection immédiate si déjà authentifié avec `next`, propagation du `next` sur tous les chemins d'authentification). Aucune modification de base de données ni de la définition MCP : la liste des outils et les règles RLS restent inchangées.

Après implémentation, il faudra **republier** avant de recliquer « Connecter » dans Claude.
