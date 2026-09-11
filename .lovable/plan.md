# Carte du parcours en plein écran + fiche d'animation par point

Trois ajouts à la carte de préparation de `/sauniers`, pensés pour une démonstration en direct.

## 1. Mode plein écran

- Un bouton « Plein écran » sur la carte ouvre le parcours en immersion totale (fond sombre, carte bord à bord).
- Barre d'outils flottante en haut : bascule fond satellite / plan, bouton « Ajouter un point », bouton « Recentrer », compteur distance + durée, et le bouton de validation (administrateur uniquement).
- Panneau latéral escamotable avec la liste ordonnée : glisser-déposer, cocher/décocher, village / marais. Sur téléphone, ce panneau devient une feuille basse que l'on tire vers le haut.
- Fermeture par la croix ou la touche Échap ; tout le travail en cours est conservé.

## 2. Widget attaché à chaque point

Un clic sur un repère ouvre une carte flottante ancrée au point, lisible sur ordinateur, tablette et téléphone :

- **Déplacement** : glisser le repère à la main, ou mode « Placer » (on touche la carte, le point s'y pose) pour les écrans tactiles où le glisser est délicat. Les coordonnées s'affichent en direct, avec annulation du dernier déplacement.
- **Résumé** : une phrase courte tirée du récit existant (sous-titre + une ligne), plus le segment, le rang dans le parcours et la distance depuis le point précédent.
- **Bouton « Idées d'animation »** : ouvre le volet décrit ci-dessous.

## 3. Deux fois trois idées d'animation générées par IA

Le volet affiche six propositions en deux colonnes (une seule colonne empilée sur téléphone) :

- **Colonne « Ce lieu »** : 3 animations ancrées dans la caractéristique du point (le port, la salorge, la vasière…), reprenant son texte et sa matière (sel, eau, argile, vivant).
- **Colonne « Esprit Marches du Vivant »** : 3 animations issues de la démarche biodiversité — quand c'est pertinent, un geste simple d'analyse de sol (test du boudin, sédimentation en bocal, pH), un relevé d'herbier des plantes du marais, un temps d'écoute ou d'observation guidée.

Chaque idée tient en un titre, deux lignes, une durée indicative et un petit matériel nécessaire. Les propositions apparaissent une à une, façon cartes qui se retournent. Bouton « Régénérer » et copie en un clic. Les idées d'un point sont mémorisées le temps de la session pour éviter d'attendre à chaque réouverture.

Si l'IA est momentanément indisponible, un jeu d'idées de secours écrites à l'avance s'affiche, sans message d'erreur brutal.

## Détail technique

- `src/components/sauniers/ParcoursPlanner.tsx` : ajout d'un état `fullscreen` rendu dans un portail `z-[3000]`, enregistré via `fullscreenSurfaces` (`src/lib/uiOverlayLevel.ts`) pour que le chatbot reste accessible ; réutilisation de `RichMap` et des constantes `mapChrome`.
- Nouveau `src/components/sauniers/PointWidget.tsx` : carte flottante (Popup Leaflet sur desktop, feuille basse `Drawer` sous 640 px), mode « Placer » via `useMapEvents`, historique d'un cran pour l'annulation.
- Nouveau `src/components/sauniers/AnimationIdeas.tsx` + `src/hooks/sauniers/useAnimationIdeas.ts` : appel de la fonction edge, cache en mémoire par identifiant de point, états chargement / erreur / repli.
- Nouvelle fonction edge `supabase/functions/sauniers-animation-ideas` : Lovable AI Gateway (`google/gemini-2.5-flash`), entrée = nom, sous-titre, texte, segment, coordonnées ; sortie JSON strictement typée `{ lieu: Idee[3], vivant: Idee[3] }` avec `titre`, `description`, `duree`, `materiel`. Gestion explicite des codes 402 / 429, `verify_jwt = false` (page publique) et pas de données personnelles transmises.
- Idées de repli statiques dans `src/content/sauniers/animationsFallback.ts`, dérivées des quatre éléments (Sel / Eau / Argile / Vivant) déjà présents dans le récit.
- Aucune migration : rien n'est écrit en base tant que la génération des marches n'est pas validée.
