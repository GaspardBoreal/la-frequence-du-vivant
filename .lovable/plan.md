## Objectif
Garantir que tout clic sur un résultat d’espèce — y compris un contexte précis comme « ROQUE GAGEAC / Jardin » — ouvre toujours la bonne exploration/le bon événement sur **Biodiversité > Taxons observés**, avec la **bonne marche sélectionnée** et le **focus halo sur la fiche espèce**.

## Diagnostic
Le flux actuel est fragile à deux endroits :

1. **Émetteur de navigation trop permissif**
   - `src/components/search/GlobalSearchOverlay.tsx`
   - Le clic reconstruit la destination à partir de `result.route`, puis ne force `tab/sub/focus` que partiellement.
   - La logique dépend donc à la fois du SQL (`search_global`) et de l’overlay React pour définir la destination finale.

2. **Consommation du deep-link trop tôt**
   - `src/components/community/ExplorationMarcheurPage.tsx`
   - Les paramètres `focus/marcheId/tab/sub` sont consommés très vite, même si l’exploration résolue ou la liste des marches n’est pas encore prête.
   - Résultat possible : application partielle du deep-link, puis impossibilité de rejouer correctement la sélection de marche / sous-onglet.

## Correctif proposé
### 1) Canonicaliser la navigation de recherche
Dans `src/components/search/GlobalSearchOverlay.tsx` :
- Extraire un builder unique du type `buildSearchTarget(result, opts)`.
- **Ne plus faire confiance au querystring déjà présent dans `result.route` pour les résultats focusables.**
- Pour `species`, construire systématiquement une URL canonique :
  - `focus=species:<id>`
  - `tab=biodiversite`
  - `sub=taxons`
  - `marcheId=<marche cliquée>` si le contexte en fournit une
  - route prioritaire vers `event-<eventId>` si disponible, sinon exploration ciblée
- Même principe pour `testimony`, `text`, `practice`, `event` avec leur mapping dédié.

Effet attendu : le clic sur un contexte espèce n’hérite plus d’un état ambigu ; il émet toujours une URL déterministe.

### 2) Rendre l’application du focus idempotente côté page cible
Dans `src/components/community/ExplorationMarcheurPage.tsx` :
- Introduire une notion de **focus prêt à être appliqué**.
- Ne consommer l’URL (`consume()`) qu’une fois ces prérequis réunis :
  - si route `event-...`, l’`explorationId` résolu est disponible
  - si `focus.marcheId` existe, `explorationMarches` est chargée
- Appliquer alors, dans le même cycle logique :
  - `activeGlobalTab = biodiversite` pour une espèce
  - `pendingBiodiversitySub = taxons`
  - `activeStepIndex` correspondant à `marcheId`
  - `focusTarget = species:<scientificName>`
- Protéger avec une clé de consommation/apparition pour éviter les doubles applications.

Effet attendu : même si les données arrivent en différé, le deep-link espèce est rejoué au bon moment et ne retombe plus sur l’onglet par défaut.

### 3) Garder le contrat de focus simple et unique
- L’overlay devient la **source de vérité de l’URL de navigation**.
- `useFocusFromUrl` + `ExplorationMarcheurPage` deviennent la **source de vérité de l’application UI**.
- Le SQL `search_global` peut continuer à fournir une route par défaut, mais l’UI ne doit plus dépendre de son querystring pour les clics contextuels d’espèces.

## Fichiers concernés
- `src/components/search/GlobalSearchOverlay.tsx`
- `src/components/community/ExplorationMarcheurPage.tsx`

## Validation
Je validerai le correctif sur les parcours suivants :
1. Depuis `/marches-du-vivant/mon-espace`, recherche `catalpa`
2. Ouvrir `Catalpa du sud`
3. Cliquer `ROQUE GAGEAC / Jardin`
4. Vérifier :
   - ouverture du bon événement
   - onglet global `Biodiversité`
   - sous-onglet `Taxons observés`
   - marche `ROQUE GAGEAC / Jardin` sélectionnée
   - halo sur `Catalpa du sud`
5. Refaire le même test sur au moins une autre espèce multi-marches pour éviter une régression locale

## Détails techniques
```text
SearchResultCard context click
  -> GlobalSearchOverlay.buildSearchTarget()
     -> /exploration/event-<id>?focus=species:...&tab=biodiversite&sub=taxons&marcheId=...
  -> ExplorationMarcheurPage waits until target data is ready
     -> set global tab
     -> set biodiversity sub-tab
     -> set active step
     -> trigger halo
     -> consume URL once applied
```

## Résultat attendu
Le bug ne sera plus traité comme un cas particulier de `catalpa`, mais comme un **contrat robuste de deep-link espèce** valable pour toutes les recherches d’espèces et tous les contextes multi-marches.