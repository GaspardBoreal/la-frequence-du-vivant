

## Corriger l'incohérence des compteurs : 211 vs 17+8+5

### Cause racine

Le problème est un **rayon de recherche incorrect** dans l'edge function `collect-event-biodiversity`.

| Vue | Rayon utilisé | Résultat |
|-----|---------------|----------|
| Vivant (par marche) | `radius: 0.5` (0.5 km) | 17, 8, 5 espèces ✅ |
| collect-event-biodiversity | `radius: 500` (500 km !) | 211 espèces ❌ |

L'edge function `biodiversity-data` interprète le radius en **kilomètres** (passé directement aux API iNaturalist/eBird/GBIF). La valeur `500` signifie donc un rayon de **500 km**, qui capture toute la biodiversité de la moitié sud de la France. C'est pourquoi les 3 snapshots contiennent exactement les mêmes 211 espèces.

Le tab "Vivant" dans `MarcheDetailModal.tsx` utilise `radius: 0.5` (500 mètres), ce qui donne les bons résultats locaux.

### Correction

**Fichier** : `supabase/functions/collect-event-biodiversity/index.ts` (ligne 137)

```ts
// AVANT
radius: 500,

// APRÈS  
radius: 0.5,
```

Et ajuster le champ stocké pour cohérence (ligne 169) :

```ts
// AVANT
radius_meters: 500,

// APRÈS
radius_meters: 500, // 0.5 km = 500m, cohérent
```

Le `radius_meters: 500` reste correct (0.5 km = 500 m).

### Nettoyage des données existantes

Les 3 snapshots actuels (tous avec 211 espèces, créés le 2026-04-02) sont incorrects. Après déploiement du fix, l'utilisateur devra re-déclencher la collecte via le bouton "Révéler l'empreinte". Le rate limiting de 24h sera déjà passé ou pourra être contourné puisque les snapshots auront > 24h.

**Alternative** : supprimer les snapshots erronés via une migration SQL pour permettre une recollecte immédiate.

### Résultat attendu

- Empreinte/Carte : affichera le nombre correct d'espèces uniques (≤ 17+8+5 = 30 max, probablement ~25 après dédoublonnage)
- Cohérence parfaite avec les vues Vivant par marche

