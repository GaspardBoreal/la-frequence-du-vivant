# Factorisation du fond de carte multi-couches

## Constat

Aujourd'hui le code des fonds de carte est dupliqué :
- **`ExplorationCarteTab.tsx`** (onglet Carte) embarque 4 styles complets : **Géo** (OSM France stylisée sombre), **Sat** (Esri imagery), **Relief** (OpenTopoMap), **Cadastre** (OSM + overlay Etalab) + un toggle riche.
- **`PhotoLocationDialog.tsx`** (popup "Le lieu exact de cette photo") a une version réduite et différente : seulement Plan / Sat / Cadastre, OSM standard (pas la version stylisée), pas de Relief, design du toggle différent.

Résultat : la popup ne profite pas de la richesse cartographique de l'onglet Carte (pas de Relief, pas de tuiles géopoétiques sombres, libellés et icônes incohérents).

## Objectif

Extraire les briques de fond de carte dans un module partagé, puis les rebrancher des deux côtés pour garantir une expérience identique et faciliter toute future réutilisation (ex : carte d'une marche, carte d'une espèce, carte publique).

## Plan d'action

### 1. Créer un module partagé `src/components/maps/`

- **`mapStyles.ts`** — source unique de vérité :
  - Type `MapStyle = 'geopoetic' | 'satellite' | 'terrain' | 'cadastre'`
  - `TILE_CONFIGS` (url, attribution, maxZoom, className)
  - Couleurs dérivées (polyline, accent) si utiles ailleurs
- **`DynamicTileLayer.tsx`** — composant React-Leaflet qui swap les tuiles sans démonter la carte, gère l'overlay Cadastre Etalab (extrait tel quel de `ExplorationCarteTab`).
- **`MapStyleToggle.tsx`** — toggle visuel Géo/Sat/Relief/Cadastre, avec une prop `compact?: boolean` pour la version popup (icônes seules, padding réduit) et `position?: 'top-right' | 'top-left' | 'inline'` pour le placement.

### 2. Refactor `ExplorationCarteTab.tsx`

- Supprimer les définitions locales `MapStyle`, `TILE_CONFIGS`, `DynamicTileLayer`, `MapStyleToggle`.
- Importer depuis `@/components/maps`.
- Conserver localement uniquement ce qui est spécifique à la carte d'exploration (POLYLINE_COLORS, ARROW_COLORS, ZoomControls custom, etc.).
- Comportement visuel inchangé.

### 3. Refactor `PhotoLocationDialog.tsx`

- Supprimer le `MapStyle = 'plan' | 'satellite' | 'cadastre'` local, le `TILES` local, le `CadastreOverlay` local et l'ancien sélecteur (icône Layers + bouton textuel).
- Utiliser `DynamicTileLayer` + `MapStyleToggle` partagés (mode `compact` pour rester lisible dans la popup).
- État par défaut : `mapStyle = 'satellite'` (cohérent avec l'usage "voir la position exacte" d'une photo). À confirmer si tu préfères `geopoetic`.
- Garder intactes les deux fonctionnalités wahouhh ("Le cercle du vivant" + "Reposer mes pas ici"), le marker pulsant, les liens externes.

### 4. Vérification

- Ouvrir l'onglet **Carte** d'une exploration → les 4 boutons fonctionnent comme avant.
- Ouvrir une photo géolocalisée → "Voir la carte" → la popup affiche désormais **Géo / Sat / Relief / Cadastre** identiques à ceux de l'onglet Carte, avec l'overlay Etalab en mode Cadastre.
- Pas de régression de z-index (popup reste au-dessus du lightbox).

## Détails techniques

```text
src/components/maps/
├── mapStyles.ts          ← types + TILE_CONFIGS
├── DynamicTileLayer.tsx  ← swap tuiles + overlay cadastre
└── MapStyleToggle.tsx    ← UI segmented control (variants compact/full)
```

Aucune dépendance npm ajoutée. Aucun changement de schéma DB. Travail purement front / présentation.

## Question

Pour la popup "Le lieu exact de cette photo", quel **fond par défaut** préfères-tu à l'ouverture ?
- `geopoetic` (cohérent avec l'onglet Carte, ambiance sombre)
- `satellite` (montre immédiatement le lieu réel — plus immersif pour une photo)

Si tu n'as pas de préférence forte je pars sur **satellite** (logique "voir là où la photo a été prise").
