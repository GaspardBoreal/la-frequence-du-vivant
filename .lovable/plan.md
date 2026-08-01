## 1. Bandeau gauche (herbier) redimensionnable

`ScenographeFullscreen.tsx` — l'aside est figé à 290 px.
- Poignée de glissement verticale entre l'herbier et le plan (curseur `col-resize`, filet doré au survol).
- Largeur libre entre 240 et 640 px, mémorisée dans `localStorage` (`scenographe:panelWidth`).
- Double-clic sur la poignée = retour à la largeur par défaut ; bouton replier/déplier conservé.
- L'herbier passe en grille 2 colonnes automatiquement au-delà de ~430 px (plus de vignettes visibles d'un coup).

## 2. Espèces en place : filtrer par ouvrage + poser en masse

Aujourd'hui la liste « En place » ne montre que les espèces de l'emprise de l'ouvrage courant, une par une.

**Portée (nouveau sélecteur en tête d'onglet)**
- « Cet ouvrage » (défaut) · « Ouvrages choisis… » (menu à cocher listant tous les ouvrages de la propriété avec leur métré) · « Toute la propriété ».
- Chaque fiche espèce affiche une puce d'origine (nom de l'ouvrage d'où elle vient) quand la portée dépasse l'ouvrage courant.
- Calcul par ray-casting sur chaque géométrie retenue (`classifyObservations`), fusion et dédoublonnage par nom scientifique.

**Bascule posées / non posées**
- Trois filtres rapides : Toutes · À poser · Déjà posées, avec compteurs.

**Actions de masse**
- « Tout poser » : place en une fois toutes les espèces affichées après filtre, **à leur position GPS réelle observée** (et non au centre), en ignorant celles déjà posées.
- « Tout retirer » : enlève du scénario les plantations issues de la sélection courante.
- Confirmation légère + toast récapitulatif ; un seul enregistrement du scénario (pas un par espèce).

## 3. Vue Géo / Sat en super zoom

Cause : dans `DynamicTileLayer`, `maxZoom` de la couche vaut `max(maxZoom, nativeMax)` mais le fond disparaît quand la carte dépasse la valeur transmise ; en plein écran le Scénographe pousse jusqu'à z24 tandis que les tuiles IGN sont natives à z21.
- Toujours donner à la couche un `maxZoom` supérieur ou égal au `maxZoom` de la carte (marge +2), avec `maxNativeZoom` au natif du fournisseur → Leaflet ré-échantillonne au lieu de vider le fond.
- Même traitement pour l'overlay cadastre et pour les fonds Géo (OSM z20) et Relief (z17).
- Le badge d'échelle indique « tuiles agrandies · natif z21 » au-delà du natif, pour que l'utilisateur sache qu'il travaille en interpolation.

## 4. Retrouver tous les scénarios depuis l'Atelier

Dans `OuvragesRegister.tsx` (fiche dépliée d'un ouvrage), nouveau bloc **« Scénographies »** :
- Liste des scénarios de l'ouvrage : nom, nombre de sujets, strates réunies, date, pastille dorée « Retenu ».
- Actions par ligne : Ouvrir dans le Scénographe · Renommer · Dupliquer · Retenir · Supprimer (confirmation).
- Bouton « Nouveau scénario » si aucun n'existe.
- Ouverture via le store existant `openScenographe(objetId)` — aucun nouveau chemin de données.

## Détails techniques

- Aucune migration : `propriete_ouvrage_scenarios` et le hook `useOuvrageScenarios` suffisent.
- Nouveaux fichiers : `scenographe/HerbierScopePicker.tsx`, `scenographe/PanelResizer.tsx`, `palette/OuvrageScenariosPanel.tsx`.
- Modifiés : `ScenographeFullscreen.tsx`, `HerbierPanel.tsx`, `DynamicTileLayer.tsx`, `ZoomScaleBadge.tsx`, `OuvragesRegister.tsx`.
- Les positions GPS réelles des observations sont déjà disponibles via `usePropertySpeciesPool` (waypoints), on les conserve dans les entrées d'herbier pour la pose en masse.
