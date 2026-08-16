# Prompt complet pour lt@bziiit.com — projet « Onboarding Fréquence Jardin »

Nouveauté par rapport à la version précédente : le parcours démarre **directement sur la page d'accueil** du projet dérivé. Plus besoin d'aller chercher `/jardin/demarrer`.

Copie tout le bloc ci-dessous dans le chat du projet dérivé.

---

Construis l'application **Onboarding Fréquence Jardin** : un parcours mobile-first, plein écran, une question par écran, qui amène un nouveau jardinier de « je ne sais pas par où commencer » à « voilà mon jardin et mes trois premiers gestes ».

## Page d'accueil = le parcours

La route `/` de ce projet doit ouvrir l'onboarding, sans page marketing intermédiaire.

- Remplace le contenu de la route `/` par l'écran d'accueil de l'onboarding : titre court, une phrase de promesse, un bouton unique « Commencer » plein largeur en bas d'écran (zone du pouce), et un lien discret « J'ai déjà un jardin » / « Rejoindre avec un code ».
- Garde `/jardin/demarrer` fonctionnel : il redirige vers `/` ou rend le même composant, pour ne casser aucun lien existant.
- Si un parcours est en cours (état repris depuis `localStorage`), l'accueil propose « Reprendre où j'en étais » en action principale.
- Si l'utilisateur est déjà connecté et possède une propriété, l'accueil propose d'ouvrir son jardin plutôt que de recommencer.
- Retire de la navigation du projet dérivé tout ce qui n'est pas jardin : pas de liens vers marches, CRM, IoT, admin.

## Exigence de design

Hyper soignée, inspirante, immédiatement compréhensible. Le pouce suffit.

- Une question par écran, plein écran, sans scroll sur iPhone SE. Le desktop garde la même colonne centrée, jamais élargie.
- Barre de progression fine en haut, retour discret en haut à gauche, rien d'autre. Pas de barre d'onglets pendant le parcours.
- Choix en cartes aquarelle : coins généreux, ombres basses, une seule couleur d'accent par écran, pictogrammes sobres.
- Micro-animations : apparition en cascade des choix, pulsation légère au tap, transition latérale entre questions, respiration sur l'écran de bilan.
- Thèmes existants respectés : Papier Crème en clair, Forêt Émeraude en sombre. Uniquement des tokens sémantiques, jamais de couleur en dur.

## A — Questionnaire d'initialisation

Premier écran après « Commencer » : « Où jardinez-vous ? » → balcon / terrain nu / jardin déjà en route / propriété de plaisir / entreprise / collectivité. La réponse règle les unités (m² ou bacs), les surfaces proposées et les paliers de budget pour toute la suite.

```text
1. Priorité         → fruits peu exigeants / légumes pour la famille / autonomie / beau jardin
     └─ si « légumes pour la famille » :
          1a. période de récolte (toute l'année / été seulement / hors été)
          1b. panier d'envies — grille d'images à cocher (légumes, fruits, fleurs, aromatiques),
              filtrable par saison, avec recherche
2. Temps disponible → curseur, formulé en gestes ("un samedi matin par semaine")
3. Surface & eau    → surface totale, surface encore libre, « pouvez-vous irriguer ? »
4. Style de jardin  → galerie plein écran, choix par image, pas de libellé abstrait
5. Espaces désirés  → mare, carré potager, espace de beauté, serre (multi-choix)
6. Budget           → 50 € / 500 € / 5 000 € / sans limite tant que cela me correspond
7. Bilan            → « Voilà ce que vous allez pouvoir faire »
```

### Le bilan

Écran de récompense, pas de récapitulatif administratif : un verdict en une phrase, trois à cinq gestes réalisables classés par effort, une estimation de temps et de budget, puis le bouton « Ouvrir mon jardin » qui crée la propriété via la RPC `onboard_create_propriete` et verse les réponses dans la colonne de préférences.

La création de compte n'est demandée qu'à cet instant précis, jamais avant : on ne bloque pas l'entrée du parcours par un mur d'authentification.

### Galerie de styles

Génère les visuels du choix 4 et du panier d'envies et range-les dans `src/assets/onboarding/`. Six styles : potager nourricier ordonné, jardin foisonnant naturaliste, jardin aquatique, verger-prairie, jardin de ville en bacs, jardin de beauté fleuri. Photographies lumineuses, cohérentes entre elles, format portrait, sans texte incrusté.

## B — Atelier de conception (niveau 2)

Accessible après le bilan : croquis de surface avec assolement, temps de mise en œuvre et gain estimé ; diagnostic de sol ; dessin sur cadastre ; chat expert.

## C — Implantation et suivi (niveau 3)

Diagnostic de sol actualisé, atelier cadastre, reconnaissance et suivi des maladies, chat expert.

Les niveaux B et C ne sont pas réécrits : ils pointent vers les onglets existants J'analyse, Portrait · Cadastre, Clinique du vivant et l'IA de jardin.

## Contraintes techniques strictes

- Routage : `/` rend l'onboarding, `/jardin/demarrer` reste valide. Nouveaux composants sous `src/components/onboarding/`.
- État du questionnaire dans un réducteur unique, persisté en `localStorage` pour permettre l'abandon puis la reprise, puis versé en une seule fois à la création de la propriété.
- Les réponses sont stockées dans `proprietes.onboarding_preferences` (`jsonb`), déjà créée côté base — ne crée ni table ni colonne.
- **N'écris jamais** dans `supabase/functions/**` et ne lance **aucune migration** : la base et les Edge Functions sont partagées avec le projet central, toute écriture ici écraserait la production.
- Périmètre autorisé : `src/App.tsx` (routage uniquement), `src/pages/JardinDemarrer.tsx`, `src/components/onboarding/**`, `src/components/propriete/**`, `src/hooks/propriete/**`, `src/assets/onboarding/**`. Ne touche pas au CRM, à l'IoT, aux marches ni à `/admin/*`.
- Réutilise les composants existants (`RichMap`, IA de jardin, TabAnalyze) sans les dupliquer.
- Métadonnées de page : titre et description propres à l'onboarding jardin, pas les valeurs du site central.

## Ordre de réalisation

1. Route `/` + coquille mobile-first + moteur de questionnaire (état, branchements, progression, reprise).
2. Génération des visuels, puis écrans A1 à A7.
3. Écran bilan, création de compte au dernier moment, création du jardin.
4. Ponts vers les niveaux B et C.
5. Vérification sur appareil réel, thème clair et sombre, 375 px.

---

## Ce que je fais de mon côté (projet central)

Rien à changer : la colonne `onboarding_preferences` (`jsonb`) et les RPC `onboard_create_propriete` / `onboard_join_propriete` sont déjà en place. Restent les secrets, traités demain.
