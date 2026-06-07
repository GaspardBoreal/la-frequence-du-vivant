## Le bug

Quand tu cliques sur « ROQUE GAGEAC / Jardin » dans le drawer "Catalpa du sud", `GlobalSearchOverlay.handleResultClick` construit bien l'URL de l'événement (`/exploration/event-<id>?marcheId=…`) mais **n'ajoute jamais** les paramètres `focus=species:<scientificName>`, `tab=biodiversite`, ni `sub=taxons`.

Or toute la mécanique de téléportation côté `ExplorationMarcheurPage` (lignes 213-279) est déjà câblée :
- `useFocusFromUrl()` lit `?focus=<kind>:<id>&tab=&sub=&marcheId=`
- Si `focus.kind === 'species'` → bascule sur l'onglet `biodiversite`, sous-onglet `taxons`, et déclenche le halo via `setFocusTarget('species:'+id)` + `dispatchFocus(...)`
- `FocusHalo` retrouve `[data-focus-id="species:Catalpa bignonioides"]` rendu par `SpeciesExplorer.tsx:378`, scroll-into-view puis pulse émeraude.

Sans `focus=…` dans l'URL, on tombe sur l'onglet par défaut (`carte`) et aucun halo ne s'allume. C'est exactement ce que montre la copie 3.

J'ai vérifié que `result.id` pour une espèce vaut le scientificName (`Catalpa bignonioides`), ce qui matche bien le `data-focus-id` cible. Aucune transformation supplémentaire n'est nécessaire.

## Correctif robuste (un seul fichier)

**`src/components/search/GlobalSearchOverlay.tsx`** — enrichir `handleResultClick` pour qu'il propage systématiquement le focus quand le `kind` est focusable.

Logique ajoutée juste après la résolution de `target`/`params` :

```text
if (kind ∈ {species, testimony, text, practice, event}) {
  params.set('focus', `${r.kind}:${r.id}`)
  // tab par défaut selon kind (alignée sur ExplorationMarcheurPage)
  if (!params.has('tab')) {
    species|testimony → 'biodiversite'
    practice          → 'apprendre'
    text              → 'marches'
    event             → 'carte'
  }
  // sub par défaut (alignée sur les setPending… de la page)
  species   → sub=taxons
  testimony → sub=temoignages
  text      → sub=textes
}
```

Ce qui produit pour le cas Catalpa du sud :
```
/marches-du-vivant/mon-espace/exploration/event-32945ab4…
   ?marcheId=bfebc538…
   &focus=species:Catalpa%20bignonioides
   &tab=biodiversite
   &sub=taxons
   &t=…
```

Résultat : la page s'ouvre sur **Biodiversité → Taxons**, l'étape ROQUE GAGEAC / Jardin est sélectionnée, et le halo émeraude pulse autour de la vignette « Catalpa du sud ».

## Pourquoi c'est robuste pour TOUTES les recherches

1. **Source unique de vérité** : un seul endroit (`handleResultClick`) ajoute `focus=`. Tous les flux (clic carte principale, clic contexte d'un drawer multi-marches, clic "Ouvrir la fiche") passent par lui via le prop `onOpen()` de `SearchResultCard`.
2. **Mapping kind→tab/sub aligné** sur les fallbacks déjà présents dans `ExplorationMarcheurPage` lignes 219-247 — pas de divergence.
3. **Pas de cassure d'URL publique** : on n'ajoute des params que sur les routes `/mon-espace/exploration/…` (espace privé). Les routes publiques `/m/:slug` ne sont pas concernées par la recherche globale.
4. **Idempotent** : `useFocusFromUrl.consume()` strippe `focus/marcheId/tab/sub/sensory` après application (déjà en place ligne 50-58), donc pas de pollution de l'historique.
5. **Aucune modif côté RPC, hooks, ou autres composants** — uniquement la couche routing de l'overlay.

## Hors-scope

- Pas de touche aux RPC `search_global` ni `useGlobalSearch`.
- Pas de modif de `SearchResultCard`, `FocusHalo`, `useFocusFromUrl`, `ExplorationMarcheurPage`.
- Pas de changement visuel.

Aucune question bloquante : la mécanique cible existe déjà, il manque juste les query params côté émetteur. Si tu valides, je l'applique en build mode.
