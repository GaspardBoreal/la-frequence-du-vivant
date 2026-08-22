# Finaliser l'activation du hook d'emails d'authentification

## Objectif
Activer le hook "Send Email" dans Supabase Auth et vérifier que les emails d'authentification partent via Resend avec le branding Fréquence Jardin / LFDV.

## Étapes

1. **Créer le hook Send Email**
   - Dans Auth Hooks, cliquer sur **"Add hook"** puis **"Send Email"** (ou **"Add a new hook"** → **"Send Email"**).
   - Renseigner :
     - **URL** : `https://xzbunrtgbfbhinkzkzhf.supabase.co/functions/v1/auth-email-hook`
     - **Secret** : la valeur du secret `AUTH_EMAIL_HOOK_SECRET` déjà configuré.
   - Enregistrer.

2. **Vérifier le déploiement de l'Edge Function**
   - S'assurer que `auth-email-hook` est bien déployé sur Supabase.
   - Si ce n'est pas le cas, déployer l'Edge Function `auth-email-hook`.

3. **Tester l'envoi d'un email**
   - Effectuer une action déclenchant un email auth (inscription, réinitialisation de mot de passe, magic link).
   - Vérifier la réception et le rendu du email.

4. **Vérifier les logs en cas d'échec**
   - Consulter les logs de l'Edge Function `auth-email-hook` dans Supabase pour diagnostiquer d'éventuelles erreurs.

## Livrables
- Hook Send Email activé dans Supabase Auth.
- Email de test reçu avec le bon branding.
