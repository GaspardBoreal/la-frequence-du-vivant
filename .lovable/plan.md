# Géolocalisation réelle + comptage cohérent des observations iNat

## Diagnostic confirmé

### 1. Carte : 2 points au lieu de 3
`useSpeciesMarches` renvoie `marche.latitude/longitude` (centre de la marche). Les marches **DEVIAT C 863** et **DEVIAT C 865** ont quasi-identiques `lng = 0.008856` (à 30 m) → leurs marqueurs se confondent. Or les 3 vraies orchidées sont espacées de ~120 m : il faut afficher la **GPS réelle iNat** de chaque observation, pas le centre de la marche.

### 2. Simulateur : "2" au lieu de 3+
`SimulateurBiodiversite` lit uniquement `biodiversity_snapshots.species_data[].observations`. Le snapshot date d'avant les 3 obs laurence + 15 Gaspard de ce jour → il sous-compte. **Ne lit pas `marcheur_observations`**.

### 3. Compteur fiche : "4 obs / 2 marcheurs"
Cohérent côté UI (3 marcheur_observations + 1 photo Gaspard agrégée du snapshot), mais **Gaspard a 15+ obs pyramidalis** dans les snapshots iNat — son backfill n'a jamais tourné. Le cron quotidien le fera demain. Aucune action immédiate ici.

---

## Plan en 2 étapes

### Étape 1 — Persister le GPS réel iNat sur `marcheur_observations`

**1.a Migration DB**
```sql
ALTER TABLE public.marcheur_observations
  ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;
```

**1.b Edge function `backfill-marcheur-inaturalist`**
Stocker `oLat`/`oLng` (déjà calculés ligne 137-138) dans les nouvelles colonnes.

**1.c Backfill rétroactif sur les 12 lignes déjà insérées**
RPC SQL ponctuelle qui ré-appelle iNat API pour chaque `inaturalist_observation_id` non null sans GPS, et remplit `latitude`/`longitude`. Ou plus simple : relancer la fonction edge sur cette exploration après le déploiement (idempotent via la contrainte unique).

### Étape 2 — Afficher le GPS réel sur la carte + corriger le simulateur

**2.a `useSpeciesMarches`**
Quand une `marcheur_observations` a un `latitude`/`longitude` propre, retourner **une ligne par observation** (pas une par marche), avec ses GPS réels au lieu du centre de la marche. Le `marcheId` reste pour le contexte. Résultat : 3 marqueurs distincts pour pyramidalis dans cette exploration.

**2.b Simulateur**
Localiser le composant simulateur (probablement dans `src/components/community/exploration/synthese/` ou similaire). Étendre son hook source pour fusionner :
- `biodiversity_snapshots.species_data[]` (existant)
- `marcheur_observations` groupées par `species_scientific_name` (compte distinct par `inaturalist_observation_id` ou par `id` de la ligne)

Le total "Total individus" et la valeur par espèce intègrent alors les 3 obs laurence (et les 15 Gaspard une fois son backfill exécuté).

---

## Vérification post-déploiement

```sql
SELECT inaturalist_observation_id, latitude, longitude
FROM marcheur_observations
WHERE species_scientific_name = 'Anacamptis pyramidalis'
  AND marcheur_id = '4fc3cf86-6602-4530-a255-3a6ccdd7eda4';
```
Attendu : 3 lignes avec GPS distincts (lng ≈ 0.00829 / 0.00893 / 0.00938).

Côté UI : carte affiche 3 marqueurs séparés ; simulateur passe de 2 à 3 (puis ≥18 quand Gaspard est backfillé demain).

---

## Notes

- Pas de changement RLS nécessaire (colonnes ajoutées sur table existante).
- Pas de régression : `latitude`/`longitude` nullables, fallback sur `marche.lat/lng` côté UI si null.
- Le compteur "4 obs / 2 marcheurs" se résoudra de lui-même demain matin via le cron 03:30 (Gaspard sera backfillé), pas besoin d'action maintenant.

Confirme et je lance.
