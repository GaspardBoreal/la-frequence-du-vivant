# Chapitre II « Ce que vous rencontrerez » — carrousel toutes espèces

## Diagnostic
Dans `src/components/vignoble/VignobleImmersion.tsx` (composant `PepitesGrid`, lignes 561-622) :

1. **Images floues** : la grille utilise directement `s.photo_url` (thumbnail iNat basse résolution renvoyé par la RPC publique) dans un `<img>` brut. La vue « Biodiversité → Taxons observés » de l'app passe elle par `<SpeciesThumb />` (composant unifié → `useSpeciesThumb` → cache serveur `species_thumb_cache` avec cascade iNat/GBIF net + attribution + pictogramme fallback fin par `iconic_taxon`). C'est la même source de vérité visuelle que le reste de l'app.
2. **Seulement 4 espèces figées** : `.filter(photo_url).slice(0, 4)` — les visiteurs ne voient qu'une fraction des espèces réellement rencontrables. Pas de bouton pour parcourir le reste.

## Ce que je propose

### 1. Rendu vignette identique à l'app
- Remplacer le `<img src={s.photo_url}>` brut par `<SpeciesThumb scientificName={s.scientific_name} commonName={s.common_name} kingdom={s.kingdom} localPhoto={s.photo_url} size="lg" />` dans une tuile carrée `aspect-square` (comme actuellement, mais en délégant la source photo au cache serveur → résolution nette, source labellisée iNat/GBIF, fallback pictogramme cohérent avec Taxons observés).
- Garder l'habillage éditorial « Cellier Noble » : cadre papier, filet doré, `SpeciesName` avec italique scientifique dessous.
- Ne plus filtrer sur `photo_url` : toutes les espèces sont éligibles (SpeciesThumb gère élégamment le fallback).

### 2. Carrousel navigable — toutes les espèces
- Trier par `observations_count` desc puis afficher **par pages de 4** (1/2/4 selon breakpoint : 1 mobile, 2 tablet, 4 desktop).
- Piste horizontale `flex snap-x snap-mandatory` avec chaque « page de 4 » en `snap-start`, scroll fluide.
- Auto-rotation douce (6 s, pausée au hover / `prefers-reduced-motion`), avec micro flash doré à la transition (réutilise le vocabulaire visuel du `AlbumDomaineCarousel`).
- **Boutons de navigation visibles et design** : deux boutons circulaires ivoire à filet doré (`border-[hsl(var(--vignoble-gold)/0.6)]`, icônes `ChevronLeft/Right` de lucide), placés au niveau du titre à droite + en overlay sur les côtés de la piste (desktop). Compteur discret « 04 / 32 » façon cartel.
- Indicateur de pages : petits filets dorés cliquables sous la piste (une barre par page, active = pleine largeur).
- Sous-titre passe de « Quatre présences vivantes… » à « Les N présences vivantes de ce domaine, à rencontrer pas à pas. »

### 3. Périmètre
- **Seul fichier touché** : `src/components/vignoble/VignobleImmersion.tsx` (remplacement de `PepitesGrid`).
- Aucune modif backend/RPC, aucun autre chapitre touché.

## Détails techniques
- Nouveau sous-composant `PepitesCarousel` interne au fichier.
- État : `page` (0-indexed), `pageCount = Math.ceil(species.length / perPage)`, `perPage` dérivé via `useMediaQuery` (ou simple `matchMedia` + resize) → 1 / 2 / 4.
- Scroll via `ref.current.scrollTo({ left: page * ref.current.clientWidth, behavior: 'smooth' })`.
- Auto-rotation : `useEffect` + `setInterval(6000)`, clear au hover (`onMouseEnter/Leave`) et si `useReducedMotion()`.
- Vérification Playwright : screenshot desktop + mobile sur `/m/chateau-boutinet-le-vignoble-vivant-2026-09-26#pepites`, contrôle netteté vignettes + boutons visibles + navigation fonctionnelle.
