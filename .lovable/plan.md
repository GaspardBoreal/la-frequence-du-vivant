# Apprendre → La main · Galerie photo inspirante

## Constat

La grille actuelle est plate : 3 vignettes 4/3 identiques, alignées, sans hiérarchie. Visuellement froide, sans souffle. La photo « héroïne » (la 1ʳᵉ) ne respire pas, le scarabée macro perd son impact à côté du paysage.

## Direction retenue : mosaïque éditoriale « hero + side »

Pattern éprouvé (Apple Photos memories, Airbnb gallery, NYT photo essays) : **une grande image héroïne à gauche + une colonne droite de vignettes empilées**. Cadrage cinématographique, hiérarchie immédiate, esthétique magazine.

### Layouts adaptatifs selon le nombre de médias

```text
1 média        2 médias            3 médias              4+ médias
┌──────────┐   ┌─────┬─────┐      ┌──────┬─────┐        ┌──────┬─────┐
│          │   │     │     │      │      │  2  │        │      │  2  │
│  16/9    │   │  1  │  2  │      │  1   ├─────┤        │  1   ├─────┤
│  full    │   │     │     │      │      │  3  │        │      │ 3+N │
└──────────┘   └─────┴─────┘      └──────┴─────┘        └──────┴─────┘
                                  hero ~2/3 + col 1/3   identique
```

- **1 média** : `aspect-[16/9]` plein largeur — cinématique.
- **2 médias** : grille 2 col égales en `aspect-[4/3]`.
- **3+ médias** : hero `aspect-[4/3]` sur 2 colonnes (66 %), 2 vignettes empilées à droite (33 %) en `aspect-[3/2]` chacune. Sur la 3ᵉ vignette, badge `+N` si plus de 3 médias (au lieu d'un overlay noir brut, badge discret en bas-droite avec backdrop-blur).

### Détails esthétiques

- **Gouttière fine** : `gap-1` (4px) au lieu de `gap-0.5` actuel — respiration sans casser la mosaïque.
- **Coins arrondis internes** : la mosaïque hérite du `rounded-xl` de la carte parent (overflow-hidden déjà en place), on ne touche pas aux coins individuels — bord franc à l'intérieur, courbe douce en périphérie.
- **Hover subtil sur chaque tuile** : `hover:brightness-110 transition` + léger `scale-[1.01]` sur l'image (pas sur le cadre, pour ne pas casser la grille).
- **Ring de focus** conservé pour accessibilité clavier.
- **Badge `+N`** : pastille `bg-black/55 backdrop-blur-md text-white text-xs font-semibold rounded-full px-2.5 py-1` ancrée bas-droite de la dernière tuile, au lieu de l'overlay noir plein écran actuel. La tuile reste visible derrière.

### Responsive

- **Mobile (<640px)** : la mosaïque hero+side devient trop étroite. À ce breakpoint, repli sur `grid-cols-2` simple en `aspect-[4/3]` (hero garde l'effet de 2 colonnes côté ratio mais sur 1 ligne), ou plus simple : **grille 2 colonnes** pour 3+ médias (hero sur la 1ʳᵉ ligne full, 2 vignettes en dessous). Détail : grille parent passe en `grid-cols-1 sm:grid-cols-3` avec `grid-rows-2` côté desktop ; le hero prend `sm:col-span-2 sm:row-span-2`.

## Implémentation

Fichier unique : `src/components/community/insights/curation/MainCuration.tsx`, bloc rendu autour de la ligne 560 (`{items.length > 0 && ...}`).

### Pseudo-structure

```tsx
const gridClass = visibleItems.length === 1
  ? 'grid grid-cols-1'
  : visibleItems.length === 2
    ? 'grid grid-cols-2 gap-1'
    : 'grid grid-cols-1 sm:grid-cols-3 sm:grid-rows-2 gap-1';

// vignette 0 : hero (sm:col-span-2 sm:row-span-2 + aspect-[4/3]) si 3+
// vignettes 1 et 2 : aspect-[3/2]
// badge +N sur la dernière si moreCount > 0
```

### Largeurs d'image

- Hero : `width: 900` (cellule ~600px en desktop, devicePixelRatio 1-2).
- Side : `width: 450`.
- Single 16/9 : `width: 1200`.

### Aucun changement hors mosaïque

- Picto, accordéon, éditeur, lightbox, BDD : inchangés.
- `renderThumb` API inchangée (on continue de passer `aspect-*` en `sizeClass`).

## QA visuelle

- Pratique « Haies pour corridor écologique » (3 médias) : paysage en hero gauche, scarabée + feuilles en colonne droite. Composition équilibrée, on lit immédiatement la pratique.
- Pratique 1 média : full 16/9, image héroïne valorisée.
- Pratique 2 médias : diptyque.
- Pratique 5+ médias : hero + side avec badge `+N` discret.
- Mobile : la mosaïque se replie en colonne unique sans rupture.
- Dark + light themes : badge `bg-black/55` reste lisible dans les deux modes.
