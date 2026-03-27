

# Optimiser le widget "Ma Fréquence du jour" : layout compact

## Constat

Sur mobile (390px), le widget empile verticalement : citation (3-4 lignes) + onde (h-20) + footer = environ 220px. Trop haut, il pousse la carte de progression et les actions rapides sous le fold.

## Solution : layout horizontal citation + onde

Fusionner la citation et l'onde sur la même rangée au lieu de les empiler. La citation occupe la gauche (~60%), l'onde la droite (~40%). Le footer reste en bas mais plus compact.

```text
┌──────────────────────────────────────┐
│ « Vieil étang — une      │ ▎▍▌▋█▊▉ │
│   grenouille plonge... » │ █▋▌▍▎▏▎ │
│   — Bashō 🔗             │ ▍▌▋█▊▉█ │
│──────────────────────────────────────│
│ Ma Fréquence du jour            ★ 9 │
└──────────────────────────────────────┘
```

## Changements

**Fichier** : `src/components/community/FrequenceWave.tsx`

1. Wrapper citation + onde dans un `flex flex-row` au lieu du layout vertical actuel
2. Citation : `flex-1`, texte aligné à gauche, `text-xs` au lieu de `text-sm`, réduire le padding
3. Onde : largeur fixe (~120px), réduire la hauteur de `h-20` à `h-14`, moins de barres (16 au lieu de 24)
4. Réduire le padding global de `p-5` à `p-3`
5. Supprimer le `mb-4` entre citation et onde (ils sont côte à côte)
6. Footer : `mt-2` au lieu de `mt-3`

Gain estimé : ~80px de hauteur, la carte de progression sera visible sans scroller.

