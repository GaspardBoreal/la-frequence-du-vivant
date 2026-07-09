## Objectif

Ajouter en **tête** du sous-onglet "Apprendre et créer" (copie 1) un bloc CTA "wahou" qui lance le **Mode Découverte plein écran** (copie 2 : Enfant / Immersif / Prospectif 2100), et rendre cette vue **appelable depuis n'importe où** dans l'app via un provider global.

## Ce qu'on construit

### 1. Provider global `DiscoverFullscreenProvider`
Fichier : `src/components/biodiversity/discover/DiscoverFullscreenProvider.tsx`

- Contexte React exposant :
  - `openDiscover({ species, explorationId?, filtersLabel? })`
  - `close()`
- Monte **un seul** `<DiscoverFullscreen/>` (portalé, `z-[2000]`) au niveau racine.
- Hook `useDiscoverFullscreen()` pour consommer depuis n'importe quel composant.
- Ajouté dans `src/App.tsx` autour de l'app (à côté de `TrophicFullscreenProvider`).

Bénéfice : la fullscreen est désormais déclenchable depuis SpeciesExplorer, ApprendreTab, Carte, drawer marcheur, chatbot, etc. sans re-monter le composant ni re-plumbing de props.

### 2. Refactor léger de `SpeciesExplorer`
- Remplace l'état local `discoverOpen` + `<DiscoverFullscreen/>` par un appel à `openDiscover({ species: filteredSpecies, explorationId, filtersLabel })` sur le bouton "Sparkles / Découvrir" existant. Aucun changement UX.

### 3. Hook adaptateur `useExplorationDiscoverSpecies(explorationId)`
Fichier : `src/hooks/useExplorationDiscoverSpecies.ts`

- Wrappe `useExplorationSpeciesPool` et mappe le pool → `BiodiversitySpecies[]` (champs utilisés par les modes Découverte : `id`, `scientificName`, `commonName`, `commonNameFr`, `family`, `photos`, `iconicTaxon`).
- Utilisé par la page exploration pour fournir les espèces au CTA sans reprod. la logique déjà consolidée.

### 4. CTA "wahou" en tête de "Apprendre et créer"
Fichier : `src/components/community/insights/ApprendreTab.tsx`

Nouveau composant local `DiscoverHeroCTA` inséré **tout en haut** du bloc `ApprendreCreerContent`, avant le sélecteur des 5 piliers.

Design :

```text
┌──────────────────────────────────────────────────────────────┐
│  ✨ aurora animée (fuchsia → violet → cyan → émeraude)      │
│                                                              │
│   MODE DÉCOUVERTE · N espèces prêtes                        │
│   Entrez en plein écran                                      │
│                                                              │
│   [👶 Enfant]  [✨ Immersif]  [🚀 Prospectif 2100]         │
│                                                              │
│                            [ Entrer en plein écran → ]      │
└──────────────────────────────────────────────────────────────┘
```

Détails visuels :
- Carte `rounded-2xl` bordure gradient conique animée (mask-composite), fond `bg-gradient-to-br from-fuchsia-950/40 via-violet-900/30 to-cyan-900/40` + halos flous animés (framer-motion, boucle 12 s).
- Titre gros (`text-2xl sm:text-3xl font-light tracking-tight`) + surtitre uppercase tracking-widest émeraude.
- 3 pastilles cliquables (icônes `Baby / Sparkles / Rocket`) : hover scale/glow, clic → `openDiscover(..., mode initial pré-sélectionné)` (voir extension §5).
- Bouton principal "Entrer en plein écran →" : gradient plein, halo pulsant, focus ring accessible.
- Micro-copie "Esc pour fermer · H pour revenir au hub".
- Passe `species`, `explorationId`, `filtersLabel = "Toutes les espèces de l'exploration"`.

Si `species.length === 0` : CTA en état "muet" (bouton disabled + message "Aucune espèce collectée pour l'instant").

### 5. Extension mineure `DiscoverFullscreen` : `initialMode`
Prop optionnelle `initialMode?: DiscoverMode` (défaut `'hub'`). Permet aux pastilles du CTA de sauter directement dans un mode. Rétro-compatible.

### 6. Plumbing dans `ExplorationMarcheurPage`
- Appelle `useExplorationDiscoverSpecies(explorationId)` et passe `species` (+ `filtersLabel`) à `ApprendreTab` via une nouvelle prop `discoverSpecies`.

## Détails techniques

**Fichiers créés**
- `src/components/biodiversity/discover/DiscoverFullscreenProvider.tsx`
- `src/hooks/useExplorationDiscoverSpecies.ts`

**Fichiers modifiés**
- `src/App.tsx` — monter le provider.
- `src/components/biodiversity/SpeciesExplorer.tsx` — remplacer état local par `useDiscoverFullscreen()`.
- `src/components/biodiversity/discover/DiscoverFullscreen.tsx` — ajouter `initialMode`.
- `src/components/community/insights/ApprendreTab.tsx` — ajouter `DiscoverHeroCTA` en tête du sous-onglet et prop `discoverSpecies`.
- `src/components/community/ExplorationMarcheurPage.tsx` — brancher le hook et passer la prop.

**Sécurité / perf**
- Provider unique → un seul portal, pas de duplication DOM.
- Hook adaptateur memoïsé (mapping O(n) sur < 500 espèces).
- Aucun changement backend, aucune RLS touchée.

## Vérifications

1. Onglet "Apprendre → Apprendre et créer" : CTA visible en tête, animé, cliquable.
2. Clic bouton → fullscreen s'ouvre sur le hub (copie 2 identique).
3. Clic sur une pastille (Enfant/Immersif/Prospectif) → fullscreen s'ouvre directement dans le mode.
4. Bouton "Découvrir" existant dans SpeciesExplorer fonctionne toujours (même vue, via provider).
5. Esc / H / 1-2-3 : comportement inchangé.
6. `species.length === 0` : CTA affiché en état muet, pas de crash.
