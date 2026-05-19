## Objectif

Dans la fiche espèce (`SpeciesGalleryDetailModal`), ajouter une **"Position dans le tissu vivant"** : une mini-carte trophique animée qui montre, en un coup d'œil, où l'espèce se situe dans la **Constellation**, la **Spirale** et le **Réseau** — sans quitter la fiche, mobile-first.

## Concept UX — "Le pouls trophique de l'espèce"

Un bloc compact, juste après les badges Faune/observations, signé d'un petit titre "Sa place dans la chaîne" + un **Niveau Trophique Badge** (ex: `L3 · Carnivores`) coloré au token du niveau.

Sous le badge : un **switcher 3-vues miniatures** (chips horizontales swipables, ≥44px) :
- 🌌 **Constellation** — l'espèce pulse en étoile pleine sur son orbite
- 🌀 **Spirale** — sa perle est mise en surbrillance le long de la courbe ascendante
- 🕸️ **Réseau** — son nœud clignote, ses liens prédateur→proie s'allument

Chaque vue rend une **version mini (h≈180px)** du SVG existant, où :
- Toutes les autres espèces sont **désaturées à 25 %**
- L'espèce ciblée pulse (`animate-ping` + `scale 1.1`) au token de son niveau
- Un voile radial l'illumine

Tap sur la mini-vue → **expand fullscreen overlay** (Sheet `side="bottom"` mobile / Dialog desktop) avec la vue trophique pleine taille, l'espèce toujours mise en exergue, et un bouton "Retour à la fiche".

### Pourquoi c'est wahou
- Continuité narrative : on quitte pas l'espèce, on la *situe* dans le vivant.
- Geste familier (chips à swiper, comme stories).
- Réutilise les composants Constellation/Spirale/Réseau déjà construits → cohérence visuelle totale.
- Le pulse + désaturation = "spotlight" cinématographique, mobile-first.

## Implémentation

**Nouveau composant** `src/components/biodiversity/species-modal/SpeciesTrophicPosition.tsx`
- Props : `scientificName`, `speciesPool: TrophicSpeciesInput[]` (déjà fourni au parent), `kingdom`, `commonName`
- Utilise `useTrophicChain(speciesPool)` pour récupérer `byGroup` + l'assignation de l'espèce
- État local `view: 'constellation' | 'spirale' | 'reseau'`
- État local `expanded: boolean`

**Refactor léger** des 3 tabs trophiques (`ConstellationTab`, `SpiraleTab`, `ReseauTab`) pour accepter :
- `highlightScientificName?: string` — applique opacité réduite aux autres + pulse sur l'étoile cible
- `compact?: boolean` — hauteur réduite (~180px), labels L1-L5 masqués, légendes coupées

**Injection dans `SpeciesGalleryDetailModal.tsx`** (vers ligne 314, juste après les badges) :
```tsx
{speciesPool && (
  <SpeciesTrophicPosition
    scientificName={species.scientificName}
    commonName={frenchName}
    kingdom={species.kingdom}
    speciesPool={speciesPool}
  />
)}
```

**Propagation de `speciesPool`** : il faut le faire descendre depuis `EventBiodiversityTab` → `SpeciesGalleryDetailModal` (la donnée existe déjà via `allSpeciesWithFrNames`, déjà passée à `TrophicChainPanel`).

**Overlay expand** : `<Sheet side="bottom">` mobile (90vh), `<Dialog>` desktop, contenant le tab trophique en plein avec `highlightScientificName` actif et bouton de fermeture.

## Hors scope
- Pas de nouveau calcul trophique (reuse `classifyTrophic`)
- Pas de refonte des 3 visualisations — juste 2 props additionnelles
- Pas de nouvelle data source

## Fichiers
- **Créé** : `src/components/biodiversity/species-modal/SpeciesTrophicPosition.tsx`
- **Édité** : `ConstellationTab.tsx`, `SpiraleTab.tsx`, `ReseauTab.tsx` (props `highlightScientificName`, `compact`)
- **Édité** : `SpeciesGalleryDetailModal.tsx` (insertion + prop `speciesPool`)
- **Édité** : `EventBiodiversityTab.tsx` (propager `speciesPool` au modal)
