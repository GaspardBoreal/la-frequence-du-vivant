# Runbook : projet dérivé « OnBoarding Fréquence Jardin » — étape par étape

Ordre logique : on sécurise le socle central **avant** de créer le projet de Laurent. Chaque étape se termine par une vérification. Si une vérification échoue, on ne passe pas à la suivante.

Durée estimée : environ 1 h 30 pour les étapes 1 à 6 (Gaspard, projet central), puis Laurent est autonome.

---

## Étape 1 — Socle base de données (projet central, Gaspard)

Objectif : rendre l'onboarding possible sans jamais ouvrir `proprietes` ni `propriete_marcheurs` en écriture directe.

Une seule migration, contenant :

**1a. Table `propriete_invitations`**

Colonnes : `propriete_id`, `code` (texte unique, 8 caractères lisibles), `role` (`prestataire` ou `lecture` uniquement), `expires_at` (défaut : 7 jours), `created_by`, `consumed_by`, `consumed_at`.
GRANTs : `SELECT, INSERT, UPDATE` à `authenticated`, `ALL` à `service_role`. Pas d'accès `anon`.
RLS : lisible et créable uniquement par un gestionnaire de la propriété concernée (via `can_access_propriete`) ou un admin. Personne ne peut lire les codes d'une propriété à laquelle il n'a pas accès.

**1b. RPC `onboard_create_propriete(_nom, _ville, _code_postal, _latitude, _longitude)`**

`SECURITY DEFINER`, `SET search_path = public`. Logique :

1. Refuser si `auth.uid()` est nul.
2. Résoudre le `community_profiles.id` de l'appelant ; refuser s'il n'en a pas.
3. Garde-fou : refuser si l'appelant a déjà créé 3 propriétés dans les dernières 24 h (`created_by` + `created_at`).
4. Garde-fou : refuser si une propriété active de même `nom` + `code_postal` existe déjà pour ce profil.
5. `INSERT` dans `proprietes` : `main_walker_id` = profil appelant, `created_by` = `auth.uid()`, `is_active = true`, slug dérivé de `nom` via `f_unaccent` avec suffixe court en cas de collision.
6. `INSERT` dans `propriete_marcheurs` : `role = 'proprietaire'`, `is_main = true` si c'est sa première propriété.
7. Retourner `id`, `nom`, `slug`.

Aucun `UPDATE` ni `DELETE` sur une ligne existante : la fonction ne peut que créer.

**1c. RPC `onboard_join_propriete(_code)`**

`SECURITY DEFINER`. Logique :

1. Refuser si `auth.uid()` est nul ou sans profil communautaire.
2. Chercher l'invitation par `code`, non consommée, non expirée.
3. Si introuvable, expirée ou déjà consommée : renvoyer **la même erreur générique** (« code invalide ») dans les trois cas — pas d'énumération possible.
4. Refuser si le lien existe déjà (idempotence propre).
5. `INSERT` dans `propriete_marcheurs` avec le rôle porté par l'invitation, `is_main = false`. Le rôle `proprietaire` est explicitement interdit ici.
6. Marquer l'invitation consommée (`consumed_by`, `consumed_at`).
7. Retourner `id`, `nom`, `slug` de la propriété.

**1d. RPC `create_propriete_invitation(_propriete_id, _role)`**

`SECURITY DEFINER`, réservée à un gestionnaire de la propriété ou un admin (contrôle par `can_access_propriete` + vérification du rôle `proprietaire`). Génère le code, expire à 7 jours, le retourne.

`GRANT EXECUTE` des quatre fonctions à `authenticated` uniquement.

**Vérification obligatoire avant de continuer** — avec un compte non-admin de test :

- `onboard_create_propriete` crée bien un jardin, visible ensuite dans `get_user_apps_access`.
- `onboard_join_propriete('XXXXXXXX')` avec un code bidon renvoie « code invalide ».
- `onboard_join_propriete` avec un code valide rattache, et un second appel avec le même code échoue.
- Un `INSERT` direct dans `proprietes` depuis un compte non-admin est toujours refusé.

---

## Étape 2 — URLs de redirection Supabase (projet central, Gaspard)

Avant même de créer le projet dérivé : dans les réglages d'authentification Supabase, ajouter l'URL de prévisualisation du futur projet Laurent aux **Redirect URLs**. Sans cela, confirmation d'email et réinitialisation de mot de passe renverront vers le mauvais domaine.

À faire une fois l'URL connue, donc juste après l'étape 3 — mais ne pas l'oublier.

---

## Étape 3 — Créer le projet dérivé (Gaspard, 5 min)

1. Remix du projet actuel.
2. Renommer en `OnBoarding Fréquence Jardin`.
3. Le déplacer dans le dossier workspace **Laurent TRIPIED**.
4. Revenir à l'étape 2 avec l'URL de prévisualisation obtenue.

Ne pas encore inviter Laurent : on nettoie d'abord.

---

## Étape 4 — Nettoyer le projet dérivé (Gaspard, 20 min)

Dans le projet dérivé uniquement :

**Supprimer le dossier `supabase/functions/` en entier.** C'est le geste de sécurité le plus important du runbook : il rend impossible tout redéploiement accidentel d'une edge function de production depuis le projet de Laurent.

