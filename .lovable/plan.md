

## Carte GPS des photos — Vue cartographique interactive

### Concept

Remplacer le Dialog actuel de vérification GPS par un **Dialog enrichi à deux onglets** : "Liste" (vue actuelle) et "Carte" (nouvelle vue Leaflet). La carte affiche tous les points GPS des photos et le point de la marche avec des popups riches contenant la photo, la distance et les liens Google Maps / OSM.

### Architecture UX/UI (Mobile First)

```text
┌──────────────────────────────────────┐
│  📍 Cohérence GPS        [Liste|Carte]│
│  Point marche: 45.87, 3.21           │
├──────────────────────────────────────┤
│                                      │
│     ┌──────────────────────────┐     │
│     │                          │     │
│     │   🔴 Marche (rouge/or)   │     │
│     │                          │     │
│     │  🟢 Photo1 (45m)        │     │
│     │      🟠 Photo2 (626m)   │     │
│     │                          │     │
│     └──────────────────────────┘     │
│                                      │
│  [Géopoétique] [Satellite] [Relief]  │
└──────────────────────────────────────┘

Popup au clic sur un marqueur photo :
┌─────────────────────────┐
│ ┌─────────┐  IMG_001    │
│ │  thumb  │  ✅ 45m     │
│ └─────────┘             │
│ 📍 Google Maps  🗺 OSM  │
└─────────────────────────┘
```

### Détails techniques

**1. Nouveau composant `GpsMapView.tsx`**

Carte Leaflet compacte (~300px de hauteur mobile) avec :
- **3 styles de tuiles** : réutilise `TILE_CONFIGS` existant de `ExplorationCarteTab.tsx` (Géopoétique, Satellite, Relief) avec toggle glassmorphism
- **Marqueur marche** : icône étoile dorée/rouge distinctive, toujours visible, avec popup "Point de référence + lien Google Maps + OSM"
- **Marqueurs photos** : chaque photo a une couleur unique tirée d'une palette harmonieuse (turquoise, violet, orange, rose, bleu…). Le marqueur utilise un `CircleMarker` avec bordure colorée.
  - Couleur vert si distance < 200m
  - Couleur orange si distance 200m-1km  
  - Couleur rouge si distance > 1km
  - Couleur gris si pas de GPS
- **Lignes pointillées** : polylines entre chaque photo et le point marche (même code couleur distance)
- **Auto-fit bounds** : la carte s'ajuste pour montrer tous les points
- **Popups riches** : miniature de la photo (60x60px), nom, distance, liens Google Maps et OpenStreetMap

**2. Palette de couleurs par photo**

```typescript
const PHOTO_COLORS = [
  '#06b6d4', // cyan
  '#a855f7', // violet
  '#f97316', // orange
  '#ec4899', // rose
  '#3b82f6', // bleu
  '#84cc16', // lime
  '#f43f5e', // rouge
  '#14b8a6', // teal
];
// Chaque photo reçoit une couleur unique cyclique
```

Mais le **remplissage du cercle** utilise le code couleur distance (vert/orange/rouge), tandis que la **bordure** utilise la couleur unique pour identifier la photo.

**3. Modification du Dialog GPS existant**

Dans `MarcheDetailModal.tsx`, le Dialog GPS devient à deux onglets :
- Onglet "Liste" = vue actuelle inchangée
- Onglet "Carte" = le nouveau `GpsMapView`
- Toggle simple en haut du dialog, style cohérent avec le toggle Immersion/Fiche

**4. Liens navigation**

Chaque popup inclut :
- `https://maps.google.com/?q=lat,lng` (Google Maps)
- `https://www.openstreetmap.org/?mlat=lat&mlon=lng&zoom=16` (OSM)

### Fichiers

| Fichier | Action |
|---------|--------|
| `src/components/community/contributions/GpsMapView.tsx` | **Nouveau** — composant carte Leaflet avec marqueurs, popups, toggle style |
| `src/components/community/MarcheDetailModal.tsx` | Ajouter onglet Carte dans le Dialog GPS, passer les `gpsResults` et `marcheCoords` au composant carte |

### Points de vigilance

- Le Dialog reste compact mobile-first (max-h-[80vh])
- La carte Leaflet est en `height: 350px` sur mobile, responsive
- Les images dans les popups Leaflet utilisent des `<img>` HTML (pas React) car les popups Leaflet sont du HTML brut — `bindPopup()` avec template string
- `fitBounds` avec padding pour ne pas coller les marqueurs aux bords

