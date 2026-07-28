## Diagnostic vérifié

- L’URL publiée `https://la-frequence-du-vivant.com/.lovable/oauth/consent?authorization_id=...` arrive bien sur l’écran de consentement de l’app.
- L’écran de consentement affiche bien le bon état quand l’utilisateur n’est pas connecté : “Connexion requise”.
- La ressource MCP expose bien l’OAuth server Supabase : `https://xzbunrtgbfbhinkzkzhf.supabase.co/auth/v1`.
- Le manifeste MCP expose bien 6 outils en OAuth protégé.
- Les logs Supabase récents ne montrent pas d’appel outil MCP authentifié : l’échec Claude arrive donc pendant l’autorisation OAuth, pas dans les outils.

## Problème le plus probable

Claude arrive à ouvrir notre consentement, puis tu arrives à l’écran “Autoriser”. Mais après le clic “Autoriser”, Claude reçoit un échec. Cela pointe vers le retour OAuth final : la réponse `approveAuthorization()` renvoie probablement une redirection que Claude ne peut pas terminer correctement, ou l’app ne sécurise pas assez ce dernier passage.

## Correction proposée

1. **Instrumenter temporairement le flux de consentement**
   - Ajouter des logs navigateur non sensibles dans `OAuthConsent.tsx` : état session, présence de `authorization_id`, présence du client OAuth, redirection reçue après approbation.
   - Ne jamais logger de token ni d’information secrète.

2. **Durcir le clic “Autoriser”**
   - Bloquer le bouton si `authorization_id` est vide.
   - Avant approbation, relire `getAuthorizationDetails()` pour vérifier que la demande est encore valide.
   - Après `approveAuthorization()`, accepter strictement `redirect_url` ou `redirect_to`, puis rediriger via `window.location.assign()`.
   - Ajouter un état d’erreur visible si Supabase renvoie une approbation sans URL de retour.

3. **Éviter que l’app pollue le retour OAuth**
   - Pendant les routes OAuth (`/.lovable/oauth/consent` et `/oauth/consent`), ne pas monter les composants globaux parasites (`AdhesionFab`, chatbots) qui ajoutent des boutons et peuvent interférer dans le navigateur intégré Claude.
   - Garder l’écran OAuth le plus minimal possible.

4. **Ajouter une page de diagnostic OAuth interne**
   - Sur erreur d’approbation, afficher un bloc copiable : étape, message Supabase, présence/absence de redirect URL, `authorization_id` masqué.
   - Objectif : si Claude échoue encore, on sait immédiatement si c’est Supabase qui refuse ou Claude qui ne suit pas la redirection.

5. **Validation**
   - Simuler le parcours publié jusqu’à l’écran “Connexion requise”.
   - Simuler avec session locale jusqu’à l’écran “Autoriser”.
   - Re-générer le manifeste MCP après modification.
   - Publier, puis relancer une nouvelle tentative Claude, car l’ancien `authorization_id` peut être expiré.

## Fichiers concernés

- `src/pages/OAuthConsent.tsx`
- `src/App.tsx`
- éventuellement `src/lib/oauthFlow.ts` si un helper de diagnostic propre est utile

Objectif : savoir précisément ce que renvoie Supabase au moment du clic “Autoriser”, puis fiabiliser le dernier saut OAuth vers Claude.