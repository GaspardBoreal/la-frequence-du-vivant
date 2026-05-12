## 1. Analyse du fichier KML `Marche_Vincent.kml`

Le fichier contient **7 Placemarks** (points GPS) qui représentent chacun **un habitat / une parcelle distincte** sur un même site, situé en **Normandie (Orne)**, autour de la commune de **Tinchebray-Bocage / Saint-Quentin-les-Chardonnets** (lat ≈ 48.825°N, lon ≈ -0.014°E).

### Inventaire des 7 parcelles


| #   | Habitat (description KML) | Latitude | Longitude |
| --- | ------------------------- | -------- | --------- |
| 1   | Ripisylve                 | 48.82799 | -0.01393  |
| 2   | Lisière forêt / champ     | 48.82405 | -0.01187  |
| 3   | Champ ouvert              | 48.82644 | -0.00928  |
| 4   | Lande sèche               | 48.82434 | -0.01680  |
| 5   | Prairie humide            | 48.82570 | -0.01679  |
| 6   | Potager sol vivant        | 48.82631 | -0.01742  |
| 7   | Forêt                     | 48.82519 | -0.01592  |


### Caractéristiques géographiques

- **Centroïde** : 48.8257°N, -0.0146°E
- **Emprise** : ~600 m (Est-Ouest) × ~430 m (Nord-Sud), soit environ **35 hectares**
- **Diversité d'habitats remarquable** : 7 milieux écologiquement très contrastés (zone humide, sèche, forestière, agricole, ripicole, potagère) sur un mouchoir de poche → terrain pédagogique et scientifique exceptionnel pour un protocole "Marches du Vivant".

### Particularités techniques du KML

- Pas de tracé (LineString) — uniquement des points.
- Pas de date ni d'horodatage.
- Chaque Placemark embarque une icône PNG en base64 (identique pour tous, donc pas porteuse d'information).
- Le champ `description` porte le **nom d'habitat** → c'est lui qui doit servir de nom de marche.

---

## 2. Recommandation : nombre de marches à créer

**→ 7 marches, une par parcelle/habitat.**

Justification :

- Chaque point KML représente un **micro-écosystème distinct** identifié par Vincent lui-même (il a pris le soin de les nommer un par un).
- C'est cohérent avec le protocole existant des Marches du Vivant : une marche = un habitat = un relevé biodiversité ciblé (rayon de collecte iNaturalist par défaut 500 m, parfaitement adapté à la taille des parcelles).
- Cela permet ensuite de comparer les **fréquences du vivant** entre habitats (ripisylve vs lande sèche vs potager sol vivant…) — exactement le type de récit fort pour un président de Ver de Terre Production.
- La diversité d'habitats sera visualisée comme un **gradient écologique** dans l'exploration agrégatrice.

Alternative plus légère (non recommandée) : 1 seule marche centroïde — perdrait toute la richesse du découpage par habitat fait par Vincent.

---

## 3. Plan d'exécution

### Étape 1 — Créer l'événement

- **Table** : `marche_events` (via formulaire admin existant `MarcheEventsAdmin`)
- **Nom** : Laboratoire à Ciel Ouvert : Biodiversité & Sols Vivants
- **Type d'événement** : `agroecologique` (cohérent avec le profil Ver de Terre Production)
- **Date** : 1205/2026
- **Localisation** : Tinchebray-Bocage (61) — lat 4/8.8257, lon -0.0146
- **Organisateur** : La Fréquence du Vivant

### Étape 2 — Créer l'exploration

- **Table** : `explorations`
- **Nom** : Laboratoire à Ciel Ouvert : Biodiversité & Sols Vivants
- **Description courte** : "7 habitats contrastés sur 35 ha — diagnostic biodiversité d'une mosaïque agroécologique avec Vincent Levavasseur (Ver de Terre Production)."
- **Coordonnées centroïdes** : 48.8257°N, -0.0146°E
- **Rattachement** : associée à l'événement créé en étape 1 (champ `event_id` ou table de liaison selon schéma actuel — à vérifier sur `MarchesDuVivantExplorationMarcheur` / `useExplorationMarches`).
- **Statut initial** : `draft` (publication ON/OFF respectée selon mémoire `progressive-publishing-system-logic`).

### Étape 3 — Créer les 7 marches (une par parcelle)

Pour chaque Placemark KML, créer une ligne dans `marches` avec :


| Champ                    | Valeur                                                                          |
| ------------------------ | ------------------------------------------------------------------------------- |
| `nom_marche`             | `V. Levavasseur — <habitat>` (ex. "V. Levavasseur — Ripisylve")                 |
| `ville`                  | `Tinchebray-Bocage`                                                             |
| `region`                 | `Normandie`                                                                     |
| `departement`            | `Orne`                                                                          |
| `latitude` / `longitude` | coordonnées exactes du point KML                                                |
| `theme_principal`        | `agroecologique`                                                                |
| `sous_themes`            | `[<habitat>]` (Ripisylve, Lande sèche, etc.)                                    |
| `tags`                   | `["agroécologie", "Ver de Terre Production", "Vincent Levavasseur", <habitat>]` |
| `descriptif_court`       | `Habitat : <description KML> — parcelle de la Marche V. Levavasseur`            |
| `organisateur_id`        | id de l'organisateur Ver de Terre Production                                    |
| Rattachement exploration | via la table de liaison `exploration_marches` (selon schéma)                    |


### Étape 4 — Rattacher Vincent comme marcheur

- Création/identification du profil marcheur "Vincent Levavasseur".
- Trigger existant `participation-validation-trigger` + `marcheur-inaturalist-backfill-logic` se chargeront d'attacher automatiquement ses futures observations iNaturalist aux 7 marches dès qu'il sera enregistré participant.

---

## 4. Détails techniques (pour exécution future)

- **Insertion** : 1 INSERT `marche_events` + 1 INSERT `explorations` + 7 INSERT `marches` + 7 INSERT `exploration_marches` (table de liaison).
- **Source des données** : parser KML côté script Node (pas besoin d'UI dédiée pour cet import ponctuel) → générer un SQL `INSERT` via `supabase--migration` n'est PAS adapté (data, pas schéma) → utiliser `psql` en mode INSERT direct ou l'UI admin existante.
- **Validation GPS** : les 7 points sont contigus (max 600 m d'écart) → ils tomberont tous dans le même rayon de 5 km → la **fusion taxonomique** récemment introduite (`taxonomyMerge.ts`) restera pertinente au niveau exploration agrégée.
- **Hors scope** : pas de modification de schéma DB, pas de nouveau composant UI, pas de migration.

---

## 5. Validation attendue avant exécution

Avant de lancer la création réelle (étapes 1→3), confirmer avec toi :

1. **Date de l'événement** : 12/05/2026
2. **Commune exacte** : Tinchebray-Bocage (61) confirmée 
3. **Organisateur** : créer "Ver de Terre Production" comme nouvelle entrée
4. **OK pour 7 marches** (une par habitat)