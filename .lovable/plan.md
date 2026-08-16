# Plan de collaboration : projet dérivé « OnBoarding Fréquence Jardin » pour Laurent TRIPIED

## Objectif

Gaspard Boréal continue de piloter l'ensemble du projet historique (public, marcheurs, admin, CRM, IoT, IA). Laurent TRIPIED dispose d'un projet Lovable dédié pour construire le parcours d'onboarding Fréquence Jardin, avec trois capacités : appeler l'IA de Jardin, connecter les utilisateurs avec leurs identifiants habituels, et amorcer une propriété (nouvelle ou existante) — le tout sans jamais pouvoir perturber l'univers La Fréquence du Vivant.

## Principe directeur de sécurité

Le projet dérivé est un **consommateur** de la plateforme, jamais un co-propriétaire.

```text
  Projet central (Gaspard)              Projet OnBoarding (Laurent)
  ------------------------              ---------------------------
  définit le schéma                     lit / écrit via RPC autorisées
  définit les RLS                       subit les RLS, ne les change pas
  déploie les edge functions            appelle les edge functions
  fait évoluer l'IA de Jardin           appelle l'IA de Jardin
```

Règle non négociable : **aucune migration SQL, aucune modification de RLS, aucun déploiement d'edge function depuis le projet dérivé.** Toute évolution backend est demandée à Gaspard et réalisée dans le projet central.

## Ce qu'on fait ce soir

### 1. Créer le projet dérivé

- **Remix** du projet actuel → nouveau projet `OnBoarding Fréquence Jardin`.
- Le placer dans le dossier workspace **Laurent TRIPIED**.
- Inviter `lt@bziiit.com` en **Editor** sur ce projet uniquement (pas sur le workspace, sinon il voit tous les projets).

### 2. Connexion avec les mêmes identifiants

Le projet dérivé conserve `src/integrations/supabase/client.ts` **inchangé** : même URL projet, même clé publiable. Conséquence directe : un utilisateur qui a déjà un compte sur La Fréquence du Vivant se connecte avec exactement les mêmes identifiants, sans double inscription. `auth.users`, `community_profiles`, les rôles et les propriétés sont partagés.

Points d'attention :

- Ajouter l'URL du projet dérivé dans les **Redirect URLs** Supabase (sinon la confirmation d'email et le reset renverront vers le mauvais domaine).
- Ne pas dupliquer la logique de session : réutiliser `AuthContext` / `useAuth` tels quels.
- Ne créer aucune table de profil parallèle : `community_profiles` reste la source unique.

### 3. IA de Jardin en lecture seule d'usage

Laurent peut **appeler** l'IA, pas la faire évoluer.

Ce qu'on recopie dans le projet dérivé (code front uniquement) :

- `ProprieteChatBotMount`, `ChatBot`, `useChatStream`, `useChatPageContext`, `useChatImage`
- `useProprieteChatProviders` et la Console de contextes
- `GardenFocusBanner`, `OuvragesContextPicker`, `ChatTableBlock`

Ce qui reste exclusivement dans le projet central :

- L'edge function `propriete-chat` (prompt système, protocole scientifique, addendum télémétrie)
- Les quotas et `consume_iot_ai_credit`
- Toute modification du prompt ou des contextes serveur

L'appel se fait via `supabase.functions.invoke('propriete-chat')` sur le même backend. La sécurité est déjà en place et vérifiée : la fonction exige un JWT, puis appelle `can_access_propriete(proprieteId)` — un utilisateur ne peut donc obtenir de réponse que sur une propriété à laquelle il a réellement accès. Rien à durcir côté IA.

### 4. Écran de lancement : nouvelle propriété ou propriété existante

À la connexion, l'utilisateur choisit :

```text
  Bienvenue

  [ Créer mon jardin ]        → onboarding d'une nouvelle propriété
  [ Rejoindre un jardin ]     → rattachement à une propriété existante
  [ Mes jardins ]             → liste issue de get_user_apps_access (si déjà rattaché)
```

La liste « Mes jardins » s'appuie sur la RPC existante `get_user_apps_access`, qui renvoie déjà `proprietesAccessibles` avec rôle et propriété principale. Rien à créer pour cette branche.

## Le point dur : création et rattachement de propriété

Vérification faite en base : aujourd'hui, la table `proprietes` porte la policy `Proprietes gerees par admin` (ALL, `is_current_user_admin()`), et `propriete_marcheurs` porte `Liens marcheur admin` (ALL, admin). **Un utilisateur non-admin ne peut donc ni créer une propriété, ni se rattacher à une propriété.** L'onboarding en libre-service est structurellement impossible en l'état.

Ouvrir ces tables en écriture directe serait la faille à ne pas créer : n'importe quel compte pourrait s'auto-rattacher à Jardin Monde DEVIAT ou à Maison sous Blossac et lire tout le registre de sol, les médias et la télémétrie associée.

### Solution retenue : deux RPC `SECURITY DEFINER` étroites, écrites dans le projet central

**A. `onboard_create_propriete(nom, ville, code_postal, geom)`**

