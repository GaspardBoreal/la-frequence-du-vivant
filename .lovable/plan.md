## Diagnostic

Clic sur **DEVIAT C 835** (résultat espèce) → URL navigée :
`/.../exploration/event-{id}?focus=species:Clematis...&tab=biodiversite&sub=taxons&marcheId=...`

Donc :
- ✅ Bon événement
- ✅ `setActiveGlobalTab('biodiversite')` est bien appelé par `ExplorationMarcheurPage` (et "biodiversite" est labellisé "Synthèse" dans la nav globale — d'où l'illusion qu'on est "sur Synthèse" alors qu'on est bien sur le bon onglet)
- ❌ Le **sous-onglet** `taxons` (la vraie « fiche espèces ») n'est pas activé : `EventBiodiversityTab` reste sur `activeSubTab='synthese'`

### Cause racine

`EventBiodiversityTab` écoute le sous-onglet via le **focus bus** (`subscribeFocus`) chargé en **dynamic import** :

```ts
import('@/lib/focusBus').then(({ subscribeFocus }) => { unsub = subscribeFocus(handler); });
```

Race condition :
1. `ExplorationMarcheurPage` schedule `dispatchFocus` à **+120 ms** après le mount.
2. `EventBiodiversityTab` mount, lance un dynamic import (peut prendre 50–300 ms).
3. Selon l'ordre :
   - Si l'import résout **avant** 120 ms → subscribe → le dispatch arrive → OK.
   - Si l'import résout **après** 120 ms → `subscribeFocus` rejoue `last` SI < 4 s → en général OK.
   - **Mais** `last` n'est mis à jour qu'au moment du dispatch, et la fenêtre de replay ne couvre pas le cas où `consume()` (à 50 ms) a déjà reset `focus` à null AVANT que `dispatchFocus` soit appelé — `dispatchFocus` est bien appelé (closure), mais `focus.sub` capturé peut être stale si l'effet a re-run entre temps.

Concrètement : le canal "bus + dynamic import + setTimeout" est non-déterministe pour le sous-onglet. C'est pourquoi on retombe sur le default `'synthese'`.

De plus, la nav globale affiche "Synthèse" comme label de l'onglet `biodiversite`, ce qui rend le bug visuellement ambigu : l'utilisateur croit voir le mauvais onglet alors que c'est le mauvais **sous-onglet**.

## Correctif

Approche : **passer le focus en prop, ne plus dépendre du bus pour le sous-onglet**. Synchrone, déterministe, zéro race.

### 1. `ExplorationMarcheurPage.tsx`
- Maintenir un état `pendingBiodiversitySub: SubTab | null` alimenté par `focus.sub` quand `focus.kind === 'species' | 'testimony' | 'text'` (avec fallback : species→taxons, testimony→temoignages, text→textes).
- Passer en prop à `EventBiodiversityTab` : `initialSubTab={pendingBiodiversitySub}` + un callback `onSubTabConsumed` pour nettoyer (évite de réimposer le sous-onglet si l'utilisateur navigue ensuite).
- Conserver le focus bus pour le **halo** sur la fiche espèce (déjà OK via `FocusHalo` + `focusTarget`).

### 2. `EventBiodiversityTab.tsx`
- Ajouter prop `initialSubTab?: SubTab | null` et `onSubTabConsumed?: () => void`.
- `useEffect` : si `initialSubTab` change et est non-null → `setActiveSubTab(initialSubTab)` puis `onSubTabConsumed?.()`.
- Garder le `subscribeFocus` existant en sécurité (no-op si la prop a déjà fait le travail).

### 3. Bonus UX : clarifier le label de la nav globale
Le label "Synthèse" sur l'onglet `biodiversite` est trompeur (il y a déjà un sous-onglet "Synthèse" dedans). Renommer en **"Biodiversité"** dans la barre globale. Pas de logique impactée.

### 4. (Optionnel) Affichage chip dans le résultat de recherche
Sur la sous-occurrence species, afficher un petit chip "→ Fiche espèce" pour annoncer la destination et lever toute ambiguïté.

## Fichiers touchés

```
src/components/community/ExplorationMarcheurPage.tsx   # pendingBiodiversitySub + prop drilling + rename label
src/components/community/EventBiodiversityTab.tsx      # accept initialSubTab + apply
src/components/search/SearchResultCard.tsx             # (optionnel) chip "Fiche espèce"
```

Aucun changement SQL, aucun changement de routing, aucun risque sur les flux existants.

## Résultat attendu

- Clic sur **DEVIAT C 835** (espèce) → bon événement → onglet **Biodiversité** → sous-onglet **Taxons** → halo sur la fiche **Clematis** → fiche cliquable.
- Clic sur résultat **testimony** → onglet Biodiversité → sous-onglet Témoignages.
- Clic sur résultat **text** → onglet Biodiversité → sous-onglet Textes.
- Plus de race condition liée au dynamic import.
- Label nav globale plus clair (Biodiversité, pas Synthèse).
