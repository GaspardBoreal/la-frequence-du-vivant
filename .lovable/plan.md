

# Unifier l'affichage des especes : un seul composant pour les deux vues

## Diagnostic

Deux vues affichent des especes issues de la meme source (`useBiodiversityData`) mais avec des composants et logiques completement differents :

| | VivantTab (Exploration) | BioDivSubSection (Bioacoustique) |
|---|---|---|
| **Composant card** | `SpeciesCardWithPhoto` | `EnhancedSpeciesCard` |
| **Donnees** | `BiodiversitySpecies[]` → `processSpeciesData()` → objet simplifie `TopSpecies` | `BiodiversitySpecies[]` directement |
| **Filtres** | Aucun | Recherche, categorie, source, audio, contributeur |
| **Noms affiches** | Seulement au hover (immersion) ou tronque (fiche) — souvent vide car `commonNameFr` n'est pas dans `BiodiversitySpecies` | Toujours visible avec traduction FR |
| **Onglets** | Aucun | Toutes / Carte / Faune / Flore / Champignons / Autres |

**Cause du bug COPIE 1** : `processSpeciesData` transforme les especes en un format simplifie qui perd `commonName`. Le champ `commonNameFr` est souvent `null` car il n'existe pas dans les donnees brutes GBIF/iNaturalist. Resultat : les cartes affichent des rectangles verts vides sans nom.

## Solution : extraire un composant `SpeciesExplorer` reutilisable

Creer un composant unique `SpeciesExplorer` qui encapsule :
1. La logique de filtrage (actuellement dans BioDivSubSection lignes 140-294)
2. Les onglets par categorie (Toutes / Faune / Flore / Champignons / Autres)
3. Le toggle Immersion / Fiche
4. L'affichage via `EnhancedSpeciesCard` (le composant le plus complet)

Ce composant accepte un tableau de `BiodiversitySpecies[]` et s'adapte au contexte via des props.

## Architecture

```text
SpeciesExplorer (nouveau)
├── Props: species[], compact?, showFilters?, showMap?, onSpeciesClick?
├── Filtres: recherche, categorie, source, audio, contributeur
├── Onglets: Toutes | Faune | Flore | Champignons | Autres
├── Toggle: Immersion / Fiche
└── Rendu: EnhancedSpeciesCard (unifie)

Utilise par :
├── VivantTab (Exploration page) → compact mode, sans carte
└── BioDivSubSection (Bioacoustique) → full mode, avec carte + rayon
```

## Fichiers impactes

| Fichier | Action |
|---|---|
| `src/components/biodiversity/SpeciesExplorer.tsx` | **Nouveau** — composant unifie extrait de BioDivSubSection |
| `src/components/community/MarcheDetailModal.tsx` | **Modifier** VivantTab : remplacer la grille manuelle par `<SpeciesExplorer>` avec les `BiodiversitySpecies[]` brutes (plus de `processSpeciesData`) |
| `src/components/open-data/BioDivSubSection.tsx` | **Modifier** : remplacer toute la section filtres+onglets+grille par `<SpeciesExplorer>` |

## Detail du composant SpeciesExplorer

**Props** :
- `species: BiodiversitySpecies[]` — donnees brutes
- `compact?: boolean` — mode compact pour VivantTab (filtres reduits, pas de slider rayon)
- `showMap?: boolean` — afficher l'onglet Carte
- `mapProps?: { lat, lng, data }` — props pour la carte
- `onSpeciesClick?: (species) => void`
- `className?: string`

**Logique interne** (extraite telle quelle de BioDivSubSection) :
- Etats : `searchTerm`, `selectedCategory`, `selectedSource`, `hasAudioFilter`, `selectedContributor`, `viewMode`
- `filteredSpecies` memo avec tous les filtres chaines
- `categoryStats` et `contributorsBySource` memos
- Toggle Immersion/Fiche persistent via localStorage

**Mode compact** (VivantTab) :
- Filtres affiches sur une seule ligne (dropdowns plus petits)
- Pas de slider rayon
- Grille 3 cols mobile / 4 cols desktop
- Stats territoire conservees au-dessus

**Mode full** (BioDivSubSection) :
- Tous les filtres affiches
- Slider rayon gere par le parent (pas dans SpeciesExplorer)
- Grille 2-3 cols

## Impact sur le bug des noms

En utilisant directement `BiodiversitySpecies[]` (qui contient `commonName` rempli par les APIs) au lieu de passer par `processSpeciesData` qui perd cette info, les noms s'afficheront correctement dans les deux vues. `EnhancedSpeciesCard` gere deja la traduction FR via `useSpeciesTranslation`.

## Ce qui ne change PAS

- `useBiodiversityData` hook — inchange
- `EnhancedSpeciesCard` — inchange, utilise tel quel
- La carte, les metriques, le detail modal espece — inchanges
- Le slider rayon reste dans BioDivSubSection (contexte specifique)

