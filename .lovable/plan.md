

# Ajouter le toggle Immersion/Fiche dans l'onglet Vivant de mon-espace

## Probleme

Le toggle de mode d'affichage (Immersion / Fiche) n'existe que sur la page `/exploration-biodiversite` via `EmblematicSpeciesGallery`. L'onglet **Vivant** dans `MarcheDetailModal` (mon-espace) affiche les especes sous forme de simples pilules textuelles — pas de photos, pas de toggle.

## Solution

Remplacer la liste de pilules textuelles (lignes 633-641 de `MarcheDetailModal.tsx`) par une mini-galerie de photos d'especes utilisant `SpeciesCardWithPhoto` avec le toggle Immersion/Fiche.

## Fichier : `src/components/community/MarcheDetailModal.tsx` — VivantTab

| Changement | Detail |
|------------|--------|
| Imports | Ajouter `SpeciesCardWithPhoto`, `Grid3X3`, `LayoutList` depuis les bons modules |
| State | Ajouter `viewMode` state avec persistence `localStorage` (cle `vivant-tab-view`) |
| Toggle UI | Deux boutons icones (Grid3X3 / LayoutList) places a droite du titre "Le Territoire" |
| Grille especes | Remplacer les pilules `<span>` par une grille de `SpeciesCardWithPhoto` avec le prop `viewMode` |
| Grille responsive | Immersion : `grid-cols-3 gap-1.5` / Fiche : `grid-cols-2 gap-2` (adapte a l'espace restreint du modal) |
| Nombre d'especes | Passer de 6 a 9 pour mieux remplir la grille |

## Rendu attendu

```text
┌─ Le Territoire ──────────── [▣] [≡] ─┐
│                                        │
│  Mode Immersion:    Mode Fiche:        │
│  ┌────┐┌────┐┌────┐ ┌──────┐┌──────┐  │
│  │foto││foto││foto│ │foto  ││foto  │  │
│  │    ││    ││    │ │Merle ││Chêne │  │
│  └────┘└────┘└────┘ │ 12obs││ 8obs │  │
│  ┌────┐┌────┐┌────┐ └──────┘└──────┘  │
│  │foto││foto││foto│                    │
│  └────┘└────┘└────┘                    │
└────────────────────────────────────────┘
```

Le mode sombre reste inchange — les couleurs existantes du VivantTab sont deja dark-first.

