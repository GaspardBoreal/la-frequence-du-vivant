# Réparer les emails d'authentification (hook Resend)

## Diagnostic confirmé par les logs

Deux problèmes distincts, visibles dans les logs :

1. **Erreur 500 « Missing Svix headers »** (06:06 et 06:10) : Supabase appelle bien le hook, mais il envoie les en-têtes de signature au format **Standard Webhooks** (`webhook-id`, `webhook-timestamp`, `webhook-signature`), alors que l'Edge Function `auth-email-hook` attend l'ancien nommage **Svix** (`svix-id`, `svix-timestamp`, `svix-signature`). La vérification échoue donc avant même l'envoi à Resend.
2. **Erreur 429 « email rate limit exceeded »** (06:11 et 06:12) : les tentatives répétées ont épuisé le quota horaire d'emails d'authentification de Supabase (limite par défaut très basse, quelques emails/heure).

Bonnes nouvelles : les 3 secrets (`AUTH_EMAIL_HOOK_SECRET`, `RESEND_API_KEY`, `FROM_EMAIL_ADDRESS`) sont bien configurés — l'erreur survient après leur vérification. La signature HMAC et l'appel Resend n'ont jamais été atteints.

## Actions

### 1. Corriger le nommage des en-têtes dans le hook
Fichier `supabase/functions/auth-email-hook/index.ts` :
- Lire d'abord `webhook-id` / `webhook-timestamp` / `webhook-signature`, avec **repli** sur `svix-id` / `svix-timestamp` / `svix-signature` (compatibilité des deux formats).
- Ajouter les noms `webhook-*` dans les en-têtes CORS autorisés.
- La logique de signature (HMAC-SHA256 sur `id.timestamp.payload`, préfixe `v1,`) est déjà conforme au standard : aucun autre changement.

### 2. Redéployer l'Edge Function
Redéploiement de `auth-email-hook` pour prendre en compte le correctif.

### 3. Augmenter le quota d'emails d'authentification
Via la configuration Auth de Supabase : passer la limite d'envoi d'emails de la valeur par défaut (~2-4/heure) à **100/heure** — confortable pour les inscriptions et réinitialisations réelles, tout en restant protégé contre les abus. Effet immédiat : le test pourra être refait sans attendre la fin de la fenêtre horaire.

### 4. Test de bout en bout
- Refaire « Mot de passe oublié » avec `gaspard.boreal@gmail.com`.
- Surveiller les logs de l'Edge Function : on doit voir la vérification de signature réussir puis l'appel Resend aboutir (`{ sent: true }`).
- Vérifier la réception de l'email (expéditeur `mail.la-frequence-du-vivant.com`) et le fonctionnement du lien vers la page de réinitialisation.

## Détails techniques
- Aucune migration SQL, aucune modification de schéma.
- Un seul fichier de code modifié : `supabase/functions/auth-email-hook/index.ts`.
- Le changement de limite se fait via l'outil de configuration Auth (pas de manipulation manuelle dans le dashboard).
- Si le test révèle une erreur suivante (ex. rejet Resend), les logs de la fonction donneront le message exact et on corrigera dans la foulée.
