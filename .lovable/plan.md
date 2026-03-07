

# Deux modes d'affichage pour le Detecteur de Zones Blanches

## Probleme

Le detecteur scanne 16 points mais n'en affiche que 5 zones blanches, sans montrer l'ensemble des resultats. Il manque une vue complete et une vue cartographique.

## Solution

Refondre la section resultats du composant `DetecteurZonesBlanches` avec deux modes : **Liste paginee** et **Carte interactive**, selectionnables via un toggle elegant.

### Mode Liste

- Affiche **toutes les 16 zones** (blanches ET documentees), triees par distance croissante depuis le point GPS
- Pagination de 4 elements par page avec controles Previous/Next
- Chaque ligne affiche : indicateur couleur (ambre = zone blanche, emeraude = documentee), nom du lieu, distance en km, nombre d'observations
- Les zones blanches ont un fond ambre subtil, les documentees un fond emeraude subtil

### Mode Carte

- Carte Leaflet (react-leaflet, deja installe) centree sur le point de recherche
- Marqueur central bleu pour la position de l'utilisateur
- CircleMarkers : ambre pour zones blanches, emeraude pour documentees
- **Tooltip au hover** : nom du lieu, distance, observations
- **Popup au clic** : widget enrichi avec nom, distance, particularite ("Aucune observation recensee" ou "X observations"), coordonnees GPS

### Toggle Liste/Carte

- Deux icones (List, Map) dans un toggle group style "segmented control"
- Transition animee entre les vues via framer-motion

### Edge function : reverse geocoder toutes les zones

Actuellement seules 3 zones blanches + 2 documentees sont reverse geocodees. Il faut labelliser les 16 points pour que les deux modes affichent des noms partout.

## Modifications techniques

### 1. `supabase/functions/detect-zones-blanches/index.ts`

- Reverse geocoder **tous les 16 points** (au lieu de 5). Les appels Nominatim sont paralleles et rapides (~50ms chacun).
- Trier par distance croissante (au lieu de blanches d'abord) -- le tri sera fait cote client selon le mode.

### 2. `src/components/zones-blanches/DetecteurZonesBlanches.tsx`

Refonte complete de la section resultats :

- Ajouter un state `viewMode: 'list' | 'map'` et un state `page` pour la pagination
- **Barre de resultats** : resume (X zones blanches sur Y scannees) + toggle List/Map
- **Vue Liste** : toutes les zones triees par distance, pagination 4/page, composant `ZoneListItem` avec design soigne (icone directionnelle, fond conditionnel, typographie Crimson)
- **Vue Carte** : composant `ZonesBlanchesMap` avec Leaflet, CircleMarkers colores, Tooltips et Popups enrichis
- Composants internes : `ZoneListItem`, `ZonesBlanchesMap`, `PaginationControls`

### 3. Aucun autre fichier a modifier

Le hook et la page Explorer restent inchanges.

## Design UX/UI

- Toggle segmented control avec fond emeraude sur l'element actif, coins arrondis, transition smooth
- Liste : cartes avec micro-ombre, hover avec elevation, badge de distance en pill arrondi, separateurs subtils
- Carte : tiles CartoDB Voyager (claires, elegantes), marqueurs avec bordure blanche et ombre, popup avec fond blanc arrondi et fleche
- Animations : stagger sur les items de liste, fade sur le changement de mode
- Responsive : la carte prend toute la largeur, hauteur 320px mobile / 400px desktop

