# Plan de correction du popup cadastre

## Diagnostic
Le problème ne vient pas seulement du `popupPane` Leaflet.
Sur cette vue, les points de marche sont rendus dans `ExplorationCarteTab` avant/après la couche cadastre, avec des `DivIcon` numérotés qui restent visuellement dominants. La capture montre que les marqueurs d’étapes traversent encore la carte popup, ce qui indique un conflit de superposition au niveau de l’assemblage des couches et du rendu des marqueurs, pas seulement du CSS du popup.

## Ce que je propose

### 1. Isoler clairement les couches Leaflet par rôle
Dans `ExplorationCarteTab`, séparer explicitement :
- la couche des points de marche
- la couche cadastre
- la couche popup cadastre

Objectif : ne plus dépendre d’un simple `z-index` global sur `.leaflet-popup-pane`, mais contrôler la hiérarchie à la source avec des `Pane` dédiés.

### 2. Déplacer les marqueurs d’étape dans un pane dédié plus bas
Créer un pane spécifique pour les points de marche avec un `z-index` strictement inférieur au popup cadastre.

Effet attendu :
- les marqueurs restent au-dessus du fond de carte
- ils passent toujours sous la fenêtre cadastre
- le comportement reste stable après rerender, changement de mode, et mobile

### 3. Attacher le popup cadastre à un pane dédié très prioritaire
Au lieu de laisser le popup reposer uniquement sur le `popupPane` global, renforcer le rendu du cadastre avec une stratégie dédiée :
- pane cadastre pour les polygones
- pane popup cadastre pour la fenêtre d’info

Objectif : éviter qu’un marqueur numéroté ou un autre overlay Leaflet reprenne la main visuellement.

### 4. Neutraliser les priorités locales qui peuvent remonter les marqueurs
Vérifier et corriger dans `ExplorationCarteTab` les priorités locales du type :
- `zIndexOffset`
- ordre de montage
- styles implicites des `DivIcon`
- éventuelles remontées lors de `setActiveMarker`, changement de style carte, preview GPS, rerender React-Leaflet

Objectif : supprimer toute remontée involontaire d’un marqueur au-dessus du popup.

### 5. Ajouter un test automatisé de non-régression
Comme demandé précédemment, mettre en place un test visuel/automatisé qui vérifie que le popup cadastre reste au-dessus :
- sur desktop
- sur mobile
- après rerender de couche / changement de mode cadastre

Le test vérifiera au minimum :
- présence du popup
- ordre visuel supérieur du popup par rapport aux points
- stabilité après interaction qui force un rerender

## Fichiers probablement concernés
- `src/components/community/exploration/ExplorationCarteTab.tsx`
- `src/components/cadastre/CadastreLayer.tsx`
- `src/components/cadastre/ParcelPopup.tsx`
- `src/index.css`
- nouveau fichier de test end-to-end ou de vérification visuelle

## Résultat attendu
Quand on clique sur une parcelle en vue cadastre :
- aucune pastille de marche ne doit passer au-dessus de la fenêtre
- la croix reste bien lisible
- le comportement reste identique sur mobile et après rerender

## Détail technique
Approche recommandée :
```text
MapContainer
├── tilePane
├── overlayPane
├── pane: marche-steps       z-index bas
├── pane: cadastre-parcels   z-index intermédiaire
├── pane: cadastre-popup     z-index haut
└── popup/tooltip strategy alignée sur ces panes
```

Je privilégie cette correction structurelle plutôt qu’un nouveau sur-empilement CSS global, car la capture montre que le bug persiste malgré le `z-index` actuel sur `.leaflet-popup-pane`.