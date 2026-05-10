## Objectif

Remplacer le lien externe "Voir la carte" (qui ouvre OpenStreetMap dans un nouvel onglet) par une **popup modale immersive et hyper-centrée** sur la position GPS exacte de la photo, intégrée dans l'app, avec deux propositions inspirantes pour les marcheurs du vivant.

## Comportement actuel

Dans `MediaMetadataPanel.tsx`, le bouton "Voir la carte" est un simple `<a target="_blank">` vers OSM zoom 18. L'utilisateur quitte le contexte de la photo et perd le lien narratif avec sa marche.

## Nouveau comportement

Clic sur "Voir la carte" → ouverture d'un **`<Dialog>` plein écran (max-w-3xl, h-[85vh])** centré, intitulé _"Le lieu exact de cette photo"_, contenant :

### 1. Carte Leaflet ultra-zoomée (cœur du modal)
- Centrée sur `gps.latitude / gps.longitude`, **zoom 19** (max OSM, ~1m/pixel).
- Marqueur pulsant émeraude au centre (animation ping CSS).
- **Bascule de fonds** : Plan OSM / Satellite (Esri World Imagery) / Cadastre (réutiliser `CadastreLayer` déjà en projet).
- Affichage des coordonnées exactes + bouton "Copier" + précision EXIF (source : `exif` / `manual` / `device_geolocation`).
- Boutons secondaires "Ouvrir dans Google Maps / Earth / OSM" en bas (préserve l'option historique).

### 2. Wahouhh #1 — "Le cercle du vivant" (rayon d'écoute)
Un slider compact 10m → 500m qui dessine en surimpression sur la carte un **cercle pulsant** autour du point GPS, avec le message poétique :
_"À X mètres autour de cette photo, c'est tout un monde qui respire."_

Sous le cercle, un mini-compteur lit (si dispo) `useExplorationBiodiversitySummary` ou via `useNearestStations` pour afficher : _"≈ N espèces observées dans ce rayon par la communauté"_. Si pas de données, message contemplatif générique.

→ Donne au marcheur la sensation tangible que sa photo n'est pas un point isolé mais un fragment d'un écosystème.

### 3. Wahouhh #2 — "Reposer mes pas ici" (boussole + Street View immersif)
Deux call-to-actions élégants côte-à-côte :

- **Boussole géopoétique** : bouton "M'y guider depuis ma position" → utilise `navigator.geolocation` puis affiche distance à vol d'oiseau + cap (N, NE, E…) avec une rose des vents stylisée. Tagline : _"À X km d'ici, ce lieu vous attend."_
- **Vue immersive Google Earth 3D** : lien direct vers `https://earth.google.com/web/@{lat},{lng},100a,200d,35y,0h,60t,0r` (vue inclinée 60°, altitude 100m). Tagline : _"Survolez le lieu en 3D"._

## Détails techniques

- Nouveau composant : `src/components/community/contributions/PhotoLocationDialog.tsx`.
- Réutilise `Dialog` shadcn, `MapContainer` react-leaflet, et l'icône Esri pour satellite.
- État local : `mapStyle` (`plan` | `satellite` | `cadastre`), `radius` (number), `userPos` (coords | null).
- Pas de migration SQL, pas de modif backend, pas de modif des autres flows.
- Modif minimale dans `MediaMetadataPanel.tsx` : remplacer le `<a>` "Voir la carte" par un `<button onClick={() => setOpen(true)}>` + montage du dialog.
- Tokens sémantiques (emerald/primary) — pas de couleurs hardcodées.

## Hors-scope

- Pas de changement de la collecte EXIF/GPS (déjà en place).
- Pas de changement des autres flux d'affichage de carte (admin, exploration synthesis).
- Pas d'ajout de tuiles satellite payantes (Mapbox/IGN clés API) — Esri World Imagery est libre d'usage attribué.
