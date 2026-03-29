

# Galerie d'especes : deux modes d'affichage inspirants

## Constat

Les vignettes actuelles sont encombrees : nom commun + nom scientifique + badge d'observations + gradient sombre occupent ~40% de la surface photo. Sur une grille dense, l'effet est plus "fiche technique" qu'immersion dans le vivant.

## Solution : deux modes de visualisation avec bascule elegante

### Mode 1 — "Immersion" (nouveau, par defaut)

- **Photo plein cadre** sans aucun texte ni badge visible
- Ratio `aspect-[3/4]` (portrait) pour des vignettes plus hautes et immersives
- Coins arrondis genereux (`rounded-2xl`)
- Au **hover** uniquement : micro-overlay avec le nom qui apparait en fondu depuis le bas (subtil, 2 lignes max)
- Grille plus serree : `gap-2` au lieu de `gap-3/4`
- Effet : une mosaique photographique vivante, comme un mur d'images naturalistes

### Mode 2 — "Fiche" (mode actuel, simplifie)

- Garde la structure actuelle mais retire le nom scientifique (trop long, pas inspirant)
- Ne conserve que le nom commun francais (1 ligne, tronque) + badge observations
- Gradient overlay plus leger (`from-black/50` au lieu de `from-black/70`)

### Toggle de bascule

- Deux petites icones dans la barre de filtres existante (a cote du compteur d'especes) :
  - `Grid3X3` (lucide) pour le mode Immersion
  - `LayoutList` (lucide) pour le mode Fiche
- Etat persiste dans `localStorage`
- Transition animee entre les deux modes via `AnimatePresence`

## Fichiers impactes

| Fichier | Modification |
|---------|-------------|
| `src/components/biodiversity/SpeciesCardWithPhoto.tsx` | Ajouter prop `viewMode: 'immersion' \| 'fiche'`. Mode immersion : pas d'overlay texte, hover reveal. Mode fiche : nom commun uniquement, pas de nom scientifique |
| `src/components/biodiversity/EmblematicSpeciesGallery.tsx` | Ajouter state `viewMode`, toggle dans la barre de filtres, passer le mode aux cards, ajuster la grille (portrait ratio + gap plus serre en mode immersion) |

## Detail technique — SpeciesCardWithPhoto

```
Mode immersion:
- aspect-[3/4] au lieu de aspect-square
- Pas de gradient overlay par defaut
- Pas de texte par defaut
- Hover: gradient subtil from-black/40 + nom commun en fadeIn
- Badge obs. masque
- Photo source badge masque

Mode fiche:
- aspect-square (inchange)
- Gradient leger from-black/50
- Nom commun uniquement (1 ligne)
- Badge obs. visible
```

