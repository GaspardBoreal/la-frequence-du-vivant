## Objectif
Ajouter un CTA élégant sur `/marches-du-vivant` invitant à explorer les marches, renvoyant vers `/marches-du-vivant/carte-marches-du-vivant?tab=carte` (haut de page).

## Emplacement
Insérer une section CTA dédiée dans `src/pages/MarchesDuVivant.tsx`, positionnée juste avant la section "Questions fréquentes" pour capter l'utilisateur après la présentation du projet.

## Design proposé
Section pleine largeur avec :
- Fond en gradient subtil (primary/5 → secondary/10) cohérent avec `CarteMdVHero` et `FinalCTA` existants
- Badge "Carte vivante" avec icône `MapPin` + point pulsant
- Titre serif large : "Explorez les marches près de chez vous"
- Sous-titre court évoquant territoires + espèces recensées
- Deux boutons : primaire "Explorer la carte des marches" (icône `Compass` + `ArrowRight`) → `/marches-du-vivant/carte-marches-du-vivant?tab=carte` avec `window.scrollTo({ top: 0 })` au clic ; secondaire "Voir l'agenda" → même page onglet `agenda`
- Micro-décoration : halos flous animés (blur-3xl) en arrière-plan, tokens sémantiques uniquement (pas de couleurs hardcodées)

## Fichier modifié
- `src/pages/MarchesDuVivant.tsx` — ajout d'un composant local `ExploreMarchesCTA` + insertion dans le flux de la page

Aucun changement backend ni de style global.
