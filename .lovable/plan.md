## Ce qui se passe réellement

**1. Le satellite est noir en super zoom — cause confirmée par test des tuiles**

J'ai interrogé le serveur IGN sur la zone de la propriété (Deviat) :

```text
z18  →  200 OK    (image)
z19  →  200 OK    (image)
z20  →  404 Not Found
z21  →  404 Not Found
```

Le fichier `mapStyles.ts` déclare l'ortho IGN native jusqu'à **z21**. Le Scénographe ouvre la carte à **z20** et autorise z24. Leaflet demande donc de vraies tuiles z20/z21 → 404 → **aucune image, fond noir**. Ce n'est pas un problème de `maxZoom` de couche : c'est un `maxNativeZoom` déclaré trop haut. Le ré-échantillonnage promis ne se déclenche jamais parce que Leaflet croit que ces niveaux existent.

Test comparatif effectué : le fond Esri World Imagery répond bien en z20 et z21 au même endroit.

**2. L'ouvrage n'est pas sélectionnable**

Dans `ScenographeFullscreen.tsx`, l'emprise est dessinée par un `<GeoJSON>` purement décoratif (trait doré pointillé, `fillOpacity 0.06`), sans gestionnaire d'événement, et **seul l'ouvrage courant** est tracé. Rien sur le plan ne permet de le désigner, ni de basculer vers un ouvrage voisin : le Scénographe est verrouillé sur l'`objetId` reçu à l'ouverture.

---

## Correction proposée

### A. Un fond satellite qui ne tombe jamais en panne

1. **Dire la vérité sur le zoom natif** : ortho IGN à `maxNativeZoom: 19` (valeur réellement servie), OSM à 19, relief à 17. Au-delà, Leaflet agrandit la dernière tuile nette au lieu de demander du vide.
2. **Relais automatique** : ajouter un fond de secours **Esri World Imagery** (natif jusqu'à z21) posé *sous* l'ortho IGN en mode Sat. On garde la finesse et la couleur IGN là où elle existe (≤ z19), et au-delà l'image reste lisible grâce au relais — plus jamais d'écran noir.
3. **Filet de sécurité** : écoute de l'événement `tileerror` ; au premier échec répété d'un niveau, la couche redescend son `maxNativeZoom` d'un cran et se rafraîchit — donc la carte s'auto-corrige sur n'importe quelle commune, y compris là où l'IGN monte réellement à z21.
4. `ZoomScaleBadge` affiche le vrai palier (« natif z19 · image agrandie ×4 ») et la source réellement affichée (IGN ou relais).

### B. Sélectionner et changer d'ouvrage sans quitter le plan

1. **Toutes les emprises deviennent visibles** : l'ouvrage travaillé garde son trait doré plein ; les autres ouvrages de la propriété apparaissent en trait fin discret.
2. **Emprises cliquables** : survol → halo doré + infobulle (nom, métré, nombre de sujets posés) ; clic sur un ouvrage secondaire → le Scénographe bascule dessus (recadrage, herbier et scénarios rechargés), clic sur l'ouvrage courant → sélection de l'emprise, qui ouvre un petit panneau d'ouvrage (renommer, voir le métré, ouvrir la fiche dans l'Atelier).
3. **Sélecteur d'ouvrage dans le bandeau** : à côté du titre « Massif Fréquence 01 », une liste déroulante de tous les ouvrages avec glyphe, nom, métré et pastille du nombre de scénarios — pour changer de sujet en un clic quand l'emprise est hors écran.
4. Le clic sur une emprise **ne pose pas de plante** quand un sujet de l'herbier est armé : dans ce cas la pose reste prioritaire (comportement actuel préservé, aucune régression du glisser-déposer).

---

## Détails techniques

- `src/components/maps/mapStyles.ts` : `maxNativeZoom` réalistes + entrée `SATELLITE_FALLBACK_URL` (Esri).
- `src/components/maps/DynamicTileLayer.tsx` : couche de relais sous la couche principale en mode satellite, gestion `tileerror` avec dégradation automatique du `maxNativeZoom`, exposition du palier effectif via un petit store local.
- `src/components/maps/controls/ZoomScaleBadge.tsx` : lit le palier effectif au lieu d'une constante passée en prop.
- `src/components/propriete/scenographe/ScenographeFullscreen.tsx` : rendu de tous les ouvrages, `eventHandlers` de sélection/bascule, état `activeObjetId` interne (initialisé par la prop), recadrage sur changement.
- Nouveau `src/components/propriete/scenographe/OuvrageSwitcher.tsx` (liste déroulante du bandeau) et `OuvrageGeometryLayer.tsx` (emprises interactives).
- Aucune migration, aucun changement de données : les scénarios restent liés à `objet_id`, le hook `useOuvrageScenarios` suit simplement l'ouvrage actif.
