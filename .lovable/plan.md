## Diagnostic

Dans `TrophicFullscreenModal`, l'état `selected` est stocké au niveau du modal et propagé aux trois onglets via deux props :
- `highlightScientificName` (sert au halo + au `effectiveSelected`)
- `onSpeciesSelect` (callback qui remonte la sélection)

Mais cette ligne (`TrophicFullscreenModal.tsx` L87) **écrase** le highlight dès qu'une sélection existe :

```ts
highlightScientificName: selected ? undefined : scientificName,
```

Conséquence du parcours utilisateur :

1. Synthèse → clic « Marronnier d'Inde » → modal ouvert avec `scientificName = Aesculus hippocastanum`, `selected = null`.
2. Onglet **Constellation** : `highlightScientificName` est défini → l'arbre est isolé, l'overlay « Voir les liaisons » fonctionne grâce au `effectiveSelected` interne.
3. Clic sur l'icône liaisons → l'onglet appelle `onSpeciesSelect(star)` → `selected` devient le marronnier dans le modal → `highlightScientificName` devient `undefined`.
4. Bascule vers **Spirale** ou **Réseau** : ces onglets sont remontés à neuf (chacun a son propre `useState selected`), reçoivent `highlightScientificName = undefined` ET `selected` interne = `null`. Plus aucun nœud focal → aucun faisceau trophique calculé → vue « plate ».

C'est donc un défaut d'orchestration entre le parent (modal) et les enfants (tabs), pas un bug de rendu.

## Solution proposée — Source de vérité unique au niveau du modal

Élégante, design, robuste : la **sélection courante** devient une donnée pilotée par le parent. Les onglets restent purement présentationnels pour le focus trophique, sans dupliquer l'état entre montages.

### Changements

**1. `TrophicFullscreenModal.tsx`** — toujours transmettre le nom scientifique focal :

```ts
const focusSn = selected?.scientificName ?? scientificName;

const common = {
  chain,
  speciesPool,
  highlightScientificName: focusSn,   // jamais undefined
  compact: true as const,
  onSpeciesSelect: (s: TrophicStar | null) => setSelected(s),
};
```

Bonus UX : si l'utilisateur clique deux fois sur un autre nœud puis revient sur le marronnier, `selected` reflète la dernière sélection ; sinon on retombe sur l'espèce d'entrée. Aucune désynchronisation possible entre onglets.

**2. Les trois onglets (`ConstellationTab`, `SpiraleTab`, `ReseauTab`)** — ajout d'une dérivation symétrique déjà esquissée dans le plan précédent, mais cette fois fiable car `highlightScientificName` n'est plus blanchi :

```ts
const highlightedStar = useMemo(
  () => highlightScientificName
    ? allStars.find(s => s.scientificName === highlightScientificName) ?? null
    : null,
  [highlightScientificName, allStars],
);
const effectiveSelected = selected ?? highlightedStar;
```

Brancher `effectiveSelected` sur :
- `useTrophicBeams(effectiveSelected, …)` → faisceaux mangeurs / proies / recycleurs calculés
- `<TrophicBeamEdges show={!!effectiveSelected} … />` → arcs animés visibles dans **les trois vues**
- `<TrophicBeamOverlay selected={effectiveSelected} …>` (mode non-compact uniquement) → chips compteurs filtrants
- `selectedFocus` du `ZoomableSvgStage` → recentrage doux automatique
- `isStarMuted` / halo `isSelected` → focal isolé partout

Le `selected` interne reste utile pour le toggle local (re-clic = désélection locale), mais ne casse plus la continuité inter-onglets puisque le parent garde la mémoire.

**3. Réinitialisation cohérente** : le bouton « Réinitialiser » d'un onglet appelle `onSpeciesSelect(null)` (déjà câblé via `setSelected(null)` côté local), ce qui retire le `selected` du modal et fait retomber automatiquement sur `scientificName` d'origine. Comportement attendu et lisible.

### Pourquoi c'est robuste

- **Une seule source de vérité** pour la sélection (le modal). Les onglets ne dupliquent que le toggle local.
- **Aucun `useEffect` de synchronisation** entre parent et enfants → pas de boucle, pas de course.
- **Rétro-compatible** : `compact={false}` (vue Synthèse standard hors modal) garde son comportement, `highlightScientificName` n'étant simplement pas fourni dans ce contexte.
- **Continuité visuelle** : zoom focal, halo, faisceaux et overlay sont tous alignés sur `effectiveSelected`, donc la bascule d'onglet préserve à la fois le centrage **et** les liaisons.

### Fichiers impactés

- `src/components/biodiversity/species-modal/trophic-fullscreen/TrophicFullscreenModal.tsx` (1 ligne)
- `src/components/community/synthese/trophic/ConstellationTab.tsx`
- `src/components/community/synthese/trophic/SpiraleTab.tsx`
- `src/components/community/synthese/trophic/ReseauTab.tsx`

Aucun changement de schéma, d'API edge, ni de logique métier.

### Vérification après build

Parcours simulé sur `/exploration/.../Synthèse` :
1. Clic Marronnier → modal s'ouvre, Constellation : marronnier halo + faisceaux visibles dès l'arrivée.
2. Clic Spirale → marronnier conserve halo, faisceaux orange/jaune/vert visibles le long de la spirale.
3. Clic Réseau → idem, arcs entre la rangée L1 et les autres rangées rendus.
4. Sélection d'une autre espèce dans n'importe quel onglet → faisceaux se redessinent et persistent au changement d'onglet.
5. Bouton « Réinitialiser » → retour propre sur l'espèce d'entrée du modal.
