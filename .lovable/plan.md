## Constat vérifié

- Le serveur MCP est bien déclaré avec OAuth Supabase et le manifeste pointe vers l’issuer attendu : `https://xzbunrtgbfbhinkzkzhf.supabase.co/auth/v1`.
- Le connecteur Claude atteint bien l’écran de consentement et l’utilisateur arrive jusqu’au bouton **Autoriser**.
- Les logs Supabase consultés ne montrent pas d’erreur OAuth exploitable sur les dernières 24h, ce qui indique que l’échec est probablement côté retour OAuth final / compatibilité du flux avec Claude, pas une exception serveur évidente.
- Le flux actuel utilise `supabase.auth.oauth.approveAuthorization()` côté navigateur puis redirige via l’URL retournée. C’est fragile dans le navigateur intégré Claude : si la session, les cookies, l’origine publiée ou la redirection finale ne correspondent pas exactement, Claude affiche “autorisation échouée”.

## Objectif

Rendre le connecteur Claude fiable, testable, et diagnostiquer précisément l’échec final au lieu d’afficher seulement “Problème de connexion”.

## Plan de correction

1. **Remplacer le consentement fragile par un flux OAuth minimal conforme Supabase/Claude**
   - Simplifier `OAuthConsent.tsx` pour revenir au pattern officiel :
     - charger la session,
     - si non connecté, envoyer vers `/marches-du-vivant/connexion?next=...`,
     - appeler `getAuthorizationDetails(authorization_id)`,
     - bouton **Autoriser** = appel direct `approveAuthorization(authorization_id)`,
     - redirection immédiate vers `redirect_url` / `redirect_to`.
   - Supprimer les préflight inutiles avant approbation qui peuvent consommer, expirer ou désynchroniser la demande Claude.

2. **Garantir que la connexion revient toujours vers le consentement**
   - Corriger `useCommunityAuth.signUp()` : aujourd’hui `emailRedirectTo` revient toujours sur `/marches-du-vivant/connexion`, pas vers le `next` OAuth. Même si ton cas actuel est une connexion existante, ce point doit être sécurisé pour éviter les boucles.
   - Ajouter un helper unique pour construire les URL de retour OAuth et l’utiliser dans tous les chemins de connexion concernés.
   - Ne jamais rediriger vers `/` pendant un flux Claude.

3. **Ajouter une page de résultat OAuth lisible avant retour Claude**
   - Juste avant la redirection finale, afficher un état “Autorisation validée, retour vers Claude…” pendant un très court délai contrôlé.
   - Si aucune URL de retour n’est fournie, afficher un bloc diagnostic clair : étape, client OAuth, id masqué, erreur Supabase.
   - Ne pas exposer de token ni donnée sensible.

4. **Vérifier le serveur MCP lui-même**
   - Regénérer le manifeste MCP après correction.
   - Redéployer la fonction `mcp` pour garantir que Claude voit la version actuelle du serveur.
   - Tester l’endpoint MCP publié via l’outil Supabase Edge Function pour vérifier qu’il répond et que l’auth OAuth est bien exigée, au lieu d’un échec fonctionnel.

5. **Test réel de bout en bout**
   - Tester localement la route `/.lovable/oauth/consent?authorization_id=factice` pour vérifier les états d’erreur propres.
   - Puis publier et refaire une tentative Claude avec un **nouvel** `authorization_id`.
   - Si Claude échoue encore, la page affichera enfin le diagnostic exact au lieu d’une erreur muette.

## Fichiers concernés

- `src/pages/OAuthConsent.tsx`
- `src/lib/oauthFlow.ts`
- `src/hooks/useCommunityAuth.ts`
- éventuellement `src/pages/MarchesDuVivantConnexion.tsx` si le retour `next` doit être renforcé
- `src/lib/mcp/index.ts` uniquement si le manifeste révèle un problème MCP

## Ce que je ne ferai pas

- Pas de contournement public sans OAuth : les données propriété restent protégées.
- Pas de service-role exposé au MCP.
- Pas de nouvel essai “au hasard” sans logs/diagnostic vérifiable.