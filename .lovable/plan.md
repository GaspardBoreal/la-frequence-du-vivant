

## Ajouter le contexte "Marches d'observation" au modal espèce depuis Empreinte

### Problème
Quand on clique sur une espèce dans Empreinte → Taxons observés, le modal `SpeciesDetailModal` s'ouvre sans aucune info sur les marches. Le modal riche `SpeciesGalleryDetailModal` (utilisé dans la galerie emblématique) possède déjà un onglet Marches avec liste + mini-carte, mais il n'est pas utilisé ici.

De plus, la mini-carte actuelle n'affiche que les marches **où l'espèce a été observée**. La demande est d'afficher **toutes les marches de l'événement**, en distinguant visuellement celles où l'espèce est présente (gras, couleur vive) de celles où elle est absente (discret, grisé).

### Solution

**Étape 1 — Connecter SpeciesExplorer au modal riche**

Fichier : `src/components/biodiversity/SpeciesExplorer.tsx`
- Ajouter une prop optionnelle `explorationId?: string`
- Quand `explorationId` est fourni, remplacer `SpeciesDetailModal` par `SpeciesGalleryDetailModal` (qui supporte déjà marches, audio, photos iNaturalist, traduction)
- Transformer le `BiodiversitySpecies` sélectionné vers le format attendu par `SpeciesGalleryDetailModal` (`{ name, scientificName, count, kingdom, photos }`)

**Étape 2 — Passer l'explorationId depuis EventBiodiversityTab**

Fichier : `src/components/community/EventBiodiversityTab.tsx`
- Passer `explorationId` au composant `<SpeciesExplorer explorationId={explorationId} />`

**Étape 3 — Enrichir la mini-carte avec toutes les marches de l'événement**

Fichier : `src/components/biodiversity/species-modal/SpeciesMiniMap.tsx`
- Ajouter une prop optionnelle `allEventMarches?: { marcheId: string; marcheName: string; ville: string; order: number; latitude?: number; longitude?: number }[]`
- Quand fournie, afficher **toutes** les marches de l'événement sur la carte :
  - Marches **avec** l'espèce observée : cercle plein vert emerald, rayon proportionnel aux observations, opacité forte, bordure épaisse
  - Marches **sans** l'espèce : cercle gris/blanc semi-transparent, petit rayon fixe, bordure fine, opacité réduite
- Tooltip sur chaque point indiquant le nom de la marche et le statut (observé ou non)

**Étape 4 — Fournir les marches complètes au modal**

Fichier : `src/components/biodiversity/SpeciesGalleryDetailModal.tsx`
- Ajouter une prop optionnelle `allEventMarches` (même type)
- La transmettre à `<SpeciesMiniMap allEventMarches={...} />`

Fichier : `src/hooks/useSpeciesMarches.ts` — aucune modification nécessaire, il retourne déjà les marches observées. Les marches non-observées seront calculées par différence avec `allEventMarches`.

**Étape 5 — Charger les marches de l'événement dans EventBiodiversityTab**

Fichier : `src/components/community/EventBiodiversityTab.tsx`
- Ajouter une query pour récupérer les détails (nom, ville, lat, lng, ordre) de toutes les `exploration_marches` de l'exploration
- Passer ces données à `SpeciesExplorer` via une nouvelle prop `allEventMarches`
- `SpeciesExplorer` les transmet à `SpeciesGalleryDetailModal`

### Design de la carte enrichie

```text
┌─────────────────────────────────┐
│         Mini-carte Leaflet      │
│                                 │
│   ○ (grisé) Marche 3            │
│         ● (vert vif) Marche 1   │
│   ○ (grisé) Marche 5            │
│      ● (vert vif) Marche 7      │
│   ○ (grisé) Marche 2            │
│                                 │
│  ● = espèce observée (bold)     │
│  ○ = non observée (discret)     │
└─────────────────────────────────┘
```

- Points observés : `fillColor: #10b981`, `fillOpacity: 0.8`, `weight: 3`, rayon 6-10
- Points non-observés : `fillColor: #94a3b8`, `fillOpacity: 0.25`, `weight: 1`, rayon 4

### Fichiers modifiés

1. `src/components/biodiversity/SpeciesExplorer.tsx` — prop `explorationId` + `allEventMarches`, modal conditionnel
2. `src/components/community/EventBiodiversityTab.tsx` — query marches, passage des props
3. `src/components/biodiversity/SpeciesGalleryDetailModal.tsx` — prop `allEventMarches`, passage à MiniMap
4. `src/components/biodiversity/species-modal/SpeciesMiniMap.tsx` — affichage dual observed/non-observed

### Résultat attendu
- Le clic sur une espèce dans Empreinte ouvre le modal riche avec photo, traduction FR, audio, liens externes
- L'onglet Carte du modal montre toutes les marches de l'événement : en vert vif celles où l'espèce a été observée, en gris celles où elle ne l'a pas été
- Aucun changement de comportement dans les autres vues (Vivant, Galerie emblématique)

