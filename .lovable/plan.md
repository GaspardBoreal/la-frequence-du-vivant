

# Fix: noms de ville manquants sur les tooltips (toutes zones)

## Cause racine

Le code edge function envoie **8 requetes Nominatim en parallele** par batch (`batchSize = 8`). Or Nominatim impose une limite stricte de **1 requete par seconde**. Les requetes excedentaires sont rejetees (HTTP 429 ou timeout), et la fonction `reverseGeocode` retourne alors les coordonnees brutes (`46.513, 0.414`) au lieu du nom de ville.

Avec 57 zones, ca fait ~7 batchs de 8 requetes simultanees. La majorite echouent silencieusement.

## Correctif

### `supabase/functions/detect-zones-blanches/index.ts`

1. **Reduire `batchSize` de 8 a 2** dans `batchGeocode` — Nominatim tolere 1-2 requetes concurrentes
2. **Augmenter le delai inter-batch a 1200ms** pour respecter la politique d'usage
3. **Ajouter un retry** : si une requete echoue, retenter une fois apres 500ms avant de tomber sur le fallback coordonnees
4. **Executer le geocoding AVANT les species samples** (pas en `Promise.all`) pour eviter que les requetes GBIF interferent avec le timing Nominatim

### Impact performance

- 57 zones / 2 par batch = ~29 batchs × 1.2s = ~35s de geocoding
- C'est trop long. Alternative : **batch de 3 avec 1.1s de delai** = ~21 batchs × 1.1s = ~23s — acceptable vu que le scan GBIF prend deja 10-15s
- Ou mieux : **exécuter geocoding en parallèle du scan GBIF des phases 2/3** pour masquer la latence

### Structure finale du bloc enrichissement

```text
// 1. Geocode ALL zones (batch de 3, 1.1s delai, 1 retry)
await batchGeocode(results, 3);

// 2. PUIS species sampling (blanks + 5 weakest) — en parallele entre eux
await Promise.all([
  ...blanks.map(z => getGbifSample(...)),
  ...weakestNonBlank.map(z => getGbifSample(...)),
]);
```

### Redeploy necessaire

La edge function devra etre redeployee apres modification.

