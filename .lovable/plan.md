## Carnet Phéno BBCH — v1 (Scénario S1)

Outil de carnet phénologique citoyen branché sur les **échelles BBCH INRAE/AgroPortal**. Quand un marcheur observe une culture suivable, il peut noter son stade de développement (germination → récolte) en 2 taps. Les données alimentent une frise territoriale et préparent les scénarios S2-S5 (croisement biodiv, BSV citoyen, jumeau phénologique).

---

### Périmètre v1 retenu

**Large — 12 cultures suivables** (couvre 90% des cultures déjà observées dans les snapshots) :

| # | Culture | Nom scientifique | Échelle BBCH source | Marches déjà concernées |
|---|---|---|---|---|
| 1 | Vigne | `Vitis vinifera` | `grapevine` | 7 (DEVIAT) |
| 2 | Blé tendre | `Triticum aestivum` | `cereals` | 2 (DEVIAT) |
| 3 | Colza | `Brassica napus` | `oilseedRape` | 2 (DEVIAT) |
| 4 | Tournesol | `Helianthus annuus` | `sunflower` | 1 (Paris) |
| 5 | Féverole | `Vicia faba` | `fabaBean` | 3 (DEVIAT, LATILLÉ) |
| 6 | Betterave | `Beta vulgaris` | `beet` | 1 (Paris) |
| 7 | Chanvre | `Cannabis sativa` | `hemp` | 1 (Paris) |
| 8 | Cerisier | `Prunus avium` | `stoneFruits` | 14 |
| 9 | Prunier | `Prunus domestica` | `stoneFruits` | 25 |
| 10 | Pêcher | `Prunus persica` | `stoneFruits` | 10 |
| 11 | Poirier | `Pyrus communis` | `pomeFruits` | 1 |
| 12 | Fraisier | `Fragaria vesca` | `strawberry` | 1 |
| (bonus) | Olivier | `Olea europaea` | `oliveTree` | 25 (à activer seulement zone méditerranée) |

> Maïs, soja, orge, riz, pomme de terre, tomate, lin : pas encore observés → présents dans le référentiel mais cachés tant qu'aucune observation, pour ne pas polluer l'UX.

---

### Architecture fonctionnelle

```text
┌──────────────────────────────────────────────────────────┐
│  Marcheur observe une espèce (flow contribution actuel)  │
└──────────────────────────┬───────────────────────────────┘
                           ▼
        ┌──────────────────────────────────────┐
        │  Détection auto: scientificName      │
        │  ∈ référentiel BBCH (bbchStages.ts)  │
        └──────────────────┬───────────────────┘
                           ▼ (si match)
        ┌──────────────────────────────────────┐
        │  Bouton « 🌾 Noter le stade phéno »  │
        │  apparaît dans la fiche observation  │
        └──────────────────┬───────────────────┘
                           ▼
        ┌──────────────────────────────────────┐
        │  Drawer PhenoStageSelector           │
        │  Grid 2×5 emoji + label macro BBCH   │
        │  Photo optionnelle (réutilise photo  │
        │  de l'observation si présente)       │
        └──────────────────┬───────────────────┘
                           ▼
        ┌──────────────────────────────────────┐
        │  INSERT public.pheno_observations    │
        │  +5 / +10 Fréquences                 │
        └──────────────────┬───────────────────┘
                           ▼
        ┌──────────────────────────────────────┐
        │  Restitution Synthèse exploration:   │
        │  « Calendrier phéno »                │
        │  gradient + compteurs par stade      │
        └──────────────────────────────────────┘
```

### Référentiel BBCH local

Fichier `src/lib/bbchStages.ts` — pour chaque culture : 10 stades macro (BBCH 0-9) avec libellé FR, emoji, et URI canonique INRAE pour cohérence sémantique future.

```text
0 🌰 Germination      5 🌾 Apparition inflorescence
1 🌱 Levée / feuilles 6 🌸 Floraison
2 🍃 Talles/pousses   7 🫐 Fructification
3 📏 Élongation tige  8 🌾 Maturation
4 🌿 Gainage/bourgeon 9 🍂 Sénescence / récolté
```

Les emojis sont adaptés par culture (vigne → 🍇 en stade 7, blé → 🌾 en 8, etc.) — table de surcharge légère.

### UX

- **Détection auto** : dès qu'une observation match une espèce cultivée du référentiel, badge discret « BBCH » + CTA « Noter le stade » dans la fiche.
- **Drawer mobile-first** : grille 2×5 emoji géante, tap → confirmation → toast Fréquence.
- **Pas d'écran admin v1** : référentiel statique versionné dans le repo.
- **Badge** « Phénologue » dans Impact Stories après 10 observations BBCH.
- **Onglet Synthèse** : module *« Calendrier phéno »* affichant pour chaque culture observée la timeline des stades constatés (gradient vert → or → ambre) avec compteur par stade.

### Données & Sécurité

Nouvelle table `public.pheno_observations` :

| Champ | Type | Note |
|---|---|---|
| `id` | uuid PK | |
| `exploration_id` | uuid | nullable (cas hors exploration) |
| `marche_id` | uuid | nullable |
| `marcheur_id` | uuid | = community_profiles.user_id |
| `species_scientific_name` | text | clef de jointure avec marcheur_observations |
| `crop_key` | text | ex. `wheat`, `grapevine`… |
| `bbch_macro` | smallint 0-9 | stade macro |
| `bbch_label_fr` | text | snapshot lisible |
| `bbch_uri` | text | URI INRAE pour traçabilité sémantique |
| `observed_at` | date | |
| `latitude`, `longitude` | numeric | |
| `photo_url` | text | nullable |
| `source` | text | `manual` v1 |
| `created_at`, `updated_at` | timestamptz | |

GRANTs : `authenticated` (SELECT/INSERT/UPDATE/DELETE conditionné `marcheur_id = auth.uid()`), `anon` SELECT si exploration publique, `service_role` ALL. RLS via `has_role` + jointure exploration publique pour la lecture publique.

### Hors scope v1

- Pas d'appel SPARQL live vers `rdf.codex.cati.inrae.fr` (référentiel local figé).
- Pas de croisement automatique pollinisateurs × stade (S3).
- Pas de génération BSV PDF (S4).
- Pas de modèle degrés-jours Open-Meteo (S5).
- Pas d'édition admin du référentiel.
- Pas de promotion globale dans la home (déploiement progressif via DEVIAT d'abord).

### Livrables

1. `src/lib/bbchStages.ts` — référentiel 12 cultures × 10 stades + URI INRAE.
2. Migration Supabase `pheno_observations` (table + GRANTs + RLS + trigger updated_at).
3. Hook `usePhenoObservations(explorationId)` (live via React Query + invalidation).
4. Composant `<PhenoStageSelector species={...} onSave={...} />` (drawer mobile).
5. Intégration dans le flow contribution marcheur (fiche observation + bouton conditionnel).
6. Composant `<PhenoCalendar />` dans l'onglet Synthèse d'exploration.
7. Bonus Fréquences + badge « Phénologue » (Impact Stories).
8. Mémoire projet : `mem://features/phenologie/carnet-pheno-bbch-logic`.
