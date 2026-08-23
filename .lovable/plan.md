# Réparer le lien « Réinitialiser le mot de passe » (otp_expired)

## Diagnostic (confirmé par les logs Auth)

Le flux email fonctionne (envoi Resend OK). Le blocage est côté **redirection Supabase** :

- **06:27:38** — premier clic sur le lien : `/verify` a **réussi** (303, login). Mais la redirection est tombée sur la **racine** `la-frequence-du-vivant.com` au lieu de `/marches-du-vivant/reset-password`.
- **06:31:05** — second clic : `403 « One-time token not found »` — le jeton à usage unique était déjà consommé par le premier clic. Comme l'URL de retour n'est pas reconnue, Supabase renvoie vers la racine avec `#error=access_denied&error_code=otp_expired` — exactement l'URL de ta copie d'écran.

Deux causes combinées :

1. **L'URL de redirection n'est pas dans la liste blanche Supabase.** Quand `redirect_to` n'est pas autorisé, Supabase retombe silencieusement sur le « Site URL » (la racine) — d'où l'atterrissage sur `/` au lieu de la page de réinitialisation. (C'était l'étape 2 « action utilisateur » du plan précédent, jamais validée.)
2. **Le site publié n'a pas la nouvelle page.** Le domaine `la-frequence-du-vivant.com` sert le dernier build publié : la route `/marches-du-vivant/reset-password` (créée hier) n'y existe pas encore. Même avec la whitelist, le lien tomberait sur une 404.

## Actions

### 1. Whitelister les URLs de redirection (action utilisateur, 2 min)
Dashboard Supabase → **Authentication → URL Configuration → Redirect URLs**, ajouter :
- `https://la-frequence-du-vivant.com/marches-du-vivant/reset-password`
- `https://www.la-frequence-du-vivant.com/marches-du-vivant/reset-password`
- `https://la-frequence-du-vivant.lovable.app/marches-du-vivant/reset-password`
- `https://id-preview--5039e6d4-5f58-4505-8ed8-2cbc8df469b8.lovable.app/marches-du-vivant/reset-password` (tests preview)

### 2. Publier l'application
Publier pour que la route `/marches-du-vivant/reset-password` existe sur le domaine personnalisé.

### 3. Rendre le flux résilient (code, ce chantier)
Ajouter un petit composant global `AuthHashHandler` monté dans `App.tsx` qui, au chargement de n'importe quelle page :
- détecte `#access_token=...&type=recovery` sur une mauvaise page (ex. racine) → redirige vers `/marches-du-vivant/reset-password` **en conservant le hash** (le SDK consomme ensuite la session recovery) ;
- détecte `#error=access_denied&error_code=otp_expired` → affiche un écran clair « Ce lien a expiré ou a déjà été utilisé » avec un formulaire intégré pour **renvoyer un email de réinitialisation** (au lieu d'abandonner l'utilisateur sur la page d'accueil).

Cela couvre durablement : double-clic sur le lien, pré-chargement du lien par un antivirus/webmail, URL de retour non whitelistée.

### 4. Test de bout en bout
- Nouvelle demande « Mot de passe oublié » (chaque demande invalide les liens précédents — cliquer **une seule fois** sur le lien le plus récent).
- Vérifier : email Resend → clic → atterrissage sur `/marches-du-vivant/reset-password` → nouveau mot de passe → connexion réussie.
- Surveillance des logs `auth-email-hook` en cas d'échec.

## Détails techniques

- Fichiers touchés : `src/components/auth/AuthHashHandler.tsx` (nouveau, ~60 lignes), `src/App.tsx` (montage du composant, 2 lignes).
- Aucune migration SQL, aucun changement du hook email ou des secrets.
- Le `redirectTo` côté code est déjà correct (`<origine>/marches-du-vivant/reset-password`, vérifié dans `useCommunityAuth.ts`).
- La whitelist se fait dans le dashboard Supabase (projet externe : pas d'outil de config Auth disponible ici).
