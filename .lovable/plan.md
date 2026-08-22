# Test « Mot de passe oublié » via LFDV (recommandé) puis portage FJ

## Recommandation

Tester **d'abord côté LFDV** : le backend est partagé, le bouton « Mot de passe oublié ? » existe déjà sur l'écran de connexion LFDV, et le hook Resend gère déjà les emails de type `recovery`. Un seul maillon manque : la page d'atterrissage du lien email. Le portage côté Fréquence Jardin se fera ensuite, une fois le flux validé de bout en bout.

## État des lieux (vérifié)

- `MarchesDuVivantConnexion.tsx` : mode « forgot » fonctionnel → `supabase.auth.resetPasswordForEmail(email, { redirectTo: <origine>/marches-du-vivant/reset-password })`.
- `auth-email-hook` (Edge Function) : gère le type `recovery`, branding FJ/LFDV, envoi via Resend — déjà déployée.
- **Manquant** : la route `/marches-du-vivant/reset-password` n'existe pas dans `App.tsx` (seule `/admin/reset-password` existe). Aujourd'hui, cliquer le lien de l'email aboutirait à une 404.

## Étapes

1. **Créer la page de réinitialisation communautaire**
   - Nouvelle page `src/pages/MarchesDuVivantResetPassword.tsx`, sur le modèle d'`AdminResetPassword.tsx` (nouveau mot de passe + confirmation, `supabase.auth.updateUser`, toasts, visibilité mot de passe).
   - Charte « Marches du Vivant » (tokens sémantiques, pas de hardcode couleur) et redirection vers `/marches-du-vivant/connexion` après succès.
   - Ajouter la route `/marches-du-vivant/reset-password` dans `App.tsx` (lazy, comme les autres pages).

2. **Whitelister l'URL de redirection dans Supabase** (action utilisateur, 1 min)
   - Dashboard Supabase → Authentication → URL Configuration → Redirect URLs : ajouter
     - `https://la-frequence-du-vivant.com/marches-du-vivant/reset-password`
     - `https://id-preview--5039e6d4-5f58-4505-8ed8-2cbc8df469b8.lovable.app/marches-du-vivant/reset-password` (pour tester en preview)

3. **Test de bout en bout**
   - Depuis l'écran de connexion LFDV : « Mot de passe oublié ? » avec ton adresse.
   - Vérifier : email reçu via Resend (expéditeur `mail.la-frequence-du-vivant.com`, branding correct) → clic du lien → page de réinitialisation → nouveau mot de passe → connexion réussie.
   - En cas d'échec : lecture des logs de `auth-email-hook` pour identifier l'étape fautive (signature Svix, appel Resend, redirection).

4. **Portage côté Fréquence Jardin (étape suivante, repo FJ)**
   - Répliquer les deux mêmes briques dans l'app FJ : bouton « Mot de passe oublié » (`resetPasswordForEmail` avec `redirectTo` FJ) + page d'atterrissage FJ.
   - Aucune modification backend nécessaire : le hook applique déjà le branding FJ selon l'origine.

## Détails techniques

- Fichiers touchés : `src/pages/MarchesDuVivantResetPassword.tsx` (nouveau), `src/App.tsx` (1 route lazy).
- Aucune migration SQL, aucune modification du hook ou des secrets.
- Le token de récupération est consommé automatiquement par le client Supabase au chargement de la page (session `recovery` détectée par le SDK), puis `updateUser` change le mot de passe.
