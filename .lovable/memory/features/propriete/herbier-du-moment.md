---
name: Herbier du moment (Atelier)
description: Tiroir latéral listant les espèces correspondant aux filtres carte de l'Atelier, avec survol pulsant, recentrage et exports
type: feature
---

Dans l'Atelier du jardin nourricier (`PaletteStudio`), le tiroir « L'herbier du moment »
(`HerbierDuMomentDrawer`) est le miroir textuel de la carte : il regroupe par espèce les
observations réellement visibles (mêmes filtres scope/période/type/source/tags/recherche).

- Chips de filtres actifs retirables (`vivantFilterChips.ts`), regroupement + vignettes
  (`useVivantSpeciesRoster.ts`, cascade photo terrain → cache `species_thumb_cache`).
- Survol d'une espèce → auréole dorée pulsante sur ses pastilles (`highlightKey` dans
  `LivingLayer`, classe CSS `.ds-vivant-pulse` définie dans `index.css`).
- Clic sur une observation → `focusId` : `flyTo` (zoom ≥ 20) puis ouverture de la fiche.
- Ouverture : boutons « Voir la liste des espèces » (panneau Calques et panneau Vivant)
  ou raccourci clavier `L`.
- Exports Markdown/CSV et envoi du contexte à l'IA de Jardin.
