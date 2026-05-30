## Problème

Sur l'onglet **Synthèse → Pouls du vivant**, la courbe cumulative affiche **72 espèces** alors que :
- le rayon paramétré sur la marche « Patio végétalisé ISEG » est **50 m** (override de `marches.radius_m`)
- le compteur sous le titre montre déjà correctement **6 espèces** (via `overrideTotalSpecies`)
- les cartes Marcheurs/iNat affichent aussi 6/6

## Cause

Dans `EventBiodiversityTab.tsx` (l. 182-194), la query `event-biodiversity-snapshots-all` charge les snapshots **bruts** (radius_meters = 500), puis les passe **tels quels** à `<BiodiversityEvolutionChart snapshots={snapshots} />`. Le hook `useBiodiversityEvolution` parcourt alors `snapshot.species_data[]` sans filtrer par GPS/rayon — d'où les 72 points cumulés issus de l'iNat 500 m.

Seul `overrideTotalSpecies` est patché côté header, mais la **série** (cumul + barres journalières) n'est pas filtrée. Idem `byDay` → le drawer du jour affiche aussi des espèces hors rayon.

## Correctif

Filtrer côté lecture les snapshots ET les `marcheur_observations` selon le contexte radius/coordonnées de chaque marche (`marcheCtxById`), en réutilisant les utilitaires existants `isSpeciesWithinRadius` / `isObservationWithinRadius` créés pour la Carte/L'Œil. Aucune régénération de snapshot.

### 1. `src/components/community/EventBiodiversityTab.tsx`

Ajouter, juste après la query `snapshots`, un memo `filteredSnapshots` :

```ts
const filteredSnapshots = useMemo(() => {
  if (!snapshots?.length || !marcheCtxById) return snapshots;
  return snapshots.map(snap => {
    const ctx = marcheCtxById.get(snap.marche_id);
    if (!ctx) return snap;
    const geoCtx: MarcheGeoCtx = {
      latitude: ctx.latitude,
      longitude: ctx.longitude,
      radius_m: ctx.radius_m,
      snapshot_radius_m: snap.radius_meters,
    };
    const filteredSp = (snap.species_data || []).filter(sp => isSpeciesWithinRadius(sp, geoCtx));
    return { ...snap, species_data: filteredSp };
  });
}, [snapshots, marcheCtxById]);
```

Puis remplacer `snapshots={snapshots}` par `snapshots={filteredSnapshots}` dans les deux `<BiodiversityEvolutionChart>` (l. 586 sous-onglet Synthèse, l. 665 sous-onglet Taxons).

### 2. `marcheCtxById` doit fournir `latitude/longitude/radius_m`

Vérifier que la query `exploration-marche-ctx` retourne déjà ces champs (sinon ajouter le SELECT). Le `MarcheGeoCtx` ne filtre pas si `latitude == null`, donc compat ascendante préservée.

### 3. Effet de bord positif

- `byDay` est dérivé de la même série → le drawer « Détails du jour » s'aligne automatiquement.
- Mode « Observations » : le compteur d'obs journalier reflète aussi le rayon.
- L'`overrideTotalSpecies` reste utile car il vient du pool unifié (snapshots ∪ marcheur_observations dédupliqué).

### Pas dans le scope

- Ne pas régénérer `biodiversity_snapshots` (politique « filtre côté lecture » déjà actée).
- Pas de changement RPC ni de migration.
- Pas de modif visuelle de la courbe.

## Fichiers touchés

- `src/components/community/EventBiodiversityTab.tsx` (1 memo + 2 props remplacées)
