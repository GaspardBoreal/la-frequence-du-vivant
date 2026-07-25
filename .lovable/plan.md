## Objectif
Ajouter, sous la carte Cadastre (à côté / dessous de `PropertyAddressCard`), un pavé **"Station météo la plus proche"** avec les 3 actions (Copier adresse / Google Maps / OpenStreetMap).

## Source de données
Utiliser l'utilitaire existant `findNearestWeatherStation(target)` de `src/utils/weatherStationDatabase.ts` (base locale des stations FR déjà géolocalisées et catégorisées par département/région). Aucune requête réseau nécessaire — parfaitement aligné avec les autres vues météo du projet.

Champs disponibles : `code`, `name` (ex. "BORDEAUX-MERIGNAC"), `coordinates {lat,lng}`, `elevation`, `region`, `department`. Il n'y a pas d'adresse postale précise → on compose une "adresse" éditoriale : `NOM STATION — Département, Région` (cohérent avec le reste de l'app).

## Livrables

### 1. Nouveau composant `src/components/propriete/portrait/NearestWeatherStationCard.tsx`
- Props : `center: { lat, lng } | null`.
- Calcule la station la plus proche via `findNearestWeatherStation` + `calculateDistance` (déjà exportées).
- Rendu glassmorphique, aligné visuellement avec `PropertyAddressCard` (même palette forêt/émeraude, même grille).
- Contenu :
  - Icône `CloudSun` + label "STATION MÉTÉO LA PLUS PROCHE"
  - Nom de la station en titre italique (typo cohérente avec Portrait)
  - Ligne "adresse éditoriale" : `{department} · {region}` + altitude si dispo (`{elevation} m`)
  - Badge distance : `{km} km` (1 décimale si < 10, sinon entier)
  - Coordonnées GPS formatées (mêmes helpers que `PropertyAddressCard`)
  - 3 boutons : `Copier l'adresse` (copie `Nom — Département, Région`), `Google Maps` (lat/lng), `OpenStreetMap` (lat/lng) — mêmes styles/icônes que la carte adresse
- État vide (aucun center) : le composant ne s'affiche pas.

### 2. Intégration `src/components/propriete/portrait/PortraitCadastre.tsx`
- Sous `PropertyAddressCard`, ajouter `<NearestWeatherStationCard center={center} />`.
- Passer le même `center` déjà calculé (barycentre parcelles ou coordonnées propriété).
- Mode plein écran : rendre également la card dans la colonne latérale existante (sous les parcelles) pour rester consultable en fullscreen — sinon la garder uniquement hors fullscreen (choix : uniquement hors fullscreen pour ne pas alourdir la vue immersive).

## Hors périmètre
- Pas de modification de la base des stations.
- Pas d'appel réseau ni cache.
- Pas de changement des autres onglets.
