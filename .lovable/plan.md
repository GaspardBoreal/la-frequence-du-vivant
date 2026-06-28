## Objectif

Rendre les jeux Enfant (Memory en priorité, puis WhoAmI, KingdomSort, ZoomDetail) robustes pour **toute marche** et **tous filtres** : images systématiquement présentes, dégradation maîtrisée, retour utilisateur clair pendant la résolution.

## Stratégie : pipeline photo unifié + cascade de sources

### 1. Étendre `useDiscoverData` à 3 sources (cascade)

Ordre de priorité par espèce :
1. **Photos terrain marcheurs** (`useExplorationFieldPhotos` via `SpeciesPhotoModeContext` quand disponible) — toujours présentes sur la marche en cours, instantanées.
2. **Cache serveur `species_thumb_cache`** (`useSpeciesThumbs`) — iNat/GBIF.
3. **`species.photos[0]`** — fallback déjà collé à l'objet.

Sortie enrichie :
- `photoBy: Map<sciNameLower, string>` (URL résolue, peu importe la source).
- `withPhoto: BiodiversitySpecies[]` (espèces dont l'URL existe ET a été testée OK en `Image.onload` lazy, ou présumée OK pour source marcheur).
- `isLoading`, `resolvedCount`, `totalCount` pour piloter le squelette.
- `eligibleCount` exposé à `KidsMode` pour ajuster `pairsCount`.

### 2. Pré-vérification d'image (optionnel mais robuste)

Petit utilitaire `preloadImages(urls)` qui résout en parallèle via `new Image()` et filtre les URL cassées (timeout 4 s). Stocké dans un `useRef`-cache pour ne pas re-tester. Cela évite définitivement les vignettes vides.

### 3. `MemoryGame` : adaptatif + fallback visuel

- `pairsCount = Math.min(6, Math.max(3, eligibleCount))` ; si `eligibleCount < 3`, afficher un état vide élégant ("Pas assez de photos pour ce jeu — essayez un autre mode ou élargissez les filtres") avec CTA Retour.
- Pendant `isLoading` (cache en cours de résolution), afficher un **squelette manuscrit** (8 cartes pulsantes + texte Caveat "On prépare les cartes…").
- Re-calcul de `cards` quand `withPhoto` change (déjà via deps), mais clamp à `pairsCount` final.
- Remplacer l'emoji 🌱 du dos par un **SVG inline** (feuille stylisée, couleur ambre) → zéro dépendance police emoji.
- `<img>` avec `onError` qui marque la carte comme « à remplacer » et déclenche un re-tirage local de la paire (1 fois max) → aucune image cassée visible.

### 4. Mutualiser dans `gameUtils.ts`

- `pickWithPhotos` accepte une **option** `requireResolved=true` (n'utilise que `withPhoto` pré-validé).
- `photoUrl` cascade marcheur → cache → `s.photos[0]` → placeholder SVG kingdom (réutiliser le mapping de `SpeciesThumb.tsx`).
- Exporter un composant `<GameCardImage species photoBy />` qui gère `onError` + skeleton + placeholder, utilisé par les 4 jeux pour fiabiliser tout le mode Enfant.

### 5. Forcer la résolution batch dès l'ouverture du mode Découverte

Dans `DiscoverFullscreen`, à l'ouverture, appeler explicitement `supabase.functions.invoke('resolve-species-thumb', { body: { scientific_names: [...] } })` en arrière-plan **par lots de 50** sur toutes les espèces filtrées (pas seulement celles affichées au premier écran). Ainsi quand l'utilisateur choisit "Memory", le cache est déjà chaud. Idempotent et déjà rate-limité côté edge.

### 6. Indicateur de fraîcheur dans `DiscoverModeSelector`

Petite pastille sur la carte "Enfant" : `X / 43 photos prêtes`. Met en confiance et explique l'attente initiale.

## Détails techniques

**Fichiers modifiés**
- `src/components/biodiversity/discover/useDiscoverData.ts` — cascade 3 sources + preload + expose `eligibleCount`.
- `src/components/biodiversity/discover/modes/games/gameUtils.ts` — options et placeholder kingdom.
- `src/components/biodiversity/discover/modes/games/GameCardImage.tsx` — **nouveau**, mutualise `onError` + skeleton + placeholder SVG.
- `src/components/biodiversity/discover/modes/games/MemoryGame.tsx` — pairsCount adaptatif, dos SVG, état vide, squelette.
- `src/components/biodiversity/discover/modes/games/WhoAmIGame.tsx` — utilise `GameCardImage`.
- `src/components/biodiversity/discover/modes/games/KingdomSortGame.tsx` — idem.
- `src/components/biodiversity/discover/modes/games/ZoomDetailGame.tsx` — idem.
- `src/components/biodiversity/discover/DiscoverFullscreen.tsx` — préchauffage edge function à l'ouverture.
- `src/components/biodiversity/discover/DiscoverModeSelector.tsx` — pastille "photos prêtes".

**Aucune** modification de schéma / migration / RLS. Aucune nouvelle dépendance.

## Validation

1. Marche POITIERS Maison Sous Blossac (43 espèces) → cache initialement vide → squelette puis ≥6 paires d'images réelles.
2. Marche sans aucun marcheur_observation (cache uniquement) → fonctionne après préchauffage.
3. Marche filtrée à 2 espèces → message d'état vide propre, pas de jeu cassé.
4. Tester WhoAmI/KingdomSort/ZoomDetail sur la même marche → toutes images chargées via `GameCardImage`.
