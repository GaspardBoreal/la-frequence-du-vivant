## Bug: filtres de « Carte & Agenda » perdent le paramètre `?tab=carte`

**Cause** : `useCarteMdVFilters.update()` (src/hooks/useCarteMdV.ts, ~L107-123) construit `new URLSearchParams()` **vide** et n'y remet que les clés de filtres. Le paramètre `tab` disparaît → la page retombe sur son défaut `souffle`.

**Fix (1 ligne)** : préserver `tab` (et par sécurité tout autre paramètre non géré) lors du rebuild.

Modifier `update` :
```ts
const p = new URLSearchParams();
const currentTab = params.get('tab');
if (currentTab) p.set('tab', currentTab);
// ...suite inchangée
```

Aucune autre modification. Aucun impact backend.
