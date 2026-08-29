# E-mails d'authentification par marque : ce qu'il reste à faire côté LFDV

## État vérifié dans le code

Le gros du travail demandé par le projet OFJ existe déjà :

- `auth-email-hook` lit la marque via `resolveBrand()` : `user_metadata.app === 'frequence-jardin'` en priorité, puis repli sur le domaine de `redirect_to` (marqueur `auth_brand=fj`, domaines FJ, variable `AUTH_EMAIL_FJ_DOMAINS`), sinon LFDV.
- Les **six** types d'action existent pour les **deux** marques (`_shared/email-templates/AuthEmail.tsx`) : aucun gabarit manquant.
- Le lien de confirmation conserve déjà la destination demandée par l'application : `generateConfirmationURL()` transmet `email_data.redirect_to` tel quel, et `siteUrl` est dérivé de cette même URL.
- La charte FJ est en place : vert `#0D6B58`, accent or `#C9A84C`, logo Fréquence Jardin, fond blanc.

Il ne reste donc que trois points.

## 1. Aligner la copie du `recovery` FJ sur le texte validé

Aujourd'hui le gabarit FJ `recovery` dit « Réinitialisez votre mot de passe ». Le texte attendu :

- objet : « Réinitialiser votre mot de passe — Fréquence Jardin »
- titre : « Un nouveau mot de passe pour votre jardin »
- corps : « Vous avez demandé à réinitialiser votre mot de passe. Ce lien est valable une heure. Si ce n'est pas vous, ignorez simplement cet e-mail. »
- bouton : « Choisir un nouveau mot de passe »

Le bloc `signup` FJ est déjà conforme au mot pour mot demandé — inchangé. Marque LFDV strictement inchangée.

## 2. Autoriser les URL de retour Fréquence Jardin (action à faire dans le dashboard)

Backend partagé → Authentication → URL Configuration → Redirect URLs, ajouter :

- `https://frequence-jardin.lovable.app/**`
- l'URL d'aperçu exacte du projet FJ, en `https://id-preview--<id>.lovable.app/**`, le temps de la recette

Sans cette liste blanche, Supabase ignore le `redirect_to` demandé et retombe sur le Site URL LFDV : c'est la cause de l'atterrissage dans « Mon espace ». Le `Site URL` global reste LFDV.

## 3. Redéploiement et recette

Redéployer `auth-email-hook`, puis :

1. Inscription test depuis Fréquence Jardin → e-mail marque FJ → le bouton mène à `https://frequence-jardin.lovable.app/bienvenue` puis au jardin.
2. « Mot de passe oublié » depuis FJ → e-mail FJ avec le nouveau texte → retour sur `/mot-de-passe`.
3. Inscription et réinitialisation depuis LFDV → branding LFDV inchangé, retour « Mon espace ».
4. Contrôle des logs du hook : `brand` et `brandSource` (`metadata` attendu pour les comptes FJ récents).

## Détails techniques

- Un seul fichier modifié : `supabase/functions/_shared/email-templates/AuthEmail.tsx` (bloc `fj.recovery`).
- Aucune migration SQL, aucun secret, aucun changement de la logique de résolution de marque ni du routage `redirect_to`.
- La liste blanche des redirections se fait dans le dashboard Supabase (pas d'outil de configuration Auth disponible ici) ; je fournis les valeurs exactes à coller.
