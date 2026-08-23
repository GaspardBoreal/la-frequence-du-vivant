# Corriger définitivement le branding des e-mails FJ / LFDV

## Diagnostic vérifié

- Le test de 12:44 a bien traversé `auth-email-hook`, mais le journal serveur indique : `action=recovery`, `brand=lfdv`, `brandSource=default`, `siteUrl=https://la-frequence-du-vivant.com`.
- Le hook déployé sait déjà reconnaître `frequence-jardin.lovable.app` dans `email_data.redirect_to`. Il n'a donc **pas reçu une URL FJ exploitable** lors de ce test.
- Le code publié de Fréquence Jardin demande pourtant la récupération avec `redirectTo: ${window.location.origin}/mot-de-passe`.
- Le point de rupture se situe donc avant le rendu de l'e-mail : il faut déterminer si Supabase remplace/refuse cette redirection (configuration des URL autorisées) ou si la demande réelle part d'une autre origine. Modifier encore les couleurs ou les gabarits ne corrigera pas le problème.

## Correction proposée

### 1. Rendre le diagnostic du hook incontestable

Dans `auth-email-hook`, journaliser sans donnée personnelle ni jeton :
- présence ou absence de `email_data.redirect_to` ;
- hôte de redirection reçu ;
- hôte de `email_data.site_url` ;
- source finale de marque.

Cela permettra de distinguer immédiatement une URL absente, une URL remplacée par Supabase, ou une URL FJ correctement reçue.

### 2. Autoriser explicitement les retours Fréquence Jardin dans Supabase Auth

Dans le projet Supabase partagé, vérifier puis ajouter aux **Redirect URLs** :
- `https://frequence-jardin.lovable.app/**`
- l'URL de preview exacte du projet FJ, avec `/**`
- les futurs domaines FJ avant leur mise en production.

Conserver le `Site URL` principal LFDV : les deux applications partagent Supabase, et la marque doit être déterminée par la redirection explicite, pas par ce réglage global.

### 3. Durcir l'appel côté projet Fréquence Jardin

Dans le projet FJ :
- centraliser l'origine canonique FJ au lieu de dépendre uniquement de `window.location.origin` ;
- utiliser cette origine pour `resetPasswordForEmail` et `signUp` ;
- ajouter un marqueur non ambigu à la redirection, par exemple `?auth_brand=fj`, tout en conservant la route `/mot-de-passe` ;
- conserver `user_metadata.app = 'frequence-jardin'` à l'inscription.

Le marqueur couvre aussi les comptes historiques, comme celui d'Aurélien, qui ne possèdent pas la métadonnée FJ.

### 4. Renforcer le routeur partagé

Résoudre la marque dans cet ordre :
1. métadonnée `app=frequence-jardin` ;
2. marqueur signé par le parcours applicatif dans `redirect_to` (`auth_brand=fj`) ;
3. domaine FJ autorisé dans `redirect_to` ;
4. LFDV par défaut.

La destination du lien reste celle validée par Supabase. Aucun choix de marque ne sera accepté depuis le contenu de l'e-mail ou depuis une donnée non vérifiée hors payload Auth.

### 5. Verrouiller par des tests

Ajouter des tests unitaires du routeur couvrant :
- récupération FJ d'un ancien compte sans métadonnée ;
- inscription FJ avec métadonnée ;
- récupération et inscription LFDV ;
- redirection absente ou invalide ;
- URL de preview FJ.

Puis redéployer le hook.

### 6. Recette croisée sur les deux projets

1. Depuis `https://frequence-jardin.lovable.app`, demander la réinitialisation d'Aurélien.
2. Vérifier dans les logs : `brand=fj`, source `redirect_marker` ou `redirect_to`, hôte FJ.
3. Vérifier l'objet, le logo, le bouton et le retour vers `/mot-de-passe` de FJ.
4. Refaire une récupération depuis LFDV et confirmer `brand=lfdv`.
5. Tester une inscription neuve dans chaque application.

## Répartition des changements

- **Projet LFDV / backend partagé** : instrumentation, résolution de marque renforcée, tests, redéploiement du hook.
- **Projet Fréquence Jardin** : origine canonique et marqueur dans les URL de confirmation/récupération.
- **Configuration Supabase partagée** : ajout/contrôle des Redirect URLs FJ.

Aucune migration de base de données et aucun nouveau secret ne sont nécessaires.
