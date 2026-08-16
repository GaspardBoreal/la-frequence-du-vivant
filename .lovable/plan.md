# Plan de collaboration : isoler l'OnBoarding Fréquence Jardin de Laurent

## Objectif

Passer du mode "un seul projet, tout dans le même chat" à un mode où Gaspard Boréal continue de piloter l'ensemble du projet historique, et Laurent TRIPIED dispose d'un espace dédié pour construire l'application d'OnBoarding Fréquence Jardin sans risquer de casser les univers publics, marcheurs, admin, CRM ou IoT.

## Ce qu'on va faire maintenant (ce soir)

### 1. Créer un projet dérivé « OnBoarding Fréquence Jardin »

- Utiliser la fonction **Remix** de Lovable sur le projet actuel pour créer une copie indépendante.
- Nommer ce nouveau projet `OnBoarding Fréquence Jardin` (ou `LFDV - Onboarding FJ`).
- Placer ce projet dans le dossier **Laurent TRIPIED** du workspace.
- Inviter `lt@bziiit.com` comme **Editor** (ou Admin selon le niveau de confiance) sur ce projet uniquement.

### 2. Préserver la cohérence visuelle entre les deux projets

Exporter du projet historique et importer dans le nouveau projet :

- Les fichiers de design tokens : `src/styles/brand-kit.css`, `index.css`, `tailwind.config.ts`.
- Les composants et assets de marque Fréquence Jardin : logos, couleurs, polices (mémoire `mem://style/color-palette/light-theme-characteristics` et `dark-theme-characteristics`).
- Les composants réutilisables de base : `Button`, `Card`, `Sheet`, `Dialog`, `Popover`, `Tabs` (shadcn/ui) et les helpers `cn`, `lib/utils`.

Cela permet à Laurent de démarrer avec la même identité visuelle sans tout réécrire.

### 3. Scoper le périmètre de Laurent dans le projet dérivé

Dans le nouveau projet, on garde uniquement ce qui est nécessaire à l'OnBoarding Fréquence Jardin :

- Pages liées à l'expérience marcheur/jardin (pas l'admin, pas le CRM, pas l'IoT partenaire).
- Composants de jardin (`ProprieteTabs`, `TabObserve`, `TabAnalyze`, `TabIdentify`, etc.) si l'onboarding inclut un parcours de découverte.
- Système de connexion et profil marcheur simplifié.

On supprime ou on désactive dans le nouveau projet :

- `/admin/*` et `/admin/crm/*`
- `/admin/iot/*`
- `/partenaire-iot/*`
- `/roadmap/*` administration
- Les edge functions non pertinentes (CRM, IoT, etc.) pour alléger le projet dérivé.

### 4. Conserver la source de vérité côté données

- Le nouveau projet pointe sur **le même Supabase** (même URL, même anon key) que le projet historique.
- Les tables partagées restent communes : `community_profiles`, `properties`, `iot_*`, `crm_*`, etc.
- Les RLS existantes continuent de garantir que Laurent ne voit/modifie que les données autorisées.
- On n'ajoute pas de tables spécifiques à l'onboarding sans les documenter dans la mémoire du projet principal.

## Règles de gouvernance pour ce soir

| Rôle | Projet | Ce qu'il peut faire |
|------|--------|---------------------|
| Gaspard Boréal | Projet historique `La Fréquence du Vivant` | Tout : code, admin, CRM, IoT, marcheurs, public |
| Laurent TRIPIED | Projet dérivé `OnBoarding Fréquence Jardin` | Développer l'expérience d'onboarding Fréquence Jardin, utiliser les composants et tokens partagés |

- Gaspard reste le seul à pouvoir publier les changements du projet historique.
- Laurent peut itérer et publier sur son projet dérivé sans impacter le projet principal.
- Les deux peuvent consulter le même backend Supabase.

## Pour la suite (dès que vous activez GitHub)

### 5. Connecter les deux projets à un dépôt GitHub central

- Connecter le projet historique à un repo `la-frequence-du-vivant` (principal).
- Connecter le projet dérivé à un repo `frequence-jardin-onboarding` (dérivé), ou fusionner les deux dans le même repo avec des branches.
- Mettre en place un workflow de branches :
  - `main` : production
  - `develop` : intégration
  - `feature/onboarding-xxx` : travail de Laurent
  - `feature/iot-xxx` : travail de Gaspard
- Utiliser des Pull Requests pour réintégrer les avancées de Laurent dans le projet principal.

### 6. Organiser le workspace par dossiers

- Déplacer le projet historique dans le dossier **Gaspard Boréal** (ou le laisser dans le workspace racine s'il est le projet principal).
- Déplacer le projet dérivé dans le dossier **Laurent TRIPIED**.
- Cela permet de gérer les droits et la visibilité proprement.

## Risques et précautions

- **Conflit de base de données** : si Laurent ajoute/modifie des migrations, il faut qu'elles restent compatibles avec le projet principal. On documente chaque migration dans les deux projets.
- **Dérive du design system** : interdire de modifier les tokens CSS dans le projet dérivé. Les modifications visuelles doivent être remontées dans le projet principal.
- **Secrets et clés** : ne pas partager les clés API privées dans le chat. Utiliser les variables d'environnement Lovable et Supabase.
- **Perte de mémoire** : le projet dérivé ne contient pas les mémoires du projet principal. Il faut recopier les mémoires critiques (design tokens, règles de sécurité, terminologie).

## Livrables de ce plan

1. Projet Lovable dérivé `OnBoarding Fréquence Jardin` créé et partagé avec `lt@bziiit.com`.
2. Fichiers de design tokens et composants de base réimportés dans le projet dérivé.
3. Routes inutiles supprimées/désactivées dans le projet dérivé (admin, CRM, IoT partenaire).
4. Mémoire du projet principal mise à jour avec la règle : « OnBoarding Fréquence Jardin est développé dans le projet dérivé par Laurent TRIPIED, pas dans le projet principal. »
5. Mémoire du projet dérivé créée avec les mêmes règles de design et de sécurité que le projet principal.

## Prochaines étapes immédiates après validation

1. Créer le remix du projet.
2. Inviter Laurent.
3. Copier les tokens et composants de base.
4. Nettoyer les routes du projet dérivé.
5. Tester la connexion au même Supabase.
