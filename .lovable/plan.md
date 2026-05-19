## Vision UX

L'utilisateur ouvre un niveau (ex. « Décomposeurs & recycleurs ») et voit aujourd'hui une liste plate de noms. **Disruption** : chaque ligne devient une **carte vivante** qui révèle déjà, sans clic, les 4 facettes du vivant pour cette espèce :

```
┌──────────────────────────────────────────────┐
│ 🌿 Lichen vert commun                       │
│  ┌───┬───┬─────┐  ┌────┐  •••              │
│  │📷 │🌐 │ +3  │  │📍2 │  Marie, Léa, Sam   │
│  └───┴───┴─────┘  └────┘                   │
│   photos     iNat   marches  contributeurs   │
└──────────────────────────────────────────────┘
        ↓ tap
   📲 Drawer immersif (existant : SpeciesGpsDrawer)
```

- **Mini-mosaïque 3 vignettes** : 1ʳᵉ photo marcheur (couleur), 1ʳᵉ photo iNat (halo bleu), badge « +N » si plus.
- **Pastille marches** : nombre de points GPS sur la marche (couleur emerald, animation pulse si > 0).
- **Avatars empilés** des contributeurs (max 3 + « +N »).
- **Tap → Sheet plein écran** : `SpeciesGpsDrawer` déjà existant (carte Leaflet + carrousel iNat/marcheur + chronologie + attributions). **0 nouveau composant lourd.**

### Pourquoi « wahouhh » et frugal

- **Frugalité** : on réutilise `SpeciesGpsDrawer` (déjà parfait — carte + photos + contributeurs + chronologie). Le seul code neuf est la **carte-vignette** dans la liste.
- **Mobile-first** :
  - Vignettes en grille `flex` qui s'adapte à 320 px.
  - Sheet bottom-up natif (Radix `Sheet`) avec scroll vertical, gestuelle de fermeture par swipe.
  - Animations Framer Motion `layoutId` : la mini-mosaïque "morph" vers la grande galerie du drawer (effet « zoom magique » à la iOS Photos).
- **Disruption visuelle** :
  - Halo coloré autour de chaque vignette selon la source (vert marcheur, bleu iNat).
  - Pulse subtil sur la pastille marches quand l'espèce a été vue *sur* le tracé.
  - Skeleton shimmer pendant le chargement des photos (jamais de saut de layout).
- **Sobriété informationnelle** : la mini-carte tient en **64 px de hauteur** — la liste reste scannable, l'information se révèle progressivement.

## Découpage technique

### 1. Nouveau composant `SpeciesPetalRow.tsx`
`src/components/community/synthese/trophic/SpeciesPetalRow.tsx`

Props :
```ts
{
  scientificName: string;
  commonName: string | null;
  colorToken: string;             // hsl(var(--trophic-l1)) etc.
  marcheurPhotos: string[];       // depuis raw species pool
  inatPhotos: string[];
  attributions: AttributionLike[]; // pour avatars + map points
  marchePointsCount: number;       // déduit des attributions ayant lat/lng
  onOpen: () => void;
}
```

Rendu :
- `button` accessible (role + aria-label « Ouvrir la fiche … »).
- Ligne 1 : pastille couleur + `<SpeciesName />`.
- Ligne 2 : mosaïque + pastille marches + avatars (composant `AvatarStack` à créer ou réutiliser).
- `whileTap={{ scale: 0.98 }}` Framer Motion.

### 2. Câblage `LevelPanel`
`src/components/community/synthese/trophic/_panels.tsx`

- Ajouter prop `speciesPool?: TrophicSpeciesInputRich[]` au `LevelPanel` (et propagation `ConstellationTab` → `LevelPanel`).
- Pour chaque star, lookup dans le pool par `scientificName` pour récupérer `attributions`, `photos`, `inatPhotos`.
- Rendre `<SpeciesPetalRow … onOpen={() => setDrawerSp(star)} />` au lieu du `<li>` actuel.
- Ouvrir `<SpeciesGpsDrawer />` à la racine du panneau avec les bonnes props (`explorationId` venu du contexte exploration).

### 3. Propagation `explorationId` + species pool brut
`TrophicChainPanel.tsx` → ajouter props `explorationId?: string` et `rawSpeciesPool` (déjà disponible côté `EventBiodiversityTab` : `allSpeciesWithFrNames`).
Passer en cascade : `TrophicChainPanel` → `ConstellationTab` / `SpiraleTab` / `ReseauTab` → `LevelPanel` / `SelectedStarPanel`.

### 4. Idem pour `SelectedStarPanel` (clic sur une étoile)
Ajouter en bas du panneau une **CTA brillante** : « Ouvrir la fiche immersive → » qui déclenche le même drawer. Le panneau reste pédagogique ; le drawer apporte l'expérience riche.

### 5. Effet « morph » optionnel (phase 2, non bloquant)
Ajouter `layoutId={`species-photo-${scientificName}`}` sur la 1ʳᵉ vignette ET sur la photo principale du carrousel du drawer → Framer Motion anime le passage. Si le drawer est `Sheet` Radix sans portal compatible, fallback simple fade-in.

## Mobile-first checklist

- [ ] Largeur min testée à 320 px (iPhone SE).
- [ ] Touch target ≥ 44 px sur chaque ligne.
- [ ] Avatars max 24 px avec ring background, ne cassent pas la ligne.
- [ ] Sheet drawer en `side="bottom"` sur mobile, `right` sur desktop (déjà géré par `SpeciesGpsDrawer` si on configure).
- [ ] Photos `loading="lazy"` + `aspect-square` fixe pour zéro CLS.
- [ ] Pas de hover-only — tout passe par tap et focus visibles.

## Hors scope

- Création d'un nouveau drawer custom (on réutilise `SpeciesGpsDrawer`).
- Modification de la logique de classification trophique.
- Refonte de la `Constellation` SVG.
- Récupération de photos depuis une nouvelle source (on s'appuie sur ce qui est déjà chargé par `EventBiodiversityTab`).

## Livrables

1. `SpeciesPetalRow.tsx` (nouveau, ~120 lignes)
2. `AvatarStack.tsx` (nouveau si pas déjà existant, ~40 lignes)
3. `_panels.tsx` : `LevelPanel` + `SelectedStarPanel` consomment le pool, ouvrent le drawer.
4. `ConstellationTab.tsx`, `SpiraleTab.tsx`, `ReseauTab.tsx`, `TrophicChainPanel.tsx`, `EventBiodiversityTab.tsx` : propagation `explorationId` + `speciesPool`.
5. Mémoire à mettre à jour : nouveau noeud `mem://features/community/trophic-level-species-petals`.
