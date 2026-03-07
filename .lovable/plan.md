

# Strategie "Microscope" — Detecteur de zones blanches a resolution adaptative

## Le probleme actuel

Chaque point est scanne avec un rayon de **2km** (bbox ~16 km²). Meme en pleine campagne charentaise, une zone de 16 km² capte quasi toujours quelques observations GBIF (oiseaux migrateurs, atlas botaniques departementaux). Le maillage est trop grossier pour detecter les vrais vides.

## Proposition : scan multi-resolution en 3 phases

```text
Phase 1 — RADAR (existant)
  24 points × bbox 2km = vue d'ensemble
  ↓
Phase 2 — LOUPE
  Les 6 zones les plus faibles → 4 micro-points autour de chacune
  24 micro-points × bbox 0.5km (0.8 km²)
  ↓
Phase 3 — MICROSCOPE (si toujours 0 silence)
  Les 4 micro-zones les plus faibles → 4 nano-points
  16 nano-points × bbox 0.2km (0.13 km²)
```

A 0.2km de rayon, on scanne des parcelles de ~500m × 500m. La probabilite de trouver de vrais vides explose, meme en zone rurale.

## Changements

### `supabase/functions/detect-zones-blanches/index.ts`

1. **Apres la Phase 1 (24 points, rayon 2km)** : trier par nombre d'observations croissant, prendre les 6 zones les plus faibles
2. **Phase 2 — LOUPE** : pour chacune des 6 zones faibles, generer 4 sous-points a 1.5km dans les 4 directions cardinales (N/E/S/O). Scanner avec `SCAN_RADIUS = 0.5km`. Total : 24 appels supplementaires
3. **Phase 3 — MICROSCOPE** (conditionnelle, si toujours 0 silence) : prendre les 4 micro-zones les plus faibles, generer 4 nano-points a 0.5km, scanner avec `SCAN_RADIUS = 0.2km`. Total : 16 appels supplementaires
4. **Taguer chaque zone** avec sa `resolution` (`radar` | `loupe` | `microscope`) pour que le front puisse les distinguer visuellement
5. **Supprimer le scan adaptatif 40km** — remplace par cette strategie plus fine et plus pertinente
6. **Scanner aussi le point central** (la position de l'utilisateur) avec rayon 2km

### `src/components/zones-blanches/DetecteurZonesBlanches.tsx`

1. **Marqueurs differencies par resolution** : les points `loupe` en cercle plus petit, les points `microscope` en losange ou cercle encore plus petit, avec opacite differente
2. **Legende enrichie** : afficher "Radar (2km)" / "Loupe (500m)" / "Microscope (200m)" pour expliquer la precision
3. **Indicateur de progression** : comme le scan prend plus de temps (3 phases sequentielles), afficher l'etape en cours ("Phase 1/3 — Radar...", "Phase 2/3 — Loupe sur zones faibles...")

### Budget API total

- Phase 1 : 24 appels (existant) + 1 centre = 25
- Phase 2 : 24 appels (6 × 4)
- Phase 3 : 16 appels (4 × 4, conditionnel)
- **Max : 65 appels** `limit=0` — reste leger car ce sont des comptages sans donnees

