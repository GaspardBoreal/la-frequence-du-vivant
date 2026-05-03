## Objectif

Ajouter un 4ème fond de carte **Cadastre** dans la vue Carte de l'exploration (`ExplorationCarteTab.tsx`), réutilisant la logique LEXICON déjà en place sur `/bioacoustique/...`. Mutualiser le code dans un composant partagé. Ajouter un mode édition GPS (aperçu uniquement) réservé aux rôles Ambassadeur, Sentinelle, Administrateur.

## Périmètre fonctionnel (validé)

- **Parcelles affichées** : hybride — la parcelle de chaque point de marche est chargée à l'ouverture du mode Cadastre ; les parcelles voisines sont chargées au clic (rayon configurable).
- **Popup au clic sur un pourtour** : 3 sections fixes — **Localisation** (commune, code postal, pays) / **Cadastre** (id, préfixe, section, numéro, surface) / **Météo** (relevés Open-Meteo récents agrégés sur le centroïde de la parcelle).
- **Mode édition GPS** : toggle explicite (bouton « Repositionner »). Le marqueur devient draggable, lat/lng s'affichent en live ; bouton « Soumettre » → recalcule la parcelle via LEXICON et met à jour le pourtour. **Aperçu uniquement, pas de persistance** en base.
- **Visibilité du mode édition** : Ambassadeur, Sentinelle, Administrateur uniquement.

## Architecture

### 1. Mutualisation — nouveau dossier `src/components/cadastre/`

```text
src/components/cadastre/
  ├── useLexiconParcels.ts        // hook batch (multi-coords) basé sur fetchLexiconParcelData
  ├── useLexiconNearby.ts         // hook fetchNearbyParcels (au clic)
  ├── useParcelWeather.ts         // hook Open-Meteo (centroïde parcelle)
  ├── CadastreLayer.tsx           // composant react-leaflet : Polygons + popups
  ├── ParcelPopup.tsx             // popup 3 sections Localisation/Cadastre/Météo
  ├── GpsEditOverlay.tsx          // marqueur draggable + panneau lat/lng + bouton Soumettre
  └── cadastreUtils.ts            // helpers (centroïde, normalisation LEXICON, formatage)
```

