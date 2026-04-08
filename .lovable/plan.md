

## Ajouter un sélecteur de vue cartographique (Géopoétique / Satellite / Relief)

### Concept

Un bouton de bascule flottant élégant dans le coin supérieur droit de la carte, permettant de switcher entre 3 vues sans recharger la carte ni perdre les marqueurs/tracés :

1. **Géopoétique** (défaut) — la vue sombre actuelle OSM France, parfaite pour la narration
2. **Satellite** — imagerie satellite haute résolution via Esri World Imagery (gratuit, sans clé API), idéale pour les cours d'eau et le relief
3. **Relief** — carte topographique OpenTopoMap montrant les courbes de niveau et l'hydrographie

Le toggle est un petit groupe de boutons glassmorphism (backdrop-blur, bordure semi-transparente) avec des icônes distinctes et une animation de transition douce. La vue active est surlignée en émeraude. Le filtre `brightness/saturate` est retiré dynamiquement sur les vues satellite et relief pour les afficher en couleurs naturelles.

### Modification

**Fichier unique : `src/components/community/exploration/ExplorationCarteTab.tsx`**

1. Ajouter un état `mapStyle: 'geopoetic' | 'satellite' | 'terrain'` (défaut `'geopoetic'`)
2. Créer un composant interne `MapStyleToggle` — 3 boutons flottants (position absolute top-right z-1000) avec icônes `Palette` / `Globe` / `Mountain`
3. Créer un composant `DynamicTileLayer` qui utilise `useMap()` pour swapper le TileLayer selon le style sélectionné :
   - Géopoétique : `https://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png` + filtre sombre
   - Satellite : `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}` (+ labels overlay optionnel)
   - Relief : `https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png`
4. Adapter le CSS dynamiquement : `.carte-tiles-dark` filter appliqué uniquement en mode géopoétique
5. Adapter les couleurs du polyline et de la légende selon le mode (le tracé émeraude passe en blanc/jaune sur satellite pour rester visible)

### Design du toggle

```text
┌──────────────────────┐
│  🎨  🛰️  ⛰️         │  ← coins arrondis, glass effect
│  Géo  Sat  Relief    │    bouton actif = fond émeraude
└──────────────────────┘
```

Compact sur mobile (icônes seules), labels visibles au hover sur desktop.

### Aucune nouvelle dépendance

Tout reste dans Leaflet — on change uniquement l'URL du TileLayer. Les marqueurs, polylines, popups, zoom et légende sont conservés identiques.

### Fichier impacté

| Action | Fichier |
|--------|---------|
| Modifier | `src/components/community/exploration/ExplorationCarteTab.tsx` |

