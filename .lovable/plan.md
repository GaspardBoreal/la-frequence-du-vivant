

## Ajouter la géolocalisation utilisateur sur la carte d'exploration

### Concept

Un bouton flottant "Me localiser" (icône crosshair/navigation pulsante) dans le coin inférieur droit, au-dessus des contrôles de zoom. Au clic :

1. Le navigateur demande la position GPS
2. Un marqueur bleu pulsant apparaît sur la carte (style "blue dot" façon Google Maps)
3. Un cercle de précision semi-transparent entoure le point
4. Un **panneau distance** glisse depuis le bas, montrant :
   - Le point le plus proche avec sa distance
   - La liste des étapes triées par distance avec mini-barres visuelles

```text
┌─────────────────────────────────────────┐
│  📍 Vous êtes ici                       │
│  Point le plus proche : Étape 3 — 120m  │
│─────────────────────────────────────────│
│  ① Étape 1  ████████░░  1.2 km         │
│  ② Étape 2  ██████░░░░  0.8 km         │
│  ③ Étape 3  █░░░░░░░░░  0.12 km  ← ★  │
│  ...                                    │
└─────────────────────────────────────────┘
```

- Lignes pointillées du marqueur GPS vers le point le plus proche (en bleu)
- Le panneau est refermable, le marqueur reste visible
- Bouton re-centrage sur la position GPS au re-clic

### Design

- Bouton : glassmorphism assorti aux contrôles zoom existants, icône `Crosshair` de lucide, animation pulse bleue quand actif
- Marqueur GPS : `DivIcon` bleu pulsant (cercle plein + halo animé)
- Panneau distances : slide-up depuis le bas, même style glass que la barre de stats existante, scrollable si > 5 étapes
- Couleur : bleu ciel (`sky-400/500`) pour tout ce qui est GPS, émeraude pour les étapes

### Modification

**Fichier unique : `src/components/community/exploration/ExplorationCarteTab.tsx`**

1. Ajouter un état `userLocation: [number, number] | null` et `showDistances: boolean`
2. Créer `GeolocateButton` — bouton flottant au-dessus du zoom, demande `navigator.geolocation.getCurrentPosition`, place le marqueur et ouvre le panneau
3. Créer `UserLocationMarker` — composant Leaflet interne avec `useMap()`, affiche un `DivIcon` bleu pulsant + cercle de précision + polyline pointillée vers le point le plus proche
4. Créer `DistancePanel` — panneau slide-up animé (framer-motion) listant toutes les étapes triées par distance, avec barres proportionnelles et badge "le plus proche"
5. Utiliser `haversineKm` (déjà existant) pour tous les calculs de distance
6. Le panneau remplace temporairement la barre de stats du bas quand il est ouvert

### Fichier impacté

| Action | Fichier |
|--------|---------|
| Modifier | `src/components/community/exploration/ExplorationCarteTab.tsx` |

