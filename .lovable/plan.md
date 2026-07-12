
## Objectif

Sous la rangée de boutons saisons de la section « Le jardin change de peau » (`ImmersiveGardenFiche.tsx`), afficher un carrousel immersif des espèces réellement observées sur ce jardin pendant la saison sélectionnée, avec les vraies photos terrain (comme l'onglet « Taxons observés » de l'app marcheur).

## Comportement

- Le carrousel apparaît sous la saison active, avec une transition douce à chaque changement (fade + scale + petit stagger sur les vignettes).
- **8 vignettes max par page**, pagination Précédent / Suivant si > 8 espèces éligibles.
- Chaque vignette : photo carrée (ratio 1:1, coins arrondis, ring doré), nom vernaculaire + nom scientifique italique en dessous, badge discret « N obs » en overlay bas-droite.
- Hover / tap : léger zoom + halo saisonnier (couleur `SEASON_TINT[season]`).
- Animation d'apparition : chaque tuile arrive avec un delay stagger (~40 ms) via `AnimatePresence` + `motion` (fade-up + blur-in).
- Si aucune espèce pour la saison : petit message poétique italique « Aucune trace observée en <saison> — le jardin garde son secret ».
- Le CTA « Rejoindre ce jardin » reste sous le carrousel.

## Découpage saisons

Filtre sur `attribution.date` (déjà utilisé par `useSpeciesFilteredByPeriod`) :

- Printemps : mois 3-5
- Été : mois 6-8
- Automne : mois 9-11
- Hiver : mois 12, 1, 2

Peu importe l'année : on regroupe toutes les observations du jardin dont le mois tombe dans la fenêtre.

## Sources de données (réutilisation stricte de l'existant)

- `useExplorationSpeciesPool(event.exploration_id)` → liste `BiodiversitySpecies[]` avec `attributions[]` (chaque attribution a `date`).
- `useDiscoverData(species, explorationId)` → map `photoBy` (cascade photos terrain marcheurs → snapshot → cache `species_thumb_cache` iNat/GBIF). C'est exactement ce que fait déjà l'onglet Taxons dans le mode Découverte.
- `<SpeciesThumb />` en fallback vignette si aucune photo terrain (pastille iNat / kingdom picto).

Aucune requête ajoutée, aucune migration, aucun edge function.

## Fichiers touchés

1. **Nouveau** `src/components/immersive-garden/SeasonSpeciesCarousel.tsx`
   - Props : `explorationId: string | null`, `season: Season`, `tint: string`.
   - Utilise `useExplorationSpeciesPool` + `useDiscoverData`.
   - Filtre par mois d'attribution, trie par nombre d'obs desc, pagine par 8.
   - Rend la grille (4 cols desktop, 2 mobile) avec `motion` + `AnimatePresence` (key = `${season}-${page}` pour re-anim à chaque changement).

2. **Édition** `src/pages/ImmersiveGardenFiche.tsx`
   - Insère `<SeasonSpeciesCarousel />` entre la rangée de boutons saisons (ligne ~379) et le bloc CTA (ligne ~381).

## Technique — extrait clé

```tsx
const SEASON_MONTHS: Record<Season, number[]> = {
  printemps: [3, 4, 5],
  ete: [6, 7, 8],
  automne: [9, 10, 11],
  hiver: [12, 1, 2],
};

const eligible = useMemo(() => {
  const months = new Set(SEASON_MONTHS[season]);
  return species
    .map((sp) => {
      const kept = (sp.attributions || []).filter((a) => {
        const d = new Date(a.date);
        return !isNaN(d.getTime()) && months.has(d.getMonth() + 1);
      });
      return kept.length ? { ...sp, attributions: kept, observations: kept.length } : null;
    })
    .filter(Boolean)
    .sort((a, b) => b!.observations - a!.observations);
}, [species, season]);
```

Pagination par tranches de 8 avec deux boutons ronds « ‹ / › » stylés cohérents avec les boutons saisons.

## Hors périmètre

- Pas de modification du hook `useGardenFiche`, ni du schéma DB.
- Pas de changement du CTA « Rejoindre ce jardin ».
- Pas d'ouverture de drawer espèce (juste affichage) — peut être ajouté plus tard si souhaité.
