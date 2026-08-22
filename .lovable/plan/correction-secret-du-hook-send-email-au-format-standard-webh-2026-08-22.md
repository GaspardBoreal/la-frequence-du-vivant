# Correction : secret du hook « Send Email » au format Standard Webhooks

## Diagnostic confirmé

- Supabase refuse la création du hook avec l'erreur `HOOK_SEND_EMAIL_SECRETS` car le secret saisi (`7b4e82a1...`) est une chaîne hexadécimale brute.
- Supabase exige le format **Standard Webhooks** : `v1,whsec_<secret_base64>`.
- Le code de l'Edge Function `auth-email-hook` est déjà compatible : `parseSecret()` supprime les préfixes `v1,` et `whsec_` puis décode le base64. **Aucune modification de code n'est nécessaire.**
- Le problème est donc uniquement la **valeur** du secret, qui doit être identique des deux côtés (Supabase + secrets Lovable).

## Étapes de correction

### 1. Générer le secret côté Supabase (action utilisateur)
- Dans le formulaire « Add Send Email hook », cliquer sur le bouton **« Generate secret »** (à droite du champ Secret).
- Supabase génère une valeur au bon format `v1,whsec_...`.
- **Copier cette valeur** (elle ne sera plus affichée ensuite).
- Cliquer sur **Save / Create hook** : la création doit passer.

### 2. Synchroniser le secret côté Lovable (outil `update_secret`)
- J'ouvre le formulaire sécurisé pour mettre à jour le secret `AUTH_EMAIL_HOOK_SECRET`.
- L'utilisateur y colle **exactement la même valeur** `v1,whsec_...` générée par Supabase.
- Sans cette synchronisation, la vérification de signature Svix échouera (« Invalid webhook signature ») et aucun email ne partira.

### 3. Redéployer l'Edge Function
- Redéployer `auth-email-hook` via `supabase--deploy_edge_functions` pour qu'elle recharge le nouveau secret au démarrage.

### 4. Test de bout en bout
- Déclencher un email réel : demande de réinitialisation de mot de passe (ou inscription test) depuis l'app.
- Vérifier dans les logs de `auth-email-hook` qu'il n'y a plus d'erreur « Missing Svix headers » / « Invalid webhook signature ».
- Vérifier la réception de l'email (envoyé via Resend depuis `mail.la-frequence-du-vivant.com`).

## Détails techniques

- Fichier concerné (lecture seule, aucun changement) : `supabase/functions/auth-email-hook/index.ts` — `parseSecret()` lignes 54-64 gère déjà le format `v1,whsec_<base64>`.
- Secrets en jeu : `AUTH_EMAIL_HOOK_SECRET` (à mettre à jour), `RESEND_API_KEY` et `FROM_EMAIL_ADDRESS` (déjà configurés, inchangés).
- Vérification de signature : HMAC-SHA256 sur `svix-id.svix-timestamp.payload`, tolérance horodatage ± 300 s.
- Les erreurs « Missing Svix headers » visibles dans les logs actuels sont des appels directs sans en-têtes Svix (le hook n'étant pas encore activé) — elles disparaîtront une fois le hook configuré.

## Hors périmètre

- Aucune migration SQL.
- Aucune modification des templates React Email ou du branding (fj/lfdv).
