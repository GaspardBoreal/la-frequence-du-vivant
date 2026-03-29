

# Carte de l'Exploration — Vue immersive du parcours

## Vue d'ensemble

Remplacer le placeholder "Bientot disponible" de l'onglet Carte par une carte Leaflet interactive montrant le parcours complet de l'exploration avec progression temporelle, et des popups riches affichant les contributions collectees a chaque etape (photos, sons, textes, especes).

## Architecture

### Nouveau composant : `ExplorationCarteTab.tsx`

```text
ExplorationCarteTab
├── Props: explorationId, marcheEventId, marches[]
├── Donnees:
│   ├── Coordonnees GPS (deja dans marches.latitude/longitude)
│   ├── useExplorationBiodiversitySummary → especes par marche
│   ├── useMarcheurStats par marche → compteurs photos/sons/textes
│   └── marcheur_medias → 1 photo hero par marche (apercu)
├── Carte Leaflet:
│   ├── Polyline reliant les marches dans l'ordre (trace du parcours)
│   ├── Markers numerotes (1, 2, 3...) avec icones custom emerald
│   ├── Fleches directionnelles sur la polyline (sens de marche)
│   ├── Animation d'apparition progressive des points (framer-motion)
│   └── Popups riches par marche :
│       ├── Nom + date
│       ├── Mini-photo hero (1ere photo publique)
│       ├── Badges compteurs : 📷 🎙 📖 🦎
│       └── Bouton "Explorer cette etape"
└── Legende en overlay :
    ├── Nombre d'etapes + distance totale estimee
    ├── Resume biodiversite globale
    └── Toggle couches (parcours / biodiversite / photos)
```

### Design de la carte

**Markers custom** : Cercles numerotes avec gradient emerald, taille proportionnelle au nombre de contributions. Le marker actif pulse doucement.

**Polyline du parcours** : Ligne en pointilles emerald-400 reliant les marches dans l'ordre chronologique, avec des chevrons SVG decoratifs indiquant le sens de progression.

**Popups** : Glassmorphism coherent avec le reste de l'app (`bg-black/60 backdrop-blur-xl`), photo arrondie, badges de contributions en inline.

**Animation d'entree** : Les markers apparaissent un par un dans l'ordre du parcours (150ms d'intervalle) pour creer un effet narratif de progression.

**Legende flottante** (coin inferieur gauche, mobile-friendly) :
- Resume compact : "8 etapes · ~47 km · 156 especes"
- Bouton toggle pour les couches de donnees

### Donnees utilisees

- **Coordonnees** : `marches.latitude`, `marches.longitude` (deja fetche dans la query `explorationMarches` de `ExplorationMarcheurPage` — il suffit d'ajouter `latitude, longitude` au `select`)
- **Biodiversite** : `useExplorationBiodiversitySummary` (deja existant, inclut `speciesByMarche` avec lat/lng)
- **Stats contributions** : Query agregee sur `marcheur_medias`, `marcheur_audio`, `marcheur_textes` groupee par `marche_id`
- **Photo hero** : 1 photo par marche depuis `marcheur_medias` (is_public=true, type_media='photo', limit 1)

### Distance estimee

Calcul Haversine entre points consecutifs pour afficher la distance totale du parcours dans la legende.

## Fichiers impactes

| Fichier | Action |
|---|---|
| `src/components/community/exploration/ExplorationCarteTab.tsx` | **Nouveau** — composant carte complet |
| `src/components/community/ExplorationMarcheurPage.tsx` | **Modifier** — remplacer `ComingSoonPlaceholder` par `ExplorationCarteTab`, ajouter `latitude, longitude` a la query des marches |

## Resultat

- Carte plein ecran avec le trace du parcours et ses etapes numerotees
- Progression temporelle visible (sens de marche, animation)
- Chaque marker revele les tresors collectes a cette etape
- Resume biodiversite global en overlay
- Mobile-first, touch-friendly, coherent avec le design emerald

