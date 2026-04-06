

## Enrichir les vignettes "Empreintes passées" avec carte et taxons

### Concept

Chaque vignette passée devient **expandable** : un clic dévoile deux vues immersives en lecture seule, conçues pour inspirer l'inscription aux prochaines marches.

```text
┌─────────────────────────────────────────┐
│ 🌱 Marche agroécologique                │
│ DEVIAT première découverte              │
│ 05 jan 2026 · 📍 DEVIAT · 👥 2         │
│                              [▼ Voir]   │  ← bouton expand
├─────────────────────────────────────────┤
│  [🗺️ Carte]  [🌿 Taxons]  ← onglets   │
│ ┌─────────────────────────────────────┐ │
│ │  Carte Leaflet mini                 │ │
│ │  tracé + marqueurs numérotés        │ │
│ │  7 étapes · ~3 km · 21 espèces     │ │
│ └─────────────────────────────────────┘ │
│                                         │
│  OU                                     │
│                                         │
│ ┌───┬───┬───┬───┬───┐                  │
│ │21 │ 3 │18 │ 0 │ 0 │  ← compteurs    │
│ │Tot│Fau│Flo│Cha│Aut│    royaume       │
│ └───┴───┴───┴───┴───┘                  │
│  Top 3 espèces avec photo miniature     │
│                                         │
│  ✨ "Rejoignez la prochaine aventure"   │
└─────────────────────────────────────────┘
```

### Source de données

Chaque `marche_event` passé a un `exploration_id` qui renvoie vers une exploration avec des étapes géolocalisées (`exploration_marches` → `marches`) et des snapshots de biodiversité (`biodiversity_snapshots`). Le hook `useExplorationBiodiversitySummary` existe déjà et retourne tout ce qu'il faut : `speciesByMarche` (coordonnées, noms), `speciesByKingdom`, `totalSpecies`, `topSpecies` (avec photos).

### Modifications

**1. `src/components/community/tabs/MarchesTab.tsx`**

- **`PastEventCard`** : ajouter un état `expanded` + onglet actif (`carte` | `taxons`)
  - Bouton "Voir le parcours" qui toggle l'expansion avec animation framer-motion
  - Deux onglets stylisés avec la couleur du type d'événement (emerald/violet/amber)

- **Nouveau sous-composant `PastEventMapView`** :
  - Charge les données via `useExplorationBiodiversitySummary(exploration_id)` uniquement quand expanded (lazy)
  - Mini carte Leaflet `h-44` avec le même style que `ExplorationCarteTab` : tracé polyline en pointillés émeraude, marqueurs numérotés
  - Barre de synthèse en bas : `X étapes · ~Y km · Z espèces`
  - Couleur du tracé adaptée au type d'événement (emerald/violet/amber)

- **Nouveau sous-composant `PastEventTaxonsView`** :
  - 5 compteurs en grille compacte : Total / Faune / Flore / Champignons / Autre (style glassmorphism comme la copie écran 3)
  - Top 3 espèces avec photo miniature ronde, nom commun FR, nom scientifique en italique
  - Message d'appel à l'action en bas : "Rejoignez la prochaine aventure pour observer ces espèces" avec lien scroll vers "Sentiers à explorer"

### Design responsive

- **Mobile** : vignettes pleine largeur, carte `h-40`, compteurs en grille `grid-cols-5` compacte, top espèces empilés
- **Tablette/Desktop** : grille `grid-cols-2`, carte `h-48`, compteurs plus spacieux

### Couleurs cohérentes par type

Les onglets, tracés de carte et accents visuels utilisent la couleur du type d'événement :
- **Agroécologique** : emerald-500 (`#10b981`)
- **Éco poétique** : violet-500 (`#8b5cf6`)
- **Éco tourisme** : amber-500 (`#f59e0b`)

### Performance

Le hook `useExplorationBiodiversitySummary` n'est appelé qu'à l'expansion de la vignette (prop `enabled` conditionné sur `expanded`). Les données sont ensuite cachées 30 min (staleTime existant).

### Fichiers impactés

| Action | Fichier |
|--------|---------|
| Modifier | `src/components/community/tabs/MarchesTab.tsx` — PastEventCard expandable + deux sous-composants |

