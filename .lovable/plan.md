## Diagnostic

Le composant `FitBounds` (`src/components/maps/controls/FitBounds.tsx`) re-déclenche un `map.setView` / `map.fitBounds` à chaque fois que la **référence** du tableau `positions` change. Or :

- Cliquer sur « Ajouter un point » bascule `isCadastreTapMode`, ce qui re-render `ExplorationCarteTab`.
- À ce re-render, plusieurs sources amont (refetch, recomputations en cascade) peuvent produire un nouveau `geoMarches` et donc un nouveau `positions`, même si les coordonnées sont identiques.
- `FitBounds` voit une nouvelle référence → rejoue `setView([lat,lng], 17)` → **écrase le zoom utilisateur** (qui était à ~19) et le ramène à 17. C'est exactement ce que montrent les captures.

Plus largement, le pattern actuel est fragile : n'importe quel re-render qui retouche la liste casse le zoom utilisateur. Il faut un fit *intentionnel*, pas réactif.

## Proposition (robuste, 2 garde-fous cumulés)

**Garde-fou 1 — Fit basé sur le contenu, pas la référence**  
Dans `FitBounds`, calculer une *signature* stable (`positions.length + JSON des lat/lng arrondis à 6 décimales`) et n'exécuter le fit que quand cette signature change réellement. Toute recréation d'array avec mêmes coordonnées devient un no-op.

**Garde-fou 2 — Respect de l'interaction utilisateur**  
Une fois que l'utilisateur a zoomé/pané manuellement (events Leaflet `zoomstart`/`dragstart` déclenchés par un input humain), `FitBounds` suspend tout auto-fit suivant — sauf si on lui passe explicitement un `force` ou si la signature change (nouveau point ajouté → on refit pour englober tout).

Cette double protection garantit :
- Cliquer « Ajouter un point » ne bouge plus jamais la caméra.
- Changer de mode (Géo/Sat/Cadastre) ne re-zoome plus si l'utilisateur a ajusté manuellement.
- Quand on crée une nouvelle étape, un fit unique se redéclenche pour la rendre visible (signature changée).

## Mise en œuvre

**1. `src/components/maps/controls/FitBounds.tsx`**

- Calculer `const sig = useMemo(() => positions.map(([a,b]) => \`${a.toFixed(6)},${b.toFixed(6)}\`).join('|'), [positions])`.
- Ajouter une ref `hasUserInteractedRef`. Au mount, attacher sur `map` :
  - `map.on('zoomstart', onUserMove)` et `map.on('dragstart', onUserMove)`.
  - Mais distinguer les mouvements programmatiques : utiliser un drapeau `isProgrammaticRef` mis à `true` juste avant chaque `setView`/`fitBounds` et remis à `false` au prochain `moveend`.
- `useEffect` dépendant de `[sig]` (pas `positions`) :
  - Première exécution → fit.
  - Exécutions suivantes → fit uniquement si la signature a changé **et** réinitialiser `hasUserInteractedRef = false` parce qu'il y a vraiment du nouveau contenu à montrer.
- Si `sig` inchangée → ne rien faire, même si `positions` est une nouvelle référence.

**2. Pas de changement côté `ExplorationCarteTab.tsx`** — la signature absorbe les recreations d'array. (Optionnel bonus : laisser tel quel, mais on pourra plus tard supprimer le `useMemo` devenu superflu.)

## Vérification

- Zoomer fort sur la parcelle → cliquer « Ajouter un point » → la caméra ne bouge plus.
- Basculer Géo ↔ Cadastre après zoom manuel → la caméra ne bouge plus.
- Créer un nouveau point hors champ → la caméra refite une fois pour l'inclure (signature changée).

## Hors scope

- Aucune modification de la logique tap/cadastre, du drawer de création, ni du flow de collecte biodiversité.
- Pas de changement des appels `flyTo` explicites (sélection d'une étape) qui restent intentionnels.
