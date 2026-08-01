## Le problème (confirmé par la copie d'écran)

Le fond « Sat » du Scénographe monte jusqu'au zoom 24. La pile actuelle est : ortho IGN (natif déclaré z19) posée sur un relais Esri World Imagery (natif déclaré z21).

Sur cette commune, Esri n'a pas d'imagerie haute résolution : au lieu de renvoyer une erreur 404, **il renvoie une image valide (HTTP 200) portant le texte « Map data not yet available »**. Résultat :

- l'événement `tileerror` ne se déclenche jamais ;
- l'auto-dégradation de `DynamicTileLayer` (qui écoute `tileerror`) ne s'active donc jamais ;
- Leaflet continue de demander des tuiles z20/z21 « vides » au lieu d'agrandir la dernière tuile réellement photographique.

Le mécanisme actuel ne peut pas fonctionner : il attend une erreur qui n'arrive pas.

## La proposition : mesurer la couverture réelle, au lieu de la supposer

Trois garde-fous complémentaires, du plus fiable au plus universel.

### 1. Sonde de couverture Esri (le cœur de la solution)

Esri expose un service officiel d'inventaire des tuiles :
`.../World_Imagery/MapServer/tilemap/{z}/{y}/{x}/1/1` qui répond `{"data":[1]}` (tuile réelle) ou `{"data":[0]}` (pas d'imagerie).

À chaque déplacement/zoom de la carte, on interroge cette sonde sur la tuile du centre, en descendant du zoom demandé jusqu'à trouver le premier niveau réellement couvert. Ce niveau devient le `maxNativeZoom` effectif du relais — Leaflet agrandit alors proprement la dernière tuile nette au lieu d'afficher la pancarte grise.

Résultat mis en cache par zone (clé z/x/y tronquée) pour éviter tout appel répété.

### 2. Sonde IGN symétrique

Même logique côté ortho IGN, dont le natif varie de z18 à z21 selon les communes : une requête WMTS de test au niveau visé, un repli d'un cran par échec. L'IGN étant souvent plus fin qu'Esri en France rurale, on garde l'IGN au-dessus quand il est couvert et on ne bascule sur Esri que s'il ne l'est pas.

### 3. Filet de sécurité « pixel sniffing »

Pour tout fournisseur qui renverrait une tuile bidon en 200 sans tilemap disponible : à l'événement `tileload`, on échantillonne quelques pixels de la tuile sur un canvas hors écran. Une tuile quasi uniforme et désaturée (la pancarte grise) est comptée comme absente ; trois occurrences au même niveau déclenchent la dégradation du palier natif. Coût négligeable (échantillonnage 1 tuile sur 8).

### 4. Vérité affichée à l'écran

Le badge d'échelle indique déjà le facteur d'agrandissement. On l'enrichit de la source réellement lisible : « IGN z20 · image agrandie ×4 » ou « relais Esri z18 · image agrandie ×16 », plus une pastille discrète « imagerie limitée sur ce secteur » quand l'agrandissement dépasse ×8, pour que l'utilisateur sache qu'il dessine sur une image interpolée — jamais sur une pancarte.

## Détails techniques

- `src/components/maps/tileCoverageProbe.ts` (nouveau) : sonde tilemap Esri + sonde IGN, cache mémoire par (source, z, x, y), annulation des requêtes obsolètes.
- `src/components/maps/DynamicTileLayer.tsx` : abonnement à `moveend`/`zoomend` → appel de la sonde → mise à jour de `maxNativeZoom` du relais et de la couche IGN, `redraw()`, publication dans le store. Ajout du détecteur pixel sur `tileload`. Conservation de l'écoute `tileerror` existante.
- `src/components/maps/tileNativeZoomStore.ts` : ajout des champs `activeSource` (IGN / Esri) et `coverageProbed`.
- `src/components/maps/controls/ZoomScaleBadge.tsx` : affichage de la source active et de la pastille « imagerie limitée ».
- `src/components/maps/mapStyles.ts` : ajout de l'URL du service `tilemap` Esri à la constante `SATELLITE_RELAY`.

Aucun changement de comportement pour les autres cartes : la sonde ne s'active que sur le style `satellite`.