- `useLexiconParcels` enveloppe l'appel existant `fetchLexiconParcelData` (utils/lexiconApi.ts) avec `useQueries` de TanStack pour batcher les N points de la marche, sans toucher l'edge function `lexicon-proxy`.
- `useParcelWeather` réutilise l'edge function `open-meteo-data` déjà déployée.
- `CadastreLayer` est un composant `react-leaflet` enfichable dans n'importe quel `<MapContainer>` ; il gère :
  - rendu des polygones LEXICON (rouge/jaune translucide, identique à l'existant) ;
  - clic sur polygone → ouverture popup ;
  - clic carte hors polygone (en mode Cadastre) → chargement parcelles voisines via `fetchNearbyParcels`.

### 2. Intégration dans `ExplorationCarteTab.tsx`

- Étendre le type `MapStyle` : `'geopoetic' | 'satellite' | 'terrain' | 'cadastre'`.
- Ajouter une entrée dans `TILE_CONFIGS` pointant sur OSM clair (fond lisible derrière le cadastre) + une overlay tile `https://cadastre.data.gouv.fr/map/{z}/{x}/{y}.png` (opacity 0.6).
- Ajouter le bouton « Cadastre » dans `MapStyleToggle` (icône `Map` ou `LandPlot` lucide).
- Quand `mapStyle === 'cadastre'` : monter `<CadastreLayer marches={marches} editableRoles={...} />`.
- Lecture du rôle utilisateur via `useCommunityProfile` + `useAuth().isAdmin` pour exposer le bouton « Repositionner » à Ambassadeur / Sentinelle / Admin.

### 3. Intégration dans `BioacoustiquePoetique.tsx` / `LexiconSubSection.tsx`

- Remplacer (ou wrapper) `CadastralMap.tsx` par le nouveau `CadastreLayer` réutilisé dans une carte react-leaflet identique à l'existant (mêmes contrôles « Plan/Sat/Cadastre/Parcelle LEXICON »).
- La popup actuelle (texte HTML inline minimal) est remplacée par `ParcelPopup` (3 sections, design unifié).
- Le mode édition GPS y est aussi disponible pour les rôles élevés.

### 4. Mode édition GPS (aperçu uniquement)

- Composant `GpsEditOverlay` :
  - Toggle « Repositionner » → marqueur courant devient `draggable: true`.
  - Pendant le drag : panneau flottant affiche lat/lng en live (6 décimales).
  - Bouton « Soumettre » → appelle `fetchLexiconParcelData(newLat, newLng)`, met à jour le polygone affiché et la popup. Aucune écriture en base.
  - Bouton « Annuler » → restaure la position et la parcelle d'origine.
  - Bandeau d'info : « Aperçu local — non sauvegardé ».

## Détails techniques


| Sujet           | Choix                                                                                                                                                               |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Réseau          | Aucune nouvelle edge function ; on s'appuie sur `lexicon-proxy`, `cadastre-proxy`, `open-meteo-data` déjà déployés.                                                 |
| Cache           | TanStack Query, clés : `['lexicon-parcel', lat, lng]` (déjà existante), `['lexicon-nearby', lat, lng, radius]`, `['parcel-weather', lat, lng]`. `staleTime: 5 min`. |
| Rôles           | `useCommunityProfile().role ∈ {ambassadeur, sentinelle}` OU `useAuth().isAdmin` → flag `canEditGps`.                                                                |
| Performance     | Batch parallèle via `useQueries` ; chargement uniquement quand `mapStyle === 'cadastre'` (lazy).                                                                    |
| Style polygones | Repris de `CadastralMap` : stroke `#ef4444`, fill `#fbbf24` opacity 0.3 (cohérent avec la copie 2).                                                                 |
| Voisines        | `fetchNearbyParcels(lat, lng, radius_m=200, step_m=50)` au clic sur la carte hors polygone.                                                                         |


## Fichiers impactés

**Créés**

- `src/components/cadastre/CadastreLayer.tsx`
- `src/components/cadastre/ParcelPopup.tsx`
- `src/components/cadastre/GpsEditOverlay.tsx`
- `src/components/cadastre/useLexiconParcels.ts`
- `src/components/cadastre/useLexiconNearby.ts`
- `src/components/cadastre/useParcelWeather.ts`
- `src/components/cadastre/cadastreUtils.ts`

**Modifiés**

- `src/components/community/exploration/ExplorationCarteTab.tsx` (4ème style + intégration Layer + toggle édition)
- `src/components/open-data/CadastralMap.tsx` (refactor pour utiliser `CadastreLayer` + `ParcelPopup`, popup unifiée, support édition)
- éventuellement `src/components/open-data/LexiconSubSection.tsx` (popup unifiée)

**Aucune migration BDD** (pas de persistance demandée).

## Critères d'acceptation

1. Vue Carte exploration : un 4ème bouton « Cadastre » apparaît à côté de Géo/Sat/Relief.
2. En mode Cadastre, chaque point de marche affiche son pourtour cadastral LEXICON.
3. Clic carte hors polygone → chargement & affichage des parcelles voisines.
4. Clic sur un pourtour → popup avec sections Localisation / Cadastre / Météo.
5. Sur la page `/bioacoustique/...` : popup et style identiques à la vue exploration.
6. Pour Ambassadeur/Sentinelle/Admin uniquement : bouton « Repositionner » → drag du marqueur, affichage live lat/lng, « Soumettre » recharge le pourtour LEXICON, aucune écriture BDD.

## Questions restantes

Si tu veux préciser avant que j'implémente :

- Rayon par défaut pour les parcelles voisines (200 m proposé)  : OUI
- Source météo : même logique que `WeatherVisualization` 
- Uniquement les deux vues mentionnées ?