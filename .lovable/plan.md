
## Objectif

Permettre, dans les **3 vues factorisées** (Synthèse → Taxons, Pouls du vivant → jour, Marches → Vivant), de basculer **toutes les vignettes espèces** (grille + fiche détail) entre :

- **Photos marcheurs** (terrain — défaut quand au moins une existe dans l'exploration)
- **Photos iNaturalist** (référence taxonomique)

Le toggle doit être **élégant**, animé, et propager son état partout sans flicker.

---

## Architecture (1 source de vérité)

### 1. Nouveau hook `useExplorationFieldPhotos(explorationId)`

Charge **en un seul appel** toutes les photos terrain (marcheur + citoyen) de l'exploration, indexées par `scientificName` normalisé.

Retourne :
```ts
{
  byScientificName: Map<string, MarcheurSpeciesPhoto[]>;
  hasAny: boolean;
  isLoading: boolean;
}
```

Réutilise la logique existante de `useSpeciesMarcheurPhotos` (mêmes requêtes `marcheur_observations` + `biodiversity_snapshots`) mais **sans filtre par espèce** → 1 query par exploration, cache 10 min.

### 2. Nouveau contexte `SpeciesPhotoModeContext`

```ts
type SpeciesPhotoMode = 'marcheur' | 'inaturalist';

{
  mode: SpeciesPhotoMode;
  setMode: (m) => void;
  fieldPhotos: Map<string, MarcheurSpeciesPhoto[]>;
  hasFieldPhotos: boolean;
  getPreferredPhoto: (scientificName, fallbackUrl?) => { url, source, observerName? };
}
```

- **Default** : `marcheur` si `hasFieldPhotos`, sinon `inaturalist`.
- **Persistance** : `localStorage` key `species-photo-mode:${explorationId}`.
- **Fallback gracieux** : si mode = marcheur mais aucune photo terrain pour CETTE espèce → renvoie l'iNat avec un flag `isFallback: true` (UI ajoute un ring pointillé + tooltip "Pas encore de photo marcheur").

Provider monté dans `SpeciesExplorer` (couvre les 3 vues car toutes passent par lui ou par le modal qu'il rend).

### 3. UI du toggle — pill segmenté glass animé

Placé **juste au-dessus de la grille** (dans `SpeciesExplorer`, après les filtres), masqué si `!hasFieldPhotos`.

```text
┌──────────────────────────────────────┐
│ [📷 Marcheurs · 47]  [✨ iNaturalist] │ ← pill animée
└──────────────────────────────────────┘
```

Détails visuels :
- Conteneur `inline-flex p-1 rounded-full bg-white/5 border border-white/10 backdrop-blur`.
- **Indicateur animé** : `motion.div` avec `layoutId="photo-mode-indicator"` qui glisse derrière l'option active (spring `stiffness:400, damping:30`).
- Option active : texte blanc, fond `bg-emerald-500/90` (marcheur) ou `bg-sky-500/90` (iNat) — cohérent avec les couleurs du carousel détail.
- Option inactive : `text-white/60 hover:text-white/90`.
- Compteurs : nombre d'espèces dotées de photos terrain (à droite du label "Marcheurs").
- Mobile (<640px) : icônes seules, label en `sr-only`.
- Micro-interaction : au clic, **flash de halo radial** (`box-shadow` animé) qui se dissipe en 400ms.

### 4. `SpeciesCardWithPhoto` — crossfade fluide

- Consomme le contexte via `useSpeciesPhotoMode()`.
- Photo affichée = `getPreferredPhoto(species.scientificName, species.photos?.[0])`.
- `<AnimatePresence mode="wait">` avec `key={photoUrl}` → **crossfade 350ms** entre les deux sources (opacity + léger scale 1.02 → 1).
- Petit **badge coin haut-droit** indiquant la source actuelle :
  - `📷 Marcheur` (emerald) si source marcheur
  - `✨ iNat` (sky) si source iNat
  - `📷 Manque` (slate avec ring pointillé) si fallback iNat alors qu'on est en mode marcheur — clic = ouvre la fiche (incitation à documenter).
- Hover sur la carte = preview du nom observateur si source marcheur (`"📷 Aurélie · 14/05/2026"`).

### 5. `SpeciesGalleryDetailModal` + `SpeciesPhotoCarousel` — bascule synchronisée

- Le carousel existant a déjà ses slides marcheur + iNat triées.
- À l'ouverture du modal : si `mode === 'marcheur'` et `firstFieldIdx >= 0` → `emblaApi.scrollTo(firstFieldIdx, true)` (instantané) ; sinon `firstRefIdx`.
- Le toggle segmenté **interne au carousel** (Référence ↔ Sur le terrain) écrit aussi dans le contexte → toggle global et carousel restent synchronisés (clic dans le modal change le mode global ; clic dans la pill globale change l'image affichée dans le modal).
- Ajout d'une animation de **transition d'image plus marquée** au switch (slide horizontal + opacity au lieu du saut Embla brut) : on conserve Embla mais on déclenche un `motion.div` overlay très court qui blanchit (300ms) — sensation "wahuhh".

### 6. Empty/loading state

- Pendant `useExplorationFieldPhotos.isLoading` → toggle masqué (évite saut).
- Si exploration sans aucune photo marcheur → pas de toggle, comportement actuel (iNat).
- Si exploration avec photos marcheurs mais mode=marcheur et espèce sans photo terrain → fallback iNat + badge "Manque" subtil (cf §4).

---

## Fichiers à créer / modifier

| Fichier | Action |
|---|---|
| `src/hooks/useExplorationFieldPhotos.ts` | **Créer** — batch loader |
| `src/contexts/SpeciesPhotoModeContext.tsx` | **Créer** — provider + hook |
| `src/components/biodiversity/SpeciesPhotoModeToggle.tsx` | **Créer** — pill animée |
| `src/components/biodiversity/SpeciesExplorer.tsx` | Monter le provider, afficher le toggle, passer `explorationId` au provider |
| `src/components/biodiversity/SpeciesCardWithPhoto.tsx` | Consommer le contexte, crossfade `AnimatePresence`, badge source |
| `src/components/biodiversity/SpeciesGalleryDetailModal.tsx` | Brancher l'ouverture initiale sur `mode` |
| `src/components/biodiversity/species-modal/SpeciesPhotoCarousel.tsx` | Bind du toggle interne au contexte global |

Aucune migration DB. Aucun changement de schéma. Aucun impact sur les autres vues (le provider est local à `SpeciesExplorer`, fallback inchangé hors de son scope).

---

## Garanties de factorisation

- **1 contexte** = 3 vues alignées automatiquement.
- **1 hook batch** = pas de N+1 réseau sur la grille.
- **1 composant toggle** réutilisable (pourra plus tard être posé dans d'autres écrans).
- Toute évolution future (ex. ajouter source GBIF, ajouter mode "Mixte") = modification dans le contexte uniquement.
