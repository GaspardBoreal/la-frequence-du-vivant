

## Ajouter un sélecteur de rayon de biodiversité dans l'onglet Vivant

### Concept

Un sélecteur compact et élégant affiché juste au-dessus du `SpeciesExplorer`, montrant le rayon actif et permettant de le changer. Design : une rangée de chips/pills horizontales scrollables (mobile-first), avec le rayon actif surligné en émeraude. Un petit indicateur visuel montre la zone couverte.

```text
┌─────────────────────────────────────────────┐
│ 📍 Rayon d'observation                      │
│ [50m] [150m] [250m] [500m●] [1km] [2.5km] [5km] │
│ Zone couverte : 0.79 km²                    │
└─────────────────────────────────────────────┘
```

- Les valeurs inférieures à 500m sont affichées en bleu clair (précision), 500m en émeraude (défaut), supérieures en ambre (élargi)
- Le changement de rayon relance `useBiodiversityData` avec le nouveau `radius` et re-sync le snapshot
- Animation de transition douce lors du changement
- Sur mobile : pills horizontales avec scroll, compact

### Modifications

**1. `src/components/community/MarcheDetailModal.tsx` — composant `VivantTab`**

- Ajouter un état `radius` (défaut `0.5` = 500m) dans `VivantTab`
- Passer `radius` à `useBiodiversityData` au lieu du `0.5` codé en dur
- Réinitialiser `hasSyncedRef` quand le radius change pour re-syncer le snapshot
- Créer un composant interne `RadiusSelector` :
  - Rangée de boutons pills avec les valeurs `[0.05, 0.15, 0.25, 0.5, 1, 2.5, 5]`
  - Labels : `50m, 150m, 250m, 500m, 1km, 2.5km, 5km`
  - Badge "défaut" sur 500m
  - Affichage de la surface couverte (π×r²) sous les pills
  - Code couleur : bleu < 500m, émeraude = 500m, ambre > 500m
- Placer le `RadiusSelector` entre le lien "Explorer sur le territoire" et le `SpeciesExplorer`

### Fichier impacté

| Action | Fichier |
|--------|---------|
| Modifier | `src/components/community/MarcheDetailModal.tsx` |

