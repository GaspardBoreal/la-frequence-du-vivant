## Diagnostic vérifié

- L’endpoint MCP publié est joignable et expose bien la ressource OAuth : `https://xzbunrtgbfbhinkzkzhf.supabase.co/functions/v1/mcp`.
- Le serveur OAuth Supabase est actif et publie bien `authorization_endpoint`, `token_endpoint` et `registration_endpoint`.
- La page publiée `/.lovable/oauth/consent?...` ne reste pas sur l’écran de consentement : elle affiche directement la page de connexion.
- Aucun appel récent n’arrive sur la fonction MCP avec un jeton : Claude échoue donc avant l’utilisation des outils, pendant la séquence autorisation/connexion/retour.

## Problème probable

Le flux Claude est fragile parce qu’il dépend d’un `authorization_id` transitoire et d’un retour exact après connexion. Aujourd’hui, si l’utilisateur n’est pas connecté dans le navigateur ouvert par Claude, la page consentement renvoie vers `/marches-du-vivant/connexion`, puis le retour vers le consentement dépend d’un `next` + `sessionStorage`. Dans le navigateur intégré Claude, ce stockage et/ou la session peuvent ne pas être réutilisés comme attendu, donc Claude affiche “Vous n’êtes pas encore connecté”.

## Plan de correction rapide

1. **Rendre le consentement OAuth autonome et robuste**
   - Ne plus dépendre principalement de `sessionStorage`.
   - Encoder l’URL complète du consentement dans le `next` de connexion.
   - Ajouter un fallback direct : si la page de consentement est ouverte sans session, afficher un vrai écran “Connexion requise pour Claude” avec bouton vers la connexion, au lieu d’une redirection silencieuse trop rapide.

2. **Sécuriser le retour après login**
   - Centraliser une fonction `safeNextPath()` validant strictement les chemins internes.
   - Après `signInWithPassword`, rediriger immédiatement vers `next` avant toute logique “choix d’espace / mon espace / propriété”.
   - Éviter que `AppChoiceDialog` ou les RPC post-login interceptent le flux OAuth.

3. **Ajouter un mode de reprise explicite pour Claude**
   - Sur la page de connexion, si `next` pointe vers `/.lovable/oauth/consent`, afficher un bandeau clair : “Connexion à Claude en cours”.
   - Après connexion réussie, message bref puis redirection vers l’autorisation.
   - Si l’`authorization_id` est expiré, expliquer qu’il faut relancer “Connecter” dans Claude, sans laisser croire que le compte est mal connecté.

4. **Vérifier la configuration MCP/OAuth côté serveur**
   - Re-générer le manifeste MCP après modification.
   - Déployer la fonction `mcp` si le bundle généré change.
   - Tester `/.well-known/oauth-protected-resource` et l’appel outils non authentifié/authentifié attendu.

5. **Validation finale avant publication**
   - Tester en navigation privée : ouverture d’un `authorization_id` factice → redirection login conservant `next` → retour au consentement après login.
   - Tester la page publiée après publication.
   - Puis seulement relancer “Connecter” dans Claude avec une nouvelle tentative, car l’ancien `ofid_...` peut être expiré.

## Fichiers concernés

- `src/pages/OAuthConsent.tsx`
- `src/pages/MarchesDuVivantConnexion.tsx`
- éventuellement un petit helper partagé pour `next` OAuth si cela évite la duplication
- `src/lib/mcp/index.ts` seulement si la validation montre un écart manifeste/OAuth

Objectif : faire passer Claude jusqu’à l’écran “Autoriser”, puis jusqu’au retour avec code OAuth, sans perdre l’autorisation en route.