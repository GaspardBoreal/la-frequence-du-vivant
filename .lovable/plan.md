
# Restructurer la page Carte des Marches du Vivant en 3 onglets

Transformer la page `/marches-du-vivant/carte-marches-du-vivant` en une expérience navigable avec 3 sous-menus (tabs), mobile-first et inspirants.

## Architecture des onglets

Barre de navigation sticky sous le titre principal (glassmorphism, icônes + labels, pastilles animées, scroll horizontal sur mobile).

### Onglet 1 — « Le Souffle du Vivant » (par défaut)
Titre inspirant proposé : **« Le Souffle du Vivant »** — sous-titre : *Ce que nos marches racontent, en chiffres vivants.*

Contenu : le hero actuel (KPI cards « Le terrain » + « Le vivant »).

### Onglet 2 — « Carte & Agenda »
Contenu : tout le bloc actuel de recherche/exploration :
- FiltersBar (recherche marche, lieu, catégories)
- ViewSwitcher (Carte / Timeline / Mur / Constellation / Liste)
- SharePanel
- Vues actives (MapView, TimelineView, etc.)

### Onglet 3 — « Marcher Ensemble »
Titre : **« Marcher Ensemble »** — deux publics, une même invitation.

Deux sections plein écran :

**a) Pour les marcheurs — « La joie de marcher à plusieurs »**
- Galerie mosaïque asymétrique (bento) avec les 10 photos fournies (`Marcheurs_01` à `12`), effets parallax léger + hover zoom
- 3 mini-témoignages / verbes d'action : *Observer · Écouter · S'émerveiller*
- CTA : « Rejoindre la communauté »

**b) Pour les propriétaires de lieux — « Ouvrez votre territoire au Vivant »**
- Bloc split-screen : photo (racines Marcheurs_07 ou plantation Marcheurs_05) + texte
- 3 bénéfices en pictos : *Valoriser · Documenter · Rassembler*
- CTA : « Référencer mon lieu »

## Bloc final commun (sur les 3 onglets)

Reprendre le bloc CTA existant en bas de page, inchangé :

> **Envie de marcher avec nous ?**  
> Rejoignez une communauté de marcheurs qui observent, écoutent, écrivent et prennent soin des territoires.
>
> [Créer mon compte marcheur] [En savoir plus]

## Détails design (mobile-first, wahouh)

- Tabs : composant custom sticky top, fond `bg-background/70 backdrop-blur-xl`, indicator animé (motion layoutId), scroll snap sur mobile
- Transitions entre onglets : `AnimatePresence` fade + slide-up 12px
- URL synchronisée via `?tab=souffle|carte|ensemble` (préserve deep-linking et partage)
- Onglet 3 : arrière-plans gradient organiques, images en `aspect-[4/5]` sur mobile, grid bento sur desktop
- Aucun changement de logique métier — pur refactor présentation

## Détails techniques

- **Upload des 10 photos via `lovable-assets`** depuis `/mnt/user-uploads/Marcheurs_*.{jpeg,jpg}` → pointeurs JSON dans `src/assets/marcheurs/`
- Nouveau fichier `src/components/carte-mdv/CarteTabs.tsx` (barre onglets sticky animée)
- Nouveau fichier `src/components/carte-mdv/tabs/SouffleTab.tsx` — wrapper hero actuel + titre inspirant
- Nouveau fichier `src/components/carte-mdv/tabs/CarteTab.tsx` — bloc filtres + ViewSwitcher + views (extrait de la page actuelle)
- Nouveau fichier `src/components/carte-mdv/tabs/EnsembleTab.tsx` — galerie marcheurs + bloc propriétaires
- Nouveau fichier `src/components/carte-mdv/FinalCTA.tsx` — bloc « Envie de marcher avec nous ? » factorisé
- Refonte de `src/pages/CarteMarchesDuVivant.tsx` : lecture `?tab=`, layout tabs + FinalCTA commun
- SEO : Helmet inchangé (même URL canonique)

Aucune modification backend, hooks, ou logique de données.
