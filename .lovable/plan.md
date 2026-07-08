# Fix "Agrandir" + vue trophique fullscreen réutilisable

## 1. Corriger le bug de clic

**Fichier : `src/components/biodiversity/species-modal/SpeciesTrophicPosition.tsx`**

- Remplacer le `<button onClick={() => setExpanded(true)}>` englobant la mini-scène par un `<div className="group relative …">` — plus de `<button>` parent, plus de hoisting HTML.
- Ajouter un vrai `<button type="button">` **pastille "Agrandir"** positionnée en absolute, `pointer-events-auto`, `z-10`, focus ring, aria-label. C'est ce bouton qui appelle `openTrophicFullscreen(...)`.
- Ajouter en parallèle un calque cliquable transparent (`absolute inset-0 z-0`) derrière le contenu de la mini-scène pour permettre "tap n'importe où sur le fond" → même action. Le contenu interactif (chips zoom, nœuds) reste au-dessus (`relative z-[1]`) et conserve ses propres interactions.
- Garder le dégradé bas + hint (`pointer-events-none`), inchangé visuellement.

## 2. Rendre la fullscreen appelable depuis n'importe où

Aujourd'hui `TrophicFullscreenModal` est monté localement dans `SpeciesTrophicPosition`. On extrait ça en **singleton global** pour que la Carte, le drawer espèce (Liste/Carte/Observateurs), Analyse IA, ou tout futur point d'appel puissent l'ouvrir sans re-monter le state.

**Nouveau fichier : `src/components/biodiversity/species-modal/trophic-fullscreen/TrophicFullscreenProvider.tsx`**

- `TrophicFullscreenProvider` : mounted haut niveau (dans `App.tsx` ou juste dans `MonEspaceLayout` pour scoper).
- Context expose :
  ```ts
  openTrophicFullscreen({
    scientificName: string,
    commonName?: string | null,
    speciesPool: TrophicSpeciesInput[],
    initialView?: 'constellation' | 'spirale' | 'reseau',
  })
  closeTrophicFullscreen()
  ```
- Le provider monte un unique `<TrophicFullscreenModal open={…} …/>` alimenté par le state courant. `chain` est recalculé via `useTrophicChain(speciesPool)` à l'intérieur (déjà mémoïsé).
- Hook `useTrophicFullscreen()` = raccourci `useContext(...)` + garde d'erreur claire.

**Fichier : `src/App.tsx`** (ou racine adéquate)
- Wrapper l'arbre avec `<TrophicFullscreenProvider>` (au même niveau que `TooltipProvider` / `QueryClientProvider`).

**Fichier : `SpeciesTrophicPosition.tsx`**
- Supprimer `useState(expanded)` et le montage local de `<TrophicFullscreenModal>`.
- La pastille + calque appellent `openTrophicFullscreen({ scientificName, commonName, speciesPool, initialView: view })`.

## 3. Points d'appel additionnels (préparés, non ajoutés en dur)

Pour que l'usage soit trivial ailleurs, on documente le pattern dans un mini `README` du dossier `trophic-fullscreen/` :

```tsx
const { open } = useTrophicFullscreen();
<button onClick={() => open({ scientificName, speciesPool, initialView: 'reseau' })}>
  Voir la chaîne trophique
</button>
```

Aucun autre écran n'est modifié dans ce lot — le refactor rend simplement l'appel possible en 2 lignes partout (species drawer, carte, Analyse IA `TrophicChainPanel`, chatbot, etc.).

## Détails techniques

- **Zéro régression visuelle** : la mini-scène garde exactement le même rendu (border, gradient, hint, pastille).
- **A11y** : la pastille devient un vrai `<button>` focusable, `aria-label="Ouvrir la vue trophique en grand"`. Le calque de fond est un `<button>` sr-only-labelled équivalent (`aria-label="Agrandir la vue"`) pour rester utilisable au tap.
- **Perf** : `speciesPool` peut être volumineux. Le provider ne recalcule `useTrophicChain` que quand un pool est réellement ouvert (state `null` sinon → early return, pas de hook conditionnel : on encapsule dans un sous-composant `<TrophicFullscreenHost pool state />` monté uniquement quand `state !== null`).
- **Typechecks** : `TrophicViewKey` déjà exporté par `TrophicFullscreenModal`, réutilisé par le provider.

## Vérification

- Après édition : `tsgo` puis test manuel sur `/mon-espace/exploration/:id` → drawer espèce → clic sur pastille "Agrandir" **et** clic sur zone vide de la constellation → fullscreen s'ouvre avec la bonne vue (constellation / spirale / réseau) préservée.
- Vérifier que les +/‑ zoom internes fonctionnent toujours (pas de propagation vers le calque).
