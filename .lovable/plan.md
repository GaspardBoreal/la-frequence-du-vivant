## Pourquoi il n'y a pas de photo

Deux causes, vérifiées :

1. **La console n'affiche aucune photo, jamais.** `GpsControlConsole.tsx` ne contient aucune référence à `photoUrl` : ni dans la liste de gauche, ni dans le popup du marqueur, ni dans la barre d'action du bas. La donnée arrive pourtant déjà (`photoUrl` est bien rempli dans `useExplorationGpsCandidates`).
2. **Pour les points iNaturalist, la photo n'existe pas dans la donnée.** Les points rouges de la capture sont tous `iNaturalist` (source snapshot). Les attributions stockées dans `biodiversity_snapshots` ne contiennent que : `date, source, observerName/Login/Id/ProfileUrl, exactLatitude, exactLongitude, locationName, observationMethod, originalUrl`. Aucun champ photo. Seules les observations marcheurs (`marcheur_observations.photo_url`, remonté par la RPC) en ont une.

## Ce qu'on fait

### 1. Afficher la photo là où elle existe (immédiat)
- Vignette 44×44 arrondie à gauche de chaque ligne de la liste, avec fallback : silhouette par règne (couleur `STATUS_COLOR` en fond) si pas de photo.
- Photo dans le popup Leaflet du point sélectionné (160px large) + dans la barre d'action du bas.
- Cliquer la vignette ouvre la photo en grand (lightbox légère, même style que le plein écran existant).

### 2. Donner une photo aux points iNaturalist (cascade)
Nouveau hook `useGpsCandidatePhotos(candidates)` appliquant, par ordre de priorité :
1. `photoUrl` de l'observation (marcheurs) ;
2. **photo réelle de l'observation iNat** : `originalUrl` contient l'id d'observation → appel batch `GET https://api.inaturalist.org/v1/observations?id=<ids joints>&per_page=200` (30 ids par lot, mis en cache React Query 1 h) → `photos[0].url` en résolution `medium`. C'est la photo exacte du point litigieux, la plus utile pour juger un placement.
3. fallback espèce : `species_thumb_cache` via le hook existant `useSpeciesThumbs` (photo générique de l'espèce), affichée avec une pastille discrète « photo d'espèce » pour ne pas laisser croire que c'est le cliché du point.

### 3. Lien vers la source
Sous la photo, lien « Voir sur iNaturalist » (`originalUrl`) ouvert dans un onglet — indispensable pour vérifier la localisation d'origine avant d'écarter/repositionner.

## Détails techniques
- Fichiers touchés : `src/components/propriete/gps/GpsControlConsole.tsx` (UI), nouveau `src/hooks/gps/useGpsCandidatePhotos.ts`.
- Aucun changement de schéma ni de RPC : la résolution photo est purement côté lecture/affichage.
- L'appel iNat est fait uniquement pour les candidats affichés dans la console (jamais sur les pages publiques), donc pas d'impact sur les performances des cartes existantes.
- `PropertyWaypoint` possède déjà `originalUrl` pour les points snapshot : c'est la clé d'extraction de l'id iNat.
