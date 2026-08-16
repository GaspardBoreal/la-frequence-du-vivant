# Onboarding Fréquence Jardin — application mobile-first

Les secrets sont reportés à demain. Ce plan couvre uniquement ce qui se construit **dans le projet dérivé « Onboarding Fréquence Jardin »**, à partir du cahier des charges.

## Intention de design

Une application qui se tient dans le pouce : une question par écran, plein écran, fond photographique, réponse en une tape, transition douce vers la suivante. Pas de formulaire, pas de barre d'onglets, pas de tableau. Une barre de progression fine en haut, un bouton retour discret, rien d'autre.

- Palette : Papier Crème en clair, Forêt Émeraude en sombre (déjà en place dans le projet).
- Cartes-choix en aquarelle, ombres basses, coins généreux, une seule couleur d'accent par écran.
- Micro-animations : apparition en cascade des choix, pulsation légère au tap, transition latérale entre questions.
- Chaque écran tient sans scroll sur un iPhone SE ; le desktop reçoit la même colonne centrée, jamais élargie.

## A — Le questionnaire d'initialisation

Sept temps, un par écran, avec branchements :

```text
1. Priorité         → fruits peu exigeants / légumes famille / autonomie / beau jardin
     └─ si « légumes famille » : période de récolte, puis panier d'envies
2. Temps disponible → curseur h/semaine, formulé en gestes ("un samedi matin")
3. Surface & eau    → surface totale, surface encore libre, irrigation possible
4. Style de jardin  → galerie plein écran, choix par image, pas de libellé abstrait
5. Espaces désirés  → mare, carré potager, espace de beauté, serre (multi-choix)
6. Budget           → 50 € / 500 € / 5 000 € / sans limite
7. Bilan            → « Voilà ce que vous allez pouvoir faire »
```

Le panier d'envies (légumes, fruits, fleurs, aromatiques) est une grille d'images à cocher, filtrable par saison, avec recherche.

### Le bilan

Écran de récompense, pas de récapitulatif administratif : un verdict en une phrase, trois à cinq gestes réalisables classés par effort, une estimation de temps et de budget, et le bouton « Ouvrir mon jardin » qui crée la propriété.

## Personae

Le questionnaire adapte son vocabulaire et ses seuils selon le profil déduit (balcon citadin, terrain nu, propriété déjà engagée, plaisir, entreprise, collectivité). Un écran d'entrée demande simplement « Où jardinez-vous ? » et la réponse règle les unités (m² ou bacs), les surfaces proposées et les paliers de budget.

## B — Atelier de conception (niveau 2)

Accessible après le bilan, réutilise l'existant du projet central : croquis de surface avec assolement, temps de mise en œuvre et gain estimé ; diagnostic de sol ; dessin sur cadastre ; chat expert.

## C — Implantation et suivi (niveau 3)

Diagnostic de sol actualisé, atelier cadastre, reconnaissance et suivi des maladies, chat expert.

Les niveaux B et C sont **branchés**, pas réécrits : ils pointent vers les onglets J'analyse, Portrait · Cadastre, Clinique du vivant et l'IA de jardin déjà en service.

## Ordre de réalisation

1. Coquille mobile-first + moteur de questionnaire (état, branchements, progression, reprise).
2. Écrans A1 à A7 avec leurs visuels.
3. Écran bilan et création du jardin via `onboard_create_propriete`.
4. Ponts vers les niveaux B et C.
5. Passage sur appareil réel, thème clair et sombre, 375 px.

## Détails techniques

- Nouveau dossier `src/components/onboarding/` dans le projet dérivé ; `src/pages/JardinDemarrer.tsx` devient le point d'entrée du parcours.
- État du questionnaire dans un réducteur unique, persisté en `localStorage` pour permettre l'abandon puis la reprise, puis versé en une fois dans la propriété créée.
- Le résultat est stocké sur la propriété (préférences, budget, temps, style, espaces souhaités) — une colonne `jsonb` dédiée est nécessaire ; la migration se fait **depuis le projet central**, jamais depuis le dérivé.
- Aucune écriture dans `supabase/functions/**` depuis le projet dérivé : base et fonctions sont partagées.
- Les images de style de jardin et du panier d'envies sont générées et rangées sous `src/assets/onboarding/`.
- Réutilisation des composants existants (`RichMap`, IA de jardin, TabAnalyze) sans duplication.

## À trancher avant vendredi

- La colonne `jsonb` de préférences : je peux la préparer côté projet central dès validation.
- Les images de la galerie de styles : génération ou photos fournies.
