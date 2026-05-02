## Objectif

Dans `Ce que nous avons vu → La main` (pratiques emblématiques), rendre chaque photo/vidéo cliquable. L'ouverture déclenche un **lightbox mobile-first** qui présente :

1. Le média en grand (zoom plein écran, swipe entre médias d'une même pratique)
2. Une **mini-carte Leaflet** affichant tous les points GPS des marches de l'événement, avec le point de la marche d'origine **mis en valeur** (taille, couleur, halo, label)
3. Le **nom du marcheur** (auteur du média) avec micro-avatar / initiales
4. Un **slot badge** (placeholder visuel pour la future fonctionnalité de points gagnés)

## UX mobile-first

- Sheet plein écran sur mobile, dialog centré sur desktop (≥sm:640).
- Layout vertical : image (60vh max) → barre méta (auteur + badge slot) → mini-carte (h-40 mobile / h-48 desktop) → titre marche + lieu + date.
- Navigation entre médias d'une même pratique : flèches discrètes + swipe gauche/droite (touch), `Esc` pour fermer, tap sur fond pour fermer.
- Glassmorphism léger compatible thèmes Papier Crème / Forêt Émeraude (CSS vars existantes : `bg-card/95 backdrop-blur`, `border-border`).
- Les vidéos s'ouvrent avec controls natifs HTML5 (pas de carte mise en avant si vidéo, mais on garde la carte si on connaît le marche_event).

## Mini-carte

- `react-leaflet` (déjà utilisé dans `ExplorationCarteTab`).
- Tuiles OSM, zoom calculé pour englober tous les points (`fitBounds`) avec padding.
- Marqueurs :
  - **Origine** : cercle plus grand (`radius 10`), couleur primaire emerald (`#0D6B58` light / accent dark), halo pulsant subtil, popup avec titre marche.
  - **Autres marches** : petits cercles gris translucides (`radius 5`, `opacity 0.5`).
- Si une seule marche : centrage sur ce point, zoom 13.
- Si média provient du **mur Convivialité** (pas de marche associée) : la carte est masquée, on affiche à la place une bannière douce « Photo partagée sur le mur Convivialité ».

## Emplacement badge

Réservation visuelle propre, prête à brancher plus tard :
- Pastille ronde 28×28 à droite du nom auteur, état vide = pointillé `border-dashed border-muted-foreground/40` + tooltip « Badge à venir ».
- Une prop optionnelle `badge?: { icon, label, color }` est acceptée mais non utilisée pour l'instant.

## Architecture technique

**Nouveau composant** : `src/components/community/insights/curation/MediaLightbox.tsx`
- Props : `open, onOpenChange, items: MediaItem[], startIndex, marcheEventsGeo: Array<{id,title,lieu,date,latitude,longitude}>`
- État local : index courant + handlers swipe (touchstart/touchend, threshold 50px).
- Utilise `Dialog` de shadcn pour a11y / focus trap.

**Hook léger** : étendre `useExplorationAllMedia` pour exposer la liste des `marche_events` avec leurs coordonnées GPS (déjà sélectionnées via `marche_events.id, title, lieu, date_marche` ; ajouter `latitude, longitude`). Type `MarcheEventGroup` enrichi de `latitude`, `longitude`.

**Intégration dans `MainCuration.tsx`** :
- Récupérer `allMedia.events` pour construire `marcheEventsGeo`.
- Ajouter état `lightbox: { open, items, index } | null`.
- Wrapper chaque thumb dans un `<button onClick>` qui ouvre le lightbox avec les items de la pratique courante et l'index cliqué.
- Conserver le comportement existant de la grille + overlay « +N ».

**Aucune migration DB** nécessaire (latitude/longitude déjà présents sur `marche_events`).

## Fichiers touchés

```text
src/hooks/useExplorationAllMedia.ts        (étendre select + type)
src/components/community/insights/curation/MainCuration.tsx   (intégration lightbox)
src/components/community/insights/curation/MediaLightbox.tsx  (nouveau)
```

## Hors scope (préparé, non livré)

- Calcul réel des points/badges gagnés par photo (à brancher plus tard sur le slot prévu).
- Lightbox équivalent dans `OeilCuration / OreilleCuration / PalaisCuration` (le composant sera réutilisable, mais on cible uniquement « La main » pour cette itération).