- Refuse si `auth.uid()` est nul ou si l'appelant n'a pas de `community_profiles`.
- Crée la propriété avec `main_walker_id` = profil de l'appelant, `is_active = true`, slug généré via l'unaccent existant.
- Crée le lien `propriete_marcheurs` (`role = 'proprietaire'`, `is_main` si c'est sa première).
- **Garde-fou anti-abus** : maximum 3 propriétés créées par utilisateur et par 24 h, et refus si un jardin au même nom + même code postal existe déjà pour ce profil.
- Ne touche à aucune propriété existante : `INSERT` seulement, jamais `UPDATE`.

**B. `onboard_join_propriete(code_invitation)`**

Le rattachement se fait **par code d'invitation**, pas par recherche libre. C'est le choix le plus sûr : sans le code, une propriété est invisible et injoignable.

- Le gestionnaire d'un jardin génère un code à durée de vie limitée (7 jours) depuis l'espace propriété.
- `onboard_join_propriete` valide le code, vérifie qu'il n'est ni expiré ni consommé, crée le lien `propriete_marcheurs` avec le rôle porté par l'invitation (`prestataire` ou `lecture` — jamais `proprietaire`), et marque le code consommé.
- Aucune énumération possible : un code invalide renvoie la même erreur générique qu'un code expiré.

Cela suppose une petite table `propriete_invitations` (propriete_id, code, role, expires_at, consumed_by, consumed_at) avec ses GRANTs et ses RLS, créée dans le projet central.

**Alternative si vous préférez le contrôle humain** : remplacer le code par une demande de rattachement soumise à validation du gestionnaire. Plus lent, plus sûr encore. Dites-le moi et j'ajuste.

### Ce que Laurent ne peut pas faire, par construction

- Créer, modifier ou supprimer une table, une policy ou un trigger.
- Écrire directement dans `proprietes`, `propriete_marcheurs`, `propriete_soil_diagnostics`, `iot_*` ou `crm_*`.
- Se rattacher à une propriété sans code valide.
- Modifier le prompt ou les quotas de l'IA de Jardin.
- Publier quoi que ce soit sur les domaines de production de La Fréquence du Vivant.

## Nettoyage du projet dérivé

Supprimer du projet de Laurent tout ce qui n'appartient pas à l'onboarding, pour réduire la surface d'erreur et le poids du build :

- Routes `/admin/*`, `/admin/crm/*`, `/admin/iot/*`, `/partenaire-iot/*`, `/roadmap/*`
- Pages publiques éditoriales (Dordonia, Traversées, Livre Vivant, Galerie Fleuve, études de sol publiques)
- Le dossier `supabase/functions/` en entier : le projet dérivé n'en déploie aucune, il appelle celles du projet central

Conserver : design tokens (`index.css`, `tailwind.config.ts`, `brand-kit.css`), shadcn/ui, `lib/utils`, assets de marque Fréquence Jardin, `AuthContext`, `useUserAppsAccess`, les composants de jardin et l'IA de Jardin.

## Cohérence de la mémoire projet

- Dans le projet central : consigner que l'onboarding Fréquence Jardin est développé par Laurent dans le projet dérivé, et que les RPC `onboard_*` lui sont dédiées.
- Dans le projet dérivé : recopier les règles cardinales — thèmes clair/sombre, terminologie « Fréquences » et « Observations », `SpeciesName` obligatoire, `supabase.auth.getUser()`, sobriété informationnelle, interdiction absolue de migration SQL.

## Détails techniques

| Élément | Où il vit | Qui le modifie |
|---|---|---|
| Schéma, RLS, GRANTs | Projet central | Gaspard |
| Edge functions (`propriete-chat`, IoT, CRM) | Projet central | Gaspard |
| RPC `onboard_create_propriete`, `onboard_join_propriete` | Projet central | Gaspard |
| Table `propriete_invitations` | Projet central | Gaspard |
| Écran de bienvenue, parcours onboarding, UI | Projet dérivé | Laurent |
| Composants IA de Jardin (front) | Projet dérivé (copie) | Laurent, sans toucher au serveur |
| Design tokens | Projet central, recopiés | Gaspard uniquement |

Backend partagé : projet Supabase `xzbunrtgbfbhinkzkzhf`, identique pour les deux projets.

## Séquence d'exécution

1. Créer dans le projet central la table `propriete_invitations` et les deux RPC `onboard_*`, avec GRANTs, RLS et garde-fous anti-abus.
2. Tester les RPC avec un compte non-admin : création OK, rattachement sans code refusé, rattachement avec code OK.
3. Remixer le projet, le déplacer dans le dossier Laurent TRIPIED, inviter `lt@bziiit.com` en Editor.
4. Nettoyer le projet dérivé (routes, edge functions, pages hors périmètre).
5. Ajouter l'URL du projet dérivé aux Redirect URLs Supabase.
6. Construire l'écran de bienvenue à trois branches et le parcours d'onboarding.
7. Vérifier de bout en bout : connexion avec un compte existant, création d'un jardin, appel de l'IA de Jardin sur ce jardin.

## Pour la suite

Quand vous aurez le temps, connecter les deux projets à GitHub avec des branches par fonctionnalité et des Pull Requests, pour réintégrer proprement le travail de Laurent dans le projet central.
