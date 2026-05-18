# Faisabilité d'un rayon d'observation très petit (5 / 10 / 15 m)

Réponse courte : **techniquement non recommandé en dessous de ~25 m**, et **15 m est le plancher raisonnable** à proposer dans l'UI — uniquement comme "zoom expert" assumé, jamais comme valeur par défaut.

## 1. Ce qui borne réellement la précision

### a) Observations iNaturalist (API)
- Champ `positional_accuracy` typiquement renvoyé entre **5 et 50 m** en plein air, **20–100 m** sous canopée / en ville.
- Champ `geoprivacy` / `coordinates_obscured` : pour les espèces sensibles, iNat **floute volontairement** les coordonnées sur un carré d'environ **0,2°** (~20 km). Ces points sont mathématiquement inutilisables à <500 m — ils tomberont systématiquement hors d'un cercle de 5–15 m, même quand l'observation a réellement eu lieu sur la parcelle.
- L'app **n'exploite pas aujourd'hui** `positional_accuracy` ni `coordinates_obscured` (`rg` ne les trouve nulle part dans `supabase/functions` ni `src`). Donc on ne sait pas distinguer un point précis à 5 m d'un point flouté à 20 km : à 10 m de rayon, on jetterait du vrai et on garderait du faux sans le savoir.

### b) Photos smartphone (EXIF)
- GPS smartphone moderne ciel ouvert : **3–8 m** (bon cas), **10–30 m** courant, **>50 m** en zone dense / intérieur.
- Mémoire projet `ios-gps-stripping-known-issue` : sur iOS, l'upload via `<input file>` **strippe le GPS**. Beaucoup de photos n'ont aucune coordonnée — celles qui en ont passent par `geolocation` device (précision typique 10–50 m).
- À 5 ou 10 m, **la moitié des photos d'une même placette tomberont dehors** alors qu'elles ont été prises à 2 m de l'observateur.

### c) Cadastre LEXICON
- LEXICON renvoie la parcelle cadastrale du point. Une parcelle de potager/jardin fait typiquement **100 à 2 000 m²**, soit un rayon équivalent de **6 à 25 m**.
- Donc un rayon "parcelle" cohérent avec LEXICON commence vers **15–25 m**, pas en dessous.

## 2. Conclusion par valeur

| Rayon | Faisabilité | Commentaire |
|------|-------------|-------------|
| **5 m**  | Non | Sous le bruit GPS de tous les capteurs. Faux négatifs massifs. |
| **10 m** | Non recommandé | Possible uniquement si on filtre sur `positional_accuracy ≤ 10` et qu'on **exclut** les points obscurcis — ce que l'app ne fait pas encore. |
| **15 m** | Acceptable comme **plancher expert** | Couvre une placette / un carré de potager. À condition d'afficher un avertissement "précision GPS limite". |
| **25–50 m** | Recommandé pour le cas Point POTAGER | Aligné avec la précision réelle d'un EXIF smartphone et avec une petite parcelle cadastrale. |

## 3. Plan proposé (UI + filtrage)

1. **Étendre `RADIUS_OPTIONS`** (`src/components/biodiversity/RadiusSelector.tsx`) avec `15 m` et `25 m` en tête de liste, gardés visuellement distincts (badge "expert" / couleur ambre) pour signaler la limite de précision.
2. **Baisser `RADIUS_BOUNDS_M.min`** de 50 → 15 dans `src/utils/marcheRadius.ts` (le `clamp` de `useUpdateRadius` suivra automatiquement).
3. **Sous le sélecteur**, quand `radiusM < 50`, afficher un micro-message :  
   *"Précision GPS limite — certaines observations réellement sur la zone peuvent être exclues."*
4. **(Optionnel mais recommandé) Filtrage côté edge function `biodiversity-data`** :
   - Récupérer `positional_accuracy` et `coordinates_obscured` depuis iNat.
   - Quand `radius_m ≤ 50` : exclure les observations `coordinates_obscured = true` et celles dont `positional_accuracy > radius_m × 2`.
   - Sans ce filtre, les petits rayons restent affichables mais structurellement bruités.

Pas de 5 m ni 10 m exposés dans l'UI : ce serait promettre une précision que ni iNat ni le smartphone ne peuvent tenir.

## Détails techniques

- Fichiers concernés : `src/components/biodiversity/RadiusSelector.tsx`, `src/utils/marcheRadius.ts`, éventuellement `supabase/functions/biodiversity-data/index.ts` pour le filtrage qualité.
- Le `RADIUS_BOUNDS_M.max` reste à 50 000 m, inchangé.
- Aucun changement de schéma BDD nécessaire (la colonne `radius_m` est déjà un entier en mètres).
- Le filtre qualité iNat est purement additif et n'altère pas les calculs `S` / `individus` existants — il réduit juste le bruit géographique aux petits rayons.
