# Prompt à copier-coller dans le projet « Onboarding Fréquence Jardin »

Les secrets sont reportés. Deux arbitrages sont pris : la colonne `jsonb` de préférences est préparée depuis le projet central (voir la fin), et la galerie de styles de jardin est générée par images IA dans le projet dérivé.

Copie tout le bloc ci-dessous dans le chat du projet dérivé.

---

Construis l'application **Onboarding Fréquence Jardin** : un parcours mobile-first, plein écran, une question par écran, qui amène un nouveau jardinier de « je ne sais pas par où commencer » à « voilà mon jardin et mes trois premiers gestes ».

## Exigence de design

Hyper soignée, inspirante, immédiatement compréhensible. Le pouce suffit.

- Une question par écran, plein écran, sans scroll sur iPhone SE. Le desktop garde la même colonne centrée, jamais élargie.
- Barre de progression fine en haut, retour discret en haut à gauche, rien d'autre. Pas de barre d'onglets pendant le parcours.
- Choix en cartes aquarelle : coins généreux, ombres basses, une seule couleur d'accent par écran, pictogrammes sobres.
- Micro-animations : apparition en cascade des choix, pulsation légère au tap, transition latérale entre questions, respiration sur l'écran de bilan.
- Thèmes existants respectés : Papier Crème en clair, Forêt Émeraude en sombre. Uniquement des tokens sémantiques, jamais de couleur en dur.

## A — Questionnaire d'initialisation

Écran d'entrée : « Où jardinez-vous ? » → balcon / terrain nu / jardin déjà en route / propriété de plaisir / entreprise / collectivité. La réponse règle les unités (m² ou bacs), les surfaces proposées et les paliers de budget pour toute la suite.

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

### Galerie de styles

Génère les visuels du choix 4 et du panier d'envies et range-les dans `src/assets/onboarding/`. Six styles : potager nourricier ordonné, jardin foisonnant naturaliste, jardin aquatique, verger-prairie, jardin de ville en bacs, jardin de beauté fleuri. Photographies lumineuses, cohérentes entre elles, format portrait, sans texte incrusté.

## B — Atelier de conception (niveau 2)

Accessible après le bilan : croquis de surface avec assolement, temps de mise en œuvre et gain estimé ; diagnostic de sol ; dessin sur cadastre ; chat expert.

## C — Implantation et suivi (niveau 3)

Diagnostic de sol actualisé, atelier cadastre, reconnaissance et suivi des maladies, chat expert.

Les niveaux B et C ne sont pas réécrits : ils pointent vers les onglets existants J'analyse, Portrait · Cadastre, Clinique du vivant et l'IA de jardin.

## Contraintes techniques strictes

- Point d'entrée : `src/pages/JardinDemarrer.tsx`. Nouveaux composants sous `src/components/onboarding/`.
- État du questionnaire dans un réducteur unique, persisté en `localStorage` pour permettre l'abandon puis la reprise, puis versé en une seule fois à la création de la propriété.
- Les réponses sont stockées dans `proprietes.onboarding_preferences` (`jsonb`), déjà créée côté base — ne crée pas de table ni de colonne.
- **N'écris jamais** dans `supabase/functions/**` et ne lance **aucune migration** : la base et les Edge Functions sont partagées avec le projet central, toute écriture ici écraserait la production.
- Périmètre autorisé : `src/pages/JardinDemarrer.tsx`, `src/components/onboarding/**`, `src/components/propriete/**`, `src/hooks/propriete/**`, `src/assets/onboarding/**`. Ne touche pas au CRM, à l'IoT, aux marches ni à `/admin/*`.
- Réutilise les composants existants (`RichMap`, IA de jardin, TabAnalyze) sans les dupliquer.

## Ordre de réalisation

1. Coquille mobile-first + moteur de questionnaire (état, branchements, progression, reprise).
2. Génération des visuels, puis écrans A1 à A7.
3. Écran bilan et création du jardin.
4. Ponts vers les niveaux B et C.
5. Vérification sur appareil réel, thème clair et sombre, 375 px.

---

## Ce que je fais de mon côté (projet central)

Ajout de la colonne `onboarding_preferences` (`jsonb`, par défaut `'{}'`) sur `proprietes`, sans changement de règles d'accès : elle suit celles déjà en place sur la propriété. À faire avant que Laurent démarre vendredi.
