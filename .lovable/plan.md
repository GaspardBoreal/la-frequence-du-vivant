# Ajout du nom commun dans le Pack Vivant

## Objectif

Insérer une colonne **`nom_commun_fr`** juste après `nom_scientifique` dans **tous** les fichiers du Pack Vivant, pour que l'utilisateur lise immédiatement « Mésange charbonnière » à côté de « Parus major ».

## Source du nom commun

Réutiliser la chaîne FR déjà en place dans l'app :
1. `species_translations.common_name_fr` (table publique, RLS open) — source canonique
2. Fallback : `common_name` stocké dans `marcheur_observations` ou `biodiversity_snapshots.species_data` (souvent EN)
3. Fallback ultime : chaîne vide (jamais le nom scientifique répété)

Dans la RPC `get_exploration_export_data`, faire un `LEFT JOIN species_translations ON lower(scientific_name) = lower(st.scientific_name)` et exposer `common_name_fr` sur chaque ligne d'observation **et** sur chaque ligne d'espèce dédupliquée.

## Fichiers du Pack à mettre à jour

| Fichier | Position de la colonne |
|---|---|
| `02_especes.xlsx` — onglet **Synthèse** | colonne B : `nom_commun_fr` (après A=`nom_scientifique`) |
| `02_especes.xlsx` — onglet **Observations** | colonne C : `nom_commun_fr` (après B=`espèce_sci`) |
| `03_observations.geojson` | properties : `scientific_name`, **`common_name_fr`**, puis le reste |
| `04_observations.kml` | Placemark `<name>` = `nom_commun_fr || scientific_name` ; description enrichie |
| `05_darwin-core/occurrence.txt` | colonne `vernacularName` (terme DwC standard) juste après `scientificName` |
| `01_LISEZ-MOI.pdf` | Top espèces : afficher `nom_commun_fr` en gras + `scientific_name` en italique dessous |
| `07_metadata.json` | rien à changer |

## Changements techniques

### 1. Migration SQL (RPC `get_exploration_export_data`)
- Ajouter `LEFT JOIN public.species_translations st USING (scientific_name)` (normalisation lowercase) dans les deux CTE (`obs_marcheur`, `obs_inat`)
- Exposer `common_name_fr` dans chaque ligne du JSON retourné (`observations[]` et `species[]`)
- Aucun changement de signature, aucun changement RLS

### 2. Edge function `generate-pack-vivant`
- Lire `common_name_fr` sur chaque observation/espèce
- Excel (xlsx) : insérer la colonne en position 2 dans les 2 onglets, en-tête `Nom commun (FR)`
- GeoJSON : ajouter la propriété
- KML : `<name>` = nom FR si présent, sinon scientifique ; description « *Parus major* »
- DwC `occurrence.txt` : ajouter `vernacularName` à `meta.xml` et au TSV
- PDF Top espèces : ligne `**Mésange charbonnière** — *Parus major*`

### 3. UI
- Aucun changement (`PackVivantButton` inchangé)

## Critères de validation

- Ouvrir l'Excel → colonne B = noms FR lisibles pour 100% des espèces ayant une traduction
- Ouvrir le KML dans Google Earth → punaises affichent le nom FR
- Ouvrir le GeoJSON dans QGIS → label sur `common_name_fr`
- PDF : page « Top espèces » montre bien les deux noms
- DwC : `vernacularName` présent et conforme au standard

## Hors scope

- Pas d'auto-traduction à la volée dans l'edge function (on prend ce qui est déjà en cache `species_translations` ; les manquants resteront vides et seront comblés par les vues UI qui déclenchent `translate-species`)