Supprimer ensuite les routes et pages hors périmètre :

- `/admin/*`, `/admin/crm/*`, `/admin/iot/*`
- `/partenaire-iot/*`, `/trust-in-frequence-vivant`
- `/roadmap/*`
- Pages éditoriales publiques : Dordonia, Traversées, Livre Vivant, Galerie Fleuve, études de sol publiques, matériel pédagogique

Conserver strictement :

- `src/integrations/supabase/client.ts` **inchangé** (même backend, donc mêmes identifiants)
- `AuthContext`, `useAuth`, `useUserAppsAccess`
- Design tokens : `index.css`, `tailwind.config.ts`, `brand-kit.css`, shadcn/ui, `lib/utils`
- Assets de marque Fréquence Jardin
- Composants de jardin et IA de Jardin (voir étape 5)

**Vérification** : le projet dérivé se lance, la connexion avec un compte existant de La Fréquence du Vivant fonctionne, et « Mes jardins » affiche les propriétés du compte.

---

## Étape 5 — Câbler l'IA de Jardin en appel seul (Gaspard, 15 min)

Conserver dans le projet dérivé le front de l'IA : `ProprieteChatBotMount`, `ChatBot`, `useChatStream`, `useChatPageContext`, `useChatImage`, `useProprieteChatProviders`, la Console de contextes, `GardenFocusBanner`, `OuvragesContextPicker`, `ChatTableBlock`.

L'appel se fait par `supabase.functions.invoke('propriete-chat')` vers le projet central. Rien à durcir côté sécurité : la fonction exige déjà un JWT valide puis appelle `can_access_propriete(proprieteId)`, donc un utilisateur n'obtient de réponse que sur un jardin auquel il a réellement accès.

Prompt système, protocole scientifique, quotas et contextes serveur restent exclusivement dans le projet central.

**Vérification** : depuis le projet dérivé, poser une question à l'IA sur un jardin accessible → réponse. Poser la même question en forçant l'identifiant d'un jardin non accessible → refus.

---

## Étape 6 — Écran de lancement et parcours d'onboarding (Gaspard pose la structure, Laurent l'habille)

Écran d'accueil après connexion, trois branches :

```text
  Bienvenue

  [ Créer mon jardin ]     → formulaire → onboard_create_propriete
  [ Rejoindre un jardin ]  → saisie du code → onboard_join_propriete
  [ Mes jardins ]          → get_user_apps_access (déjà existant)
```

Si l'utilisateur a déjà au moins un jardin, « Mes jardins » est la branche par défaut.

Le formulaire de création reste minimal : nom, ville, code postal, position sur la carte. Tout le reste (sol, flore, ouvrages) se remplit ensuite dans le parcours en 5 étapes existant.

---

## Étape 7 — Ouvrir l'accès à Laurent (Gaspard, 2 min)

Inviter `lt@bziiit.com` en **Editor** sur le projet dérivé uniquement — via le bouton Partager du projet, jamais via Settings > People (qui donnerait accès à tous les projets du workspace).

---

## Étape 8 — Poser les règles dans la mémoire des deux projets

Projet central : consigner que l'onboarding Fréquence Jardin vit dans le projet dérivé, et que les RPC `onboard_*` et `propriete_invitations` lui sont dédiées.

Projet dérivé : recopier les règles cardinales — thèmes clair/sombre, terminologie « Fréquences » et « Observations », `SpeciesName` obligatoire, `supabase.auth.getUser()`, sobriété informationnelle — et surtout la règle d'or :

> Interdiction absolue de créer ou modifier une table, une policy, un trigger ou une edge function. Toute évolution backend passe par une demande à Gaspard sur le projet central.

---

## Garde-fous permanents

| Interdit dans le projet dérivé | Pourquoi |
|---|---|
| Migration SQL, RLS, trigger | Le schéma est partagé avec la production |
| Déployer une edge function | Écraserait `propriete-chat`, IoT, CRM en production |
| Écrire en direct dans `proprietes` ou `propriete_marcheurs` | Les RLS l'empêchent déjà ; passer par les RPC `onboard_*` |
| Modifier les design tokens | Ferait diverger l'identité visuelle |
| Rattacher un jardin sans code d'invitation | Ouvrirait la lecture du registre de sol et de la télémétrie d'autrui |
| Publier sur les domaines de production | Réservé au projet central |

---

## Ordre d'exécution résumé

1. Migration : `propriete_invitations` + 3 RPC + GRANTs → tester avec un compte non-admin
2. Remix, renommage, déplacement dans le dossier Laurent TRIPIED
3. Ajouter l'URL du projet dérivé aux Redirect URLs Supabase
4. Supprimer `supabase/functions/` et les routes hors périmètre
5. Vérifier connexion + « Mes jardins » + appel IA de Jardin
6. Construire l'écran de lancement à trois branches
7. Inviter `lt@bziiit.com` en Editor
8. Écrire les mémoires des deux projets

Étapes 1 à 5 : sécurité et socle, à ne pas paralléliser. Étapes 6 à 8 : rapides, enchaînables.
