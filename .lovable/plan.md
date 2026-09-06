# Tour de Jardin — un nouvel outil d'observation dans « Mon projet »

## Ce que dit déjà le Jardin Monde DEVIAT

Lecture faite des données réelles de la propriété avant d'écrire ce plan :

- 252 espèces recensées, dont 117 plantes, 106 animaux, 4 champignons et 25 non déterminées.
- Une seule marche rattachée (« DEVIAT Jardin Monde du 11.03.26 à aujourd'hui », 30 juin 2026), dernière observation le 23 août 2026.
- Le haut du tableau est révélateur : noisetier, trèfle des prés, nigelle, et surtout un cortège d'insectes très présents — syrphe ceinturé, argus brun, azuré, myrtil, tircis, gendarme, coccinelle asiatique, punaise du chardon, escargot petit-gris.
- Côté projet : 10 objets du jardin, 1 palette végétale, 2 chantiers, 3 consultations de la clinique, 1 diagnostic de sol, 12 photos de galerie, aucune zone tracée.

Lecture professionnelle qui guidera la fiche de septembre :
- **Ce qui va bien** : forte présence de pollinisateurs et de papillons de milieu ouvert fleuri, cortège de lisière (noisetier, tircis) — le jardin fonctionne déjà comme mosaïque prairie/lisière.
- **Les manques visibles dans les données** : très peu de champignons (4) et 25 espèces non déterminées, aucun indice de bois mort ni de milieu humide dans le cortège, aucune zone du jardin cartographiée, la coccinelle asiatique (espèce exotique) figure parmi les plus notées.
- **Pistes de septembre** : compléter les taxons sous-observés (champignons d'automne, araignées, oiseaux migrateurs, chauves-souris), lever les 25 indéterminées, et documenter les leviers de résilience (bois mort, point d'eau, ourlets non fauchés, sol couvert, haie de lisière).

## Ce que vous verrez dans l'application

Nouvelle entrée « Tour de Jardin » dans le menu **Mon projet**, disponible pour toutes les propriétés.

### Écran liste
- Fil des tours de jardin, du plus récent au plus ancien.
- Filtres : un champ de recherche par mot contenu (titre, note, action) et un filtre par période (date de début / date de fin, plus des raccourcis 3 mois / 12 mois / tout).
- Chaque tour affiche sa date, son statut coloré (recommandé, planifié, en cours, fait, non retenu), son intention en une phrase et le compte d'actions faites sur le total.
- Bouton « Proposer un tour » : l'IA du jardin analyse les données de la propriété et rédige un tour complet en brouillon (statut « recommandé »).

### Écran fiche d'un tour
- En-tête : titre, date, statut modifiable, durée estimée, météo/saison visée, note libre.
- Bloc **« Ce qui va bien »** : les forces du jardin lues dans les données, formulées pour encourager.
- Bloc **« Le potentiel »** : ce qui manque encore, sans jugement, chaque manque relié à un geste concret.
- Liste des **actions clés**, chacune avec : titre, intention (observer / développer la biodiversité / renforcer la résilience), description pédagogique, moment, difficulté, et un schéma dessiné.
- Chaque action se coche comme faite, se modifie, s'ajoute, se supprime, se réordonne.
- Bouton « Enrichir avec l'IA » sur un tour existant : propose de nouvelles actions sans écraser les vôtres, vous les gardez ou les rejetez une par une.

### Schémas pédagogiques
Une petite bibliothèque de croquis dessinés dans l'application (dessin vectoriel, thème clair et sombre), rattachés aux actions par un identifiant : strates de végétation, lisière étagée, tas de bois mort, point d'eau, ourlet non fauché, sol couvert/paillage, hôtel à insectes, prairie fleurie, tas de feuilles, compost, haie champêtre, zone refuge non tondue. Une action sans schéma affiche simplement son texte.

### Le tour de septembre pour DEVIAT
Créé d'emblée en base, statut « recommandé », daté de septembre 2026, avec une dizaine d'actions issues de l'analyse ci-dessus : parcours de relevé pour actualiser les données clés (champignons, araignées, oiseaux, indéterminées), et gestes de biodiversité et de résilience adaptés aux forces déjà constatées. Il sert d'exemple vivant et reste entièrement modifiable.

## Détail technique

**Base de données** (une migration, avec les GRANT et RLS alignés sur `propriete_chantiers` / `propriete_consultations`, donc accès via `can_access_propriete`) :
- `propriete_tours` : `id`, `propriete_id`, `created_by`, `titre`, `intention`, `date_tour date`, `statut text` (`recommande|planifie|en_cours|fait|non_retenu`, défaut `recommande`), `duree_min int`, `saison text`, `points_forts jsonb[]`→`jsonb` (liste), `potentiels jsonb`, `notes text`, `source text` (`ia|manuel`), `created_at`, `updated_at` + trigger `updated_at`.
- `propriete_tour_actions` : `id`, `tour_id` (FK cascade), `titre`, `volet text` (`observer|biodiversite|resilience`), `detail text`, `schema_key text`, `moment text`, `difficulte smallint`, `done boolean default false`, `done_at`, `order_index int`, `source text`, `created_at`.
- Index sur `(propriete_id, date_tour desc)` et `(tour_id, order_index)`.
- Seed de la fiche septembre DEVIAT (`propriete_id = 664670f9-…`) dans la même migration.

**Frontend**
- `src/hooks/propriete/useProprieteTours.ts` : liste + détail + CRUD + réordonnancement + mutation de génération IA, sur le modèle de `useGardenClinique.ts` / `useProprieteChantiers.ts` (React Query, invalidations, toasts).
- `src/components/propriete/tour/` : `TourList.tsx` (filtres mot + période), `TourCard.tsx`, `TourDetail.tsx`, `TourActionRow.tsx` (édition inline, checkbox, DnD via dnd-kit déjà utilisé ailleurs), `TourStatusBadge.tsx`, `NewTourDialog.tsx`, `GardenSchema.tsx` + `schemas/` (croquis SVG par `schema_key`, tokens sémantiques uniquement).
- `src/components/propriete/tabs/TabTour.tsx` monté sur une nouvelle valeur d'onglet `tour` dans `src/pages/ProprieteEspace.tsx`, plus l'entrée « Tour de Jardin » dans le `DropdownMenu` « Mon projet » (via `handleTabChange('tour')`, donc compatible `propriete:goto-tab`).

**IA**
- Nouvelle edge function `propriete-tour-suggest` : lit `get_propriete_biodiversity`, le diagnostic sol/flore, les objets, la palette, les chantiers et les consultations de la propriété, puis appelle la passerelle Lovable AI (`google/gemini-3.7-flash`) avec sortie structurée (points forts, potentiels, actions typées avec `schema_key` choisi dans la liste fermée des croquis disponibles). Vérification JWT + `can_access_propriete` comme les autres fonctions propriété. Gestion des statuts 402/403/429 remontés en message clair.
- Rien n'est écrit sans validation implicite : la génération crée le tour en statut « recommandé », jamais « fait ».

**Contrôles finaux**
- `npx tsgo --noEmit -p tsconfig.app.json`.
- Passage navigateur sur `/propriete/jardin-monde-deviat` : liste, filtres, ouverture de la fiche septembre, ajout/suppression d'action, thème clair et sombre, largeur 375 px.
- Appel réel de l'edge function pour vérifier la génération avant de considérer le travail terminé.
