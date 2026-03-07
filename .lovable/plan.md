

# Methode d'echantillonnage ultra-fine pour detecter de vrais Silences

## Diagnostic du probleme actuel

Le Radar scanne avec un rayon de **2km** (bbox ~16 km²). En France rurale, meme une zone de 16 km² capte quasi toujours quelques observations GBIF. Les phases Loupe (0.5km) et Microscope (0.2km) n'aident que si elles tombent pile sur un vide -- mais elles ne scannent que 4 sous-points autour des zones faibles, ce qui reste un echantillonnage tres lache.

## Nouvelle strategie : "Grille stochastique"

Au lieu de scanner en etoile (8 directions), utiliser une **grille dense de micro-points** avec des rayons beaucoup plus petits :

```text
Phase 1 — MAILLAGE (grille 5×5 de 3km d'espacement)
  25 points disposes en grille carree centree sur l'utilisateur
  Rayon de scan : 0.3km (bbox ~600m × 600m = 0.36 km²)
  Couverture : zone de 12km × 12km

Phase 2 — ZOOM (si 0 silence trouve)
  Prendre les 8 zones les plus faibles
  Generer 4 sous-points autour de chacune a 0.8km
  Rayon de scan : 0.1km (bbox ~200m × 200m = 0.04 km²)
  32 points supplementaires

Phase 3 — NANO (si toujours 0 silence)
  Prendre les 6 zones les plus faibles de Phase 2
  Generer 4 nano-points a 0.3km
  Rayon de scan : 0.05km (bbox ~100m × 100m)
  24 points supplementaires
```

A 100m de rayon, on scanne l'equivalent d'un champ ou d'un bois. La probabilite de trouver de vrais vides est tres elevee en zone rurale.

## Budget API

- Phase 1 : 25 appels
- Phase 2 : 32 appels (conditionnel)
- Phase 3 : 24 appels (conditionnel)
- **Max : 81 appels** `limit=0` -- reste leger

## Modifications

### `supabase/functions/detect-zones-blanches/index.ts`

1. Remplacer la Phase 1 "etoile 8 directions × 3 distances" par une **grille 5×5** avec espacement de 3km et rayon de scan 0.3km
2. Phase 2 : 8 zones les plus faibles → 4 sous-points chacune, rayon 0.1km
3. Phase 3 : 6 zones les plus faibles → 4 nano-points, rayon 0.05km
4. Conserver le tagging `resolution` (`maillage` | `zoom` | `nano`)
5. Reduire le geocoding aux seules zones blanches + les 5 plus faibles (economie d'appels Nominatim)

### `src/hooks/useDetecteurZonesBlanches.ts`

- Mettre a jour les labels de phase ("Maillage 600m...", "Zoom 200m...", "Nano 100m...")

### `src/components/zones-blanches/DetecteurZonesBlanches.tsx`

- Adapter la legende aux nouvelles resolutions
- Les marqueurs existants fonctionnent deja avec le champ `resolution`

