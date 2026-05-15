# Plan de correction

## Objectif
Empêcher tout déplacement du fond de carte lorsqu’on clique sur une observation dans la popup des espèces, afin que le focus sur les points d’observation et le tracé de marche reste strictement stable à l’ouverture comme à la fermeture.

## Ce que je vais corriger
1. Désactiver le comportement Leaflet qui re-centre automatiquement la carte à l’ouverture de la popup d’observation.
2. Conserver la popup visible et lisible sans faire bouger le fond.
3. Vérifier que la fermeture de la popup laisse exactement la carte dans son état initial.

## Implémentation
### Étape 1 — Supprimer l’auto-pan parasite
Dans `SpeciesGpsDrawer.tsx`, retirer la logique `autoPan` / `keepInView` sur la popup des marqueurs d’observation, car c’est elle qui translate la map pane au clic.

### Étape 2 — Stabiliser l’ancrage visuel de la popup
Ajuster la popup pour qu’elle s’ouvre au-dessus du marqueur avec un offset cohérent et une largeur maîtrisée, sans dépendre d’un recentrage automatique de la carte.

### Étape 3 — Préserver la lisibilité sans déplacer la carte
Si nécessaire, resserrer légèrement le gabarit interne de la popup photo (padding, hauteur d’image, grille 2x2) pour éviter qu’elle ne déborde visuellement dans les cas les plus denses, tout en gardant le même code de récupération d’images déjà unifié.

### Étape 4 — Validation ciblée
Je validerai les 3 cas suivants :
- clic sur une observation avec plusieurs photos ;
- fermeture via la croix de la popup ;
- conservation du focus sur les points d’observations et de marche après fermeture.

## Résultat attendu
- Le fond derrière les photos ne bouge plus.
- La popup s’ouvre sans faire “descendre” la vue.
- En fermant la popup, on retrouve exactement la même zone de carte et le même cadrage.

## Détails techniques
- Fichier ciblé en priorité : `src/components/community/synthese/indices/SpeciesGpsDrawer.tsx`
- Cause racine identifiée : translation de `.leaflet-map-pane` déclenchée par le `Popup` Leaflet lors de l’ouverture.
- Périmètre volontairement limité : aucune modification de la récupération des photos, du clustering, ni de `useSpeciesMarcheurPhotos`.