# Pack Vivant — Téléchargement des espèces collectées

## Promesse de marque

> **« Téléchargez le Pack Vivant de votre marche : chaque espèce, chaque trace GPS, chaque photo — prêt à analyser, cartographier, publier. »**

Un seul bouton, un seul fichier `.zip` daté au nom de la marche. Trois niveaux d'accès, trois profondeurs de pack — même rituel pour tout le monde.

## Le Pack Vivant (.zip)

```text
pack-vivant_<slug-marche>_<date>.zip
├── 01_LISEZ-MOI.pdf              ← rapport illustré "wahouh"
├── 02_especes.xlsx               ← classeur 3 onglets
├── 03_observations.geojson       ← QGIS / uMap / Google Earth
├── 04_observations.kml           ← Google Earth grand public
├── 05_darwin-core/               ← archive DwC-A (science / GBIF-ready)
│   ├── meta.xml, eml.xml, occurrence.txt, multimedia.txt
├── 06_photos/                    ← miniatures marcheurs + URLs iNat
└── 07_metadata.json              ← provenance, dates de collecte, rayons
```

### 02_especes.xlsx (cœur analytique, 3 onglets)

| Onglet | Granularité | Colonnes principales |
|---|---|---|
| **Synthèse** | 1 ligne / espèce | nom_scientifique, nom_fr, taxon (règne/classe/famille), nb_observations, nb_observateurs, 1re_date, dernière_date, lat_centroïde, lng_centroïde, sources (marcheur/iNat), niveau_trophique, statut_UICN, indicateur_sentinelle |
| **Observations** | 1 ligne / sighting | id, espèce_sci, espèce_fr, date, lat, lng, précision_m, observateur, source (marcheur \| iNat), url_photo, url_inat, marche_id, waypoint |
| **Métadonnées** | clé/valeur | nom marche, organisateur, dates événement, rayon collecte, nb participants, dates de synchronisation iNat, version du Pack |

GPS obligatoire sur chaque ligne de l'onglet Observations → analyses de fréquence, hotspots, doublons, raréfaction directement dans Excel/R/Python.

### 01_LISEZ-MOI.pdf (rapport éditorial)

Une page de garde + 4 doubles-pages :
1. **Empreinte** — carte stylisée + chiffres clés (espèces, observations, observateurs, km²)
2. **Top espèces** — 10 espèces les plus observées, photo + nom FR + petit texte
3. **Sentinelles & rares** — UICN ≠ LC, endémiques, indicateurs trophiques
4. **Méthode & sources** — rayon, dates de sync, comment lire les fichiers, mention iNaturalist / GBIF / marcheurs

Charte : Papier Crème / Forêt Émeraude selon thème, jamais d'affichage brut de `commonName` (passe par `<SpeciesName />`).

## Trois niveaux d'accès

| Qui | Où | Contenu |
|---|---|---|
| **Visiteur public** (page `/m/:slug` publiée) | Bouton « Télécharger le rapport » | Uniquement `01_LISEZ-MOI.pdf` — démonstration de valeur immédiate, virale |
| **Marcheur participant** | Bouton « Mon Pack Vivant » sur la page exploration | PDF + `02_especes.xlsx` + `06_photos/` — herbier numérique personnel |
| **Organisateur / admin** | Action « Exporter Pack Vivant complet » dans l'admin de l'événement | **Tout le .zip**, y compris GeoJSON, KML, Darwin Core Archive |

Le bouton public reste actif uniquement si la marche est publiée (toggle existant). RLS / RPC `SECURITY DEFINER` filtrent côté serveur — pas de fuite de PII (les observateurs publics sont anonymisés en « Marcheur·euse #123 » sauf consentement).

## Sources fusionnées (dédup stricte)

Réutilise la logique déjà en place :
- `marcheur_observations` (sightings validés des participants)
- `biodiversity_snapshots` (espèces iNat dans le rayon événement, **tous** snapshots — pas latest only)
- Dédup par `scientific_name` normalisé NFD lowercase
- Enrichissement : `useFrenchSpeciesNamesAuto` (FR), classification trophique (`backfill-snapshots-taxonomy`), statut UICN si dispo

Coordonnées GPS :
- marcheur : EXIF photo ou waypoint
- iNat : `latitude`/`longitude` du snapshot
- Une observation sans GPS est exclue de GeoJSON/KML/DwC, mais conservée dans Excel avec colonne `gps_manquant=true`

## Architecture technique

### Edge Function `generate-pack-vivant`
- Input : `{ exploration_id | marche_event_id, level: 'public' | 'walker' | 'organizer' }`
- Auth : JWT validé, RPC SECURITY DEFINER pour récupérer données filtrées par niveau
- Génère le .zip en streaming (JSZip via `npm:`), retourne URL signée Storage (bucket `pack-vivant`, TTL 24 h)
- Sources : RPC `get_exploration_species_count` étendu + nouvelle RPC `get_exploration_observations_export(level)` qui joint snapshots ∪ marcheur_observations avec PII filtrée

### Génération PDF
- Côté edge function avec `pdf-lib` (npm:) — gabarit léger, polices embarquées
- Le PDF public est mis en cache Storage (régénéré quand le snapshot iNat change > 5 %)

### Bouton UI
- Composant `<PackVivantButton variant="public|walker|organizer" />` réutilisable
- États : Idle → Préparation (skeleton + texte poétique « Composition de votre Pack Vivant… ») → Téléchargement
- Toast succès + lien Storage signé

### Storage bucket
- `pack-vivant` (privé), policies : insert par service_role uniquement, select via URL signée

## Critères de succès

1. Un organisateur reçoit un .zip prêt à présenter à un partenaire en < 30 s
2. Un chercheur ouvre le DwC-A directement dans son outil habituel sans nettoyage
3. Un visiteur de la page publique télécharge un PDF qui donne envie d'organiser sa marche
4. Tout sighting du Pack a soit GPS, soit le flag `gps_manquant`
5. Aucune fuite PII : les exports publics anonymisent les observateurs

## Hors scope (V1)

- Pas de mise à jour live du Pack après nouvelles observations (régénération à la demande)
- Pas d'envoi par email automatique (juste URL signée)
- Pas de personnalisation graphique du PDF par l'organisateur (V2)
