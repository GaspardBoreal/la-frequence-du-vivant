## Vision

Refonte de la classification des espèces avec un référentiel **sourçable, explicable, auditable** — chaque badge devient une porte d'entrée pédagogique vers la connaissance qui l'a produit. La classification IA passe d'un acte opaque à un **dialogue transparent** entre savoirs locaux, bases publiques et intelligence artificielle.

## Nouveau référentiel — 6 catégories

| Code | Label | Couleur | Définition opérationnelle |
|---|---|---|---|
| `indigene` | Indigène | vert sauge | Naturellement présente en Dordogne ; statut INPN « indigène » ou « cryptogène » |
| `bioindicatrice` | Bio-indicatrice | terracotta | Sa présence/absence renseigne sur un facteur écologique (Ellenberg, IBGN, IBD) |
| `auxiliaire` | Auxiliaire | bleu ciel | Service écosystémique direct : pollinisation, prédation de ravageurs, décomposition |
| `ravageur` | Ravageur | ocre | Atteinte économique aux cultures (référencé EPPO / Ephytia / INRAE) |
| `eee` | EEE | rose-rouge | Liste UE 1143/2014 OU INPN « EEE avérée » France métropolitaine |
| `patrimoniale` | Patrimoniale | violet | Protection légale (arrêté national/régional) OU Liste Rouge UICN France ≥ NT |

**Catégorisation hybride :** une catégorie principale (badge proéminent) + 0 à 2 catégories secondaires (badges discrets). Ex: Pissenlit = `bioindicatrice` (principal) + `indigene` + `auxiliaire`.

## Architecture du référentiel — cascade en 3 niveaux

```text
┌─ NIVEAU 1 — JSON local cure (~250 espèces dordoniennes) ─────────┐
│  Fichier : src/data/species-knowledge-base.json                  │
│  Versionnable, éditable en PR, source la plus rapide & fiable    │
│  Format : { sciName, primary, secondary[], evidence[] }          │
│  Évidences pré-rédigées avec URL INPN/UICN/UE                    │
└─────────────┬────────────────────────────────────────────────────┘
              │ miss
              ▼
┌─ NIVEAU 2 — Enrichissement API (edge function) ──────────────────┐
│  • GBIF Species API → statut taxonomique, distribution           │
│  • iNaturalist /taxa/{id} → conservation_status, establishment   │
│  • Détection EEE par croisement avec liste UE (statique)         │
└─────────────┬────────────────────────────────────────────────────┘
              │ ambiguous / unknown
              ▼
┌─ NIVEAU 3 — IA avec citation obligatoire ───────────────────────┐
│  Lovable AI (gemini-3-flash-preview) avec tool calling strict   │
│  Doit fournir au moins 1 evidence{source,url,quote} ou          │
│  marquer needs_review=true. Pas de classification "à l'aveugle".│
└─────────────────────────────────────────────────────────────────┘
```

## Schéma de données

**Migration SQL** sur `exploration_curations` :

```sql
ALTER TABLE exploration_curations
  ADD COLUMN secondary_categories text[] DEFAULT '{}',
  ADD COLUMN classification_evidence jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN classification_source text DEFAULT 'ai',
    -- 'knowledge_base' | 'gbif' | 'inaturalist' | 'ai' | 'curator'
  ADD COLUMN classification_confidence numeric(3,2),
    -- 0.00 à 1.00
  ADD COLUMN needs_review boolean DEFAULT false;

CREATE INDEX idx_curations_needs_review
  ON exploration_curations(exploration_id) WHERE needs_review = true;
```

**Format `classification_evidence`** (JSON) :
```json
[
  { "source": "INPN", "ref_code": "TAXREF-103027",
    "url": "https://inpn.mnhn.fr/espece/cd_nom/103027",
    "quote": "Statut: Indigène. Protection nationale art. 1.",
    "fetched_at": "2026-05-01" }
]
```

## Fichier `species-knowledge-base.json` — structure

```json
{
  "version": "2026.05.01",
  "species": {
    "Quercus robur": {
      "primary": "indigene",
      "secondary": ["patrimoniale"],
      "evidence": [
        { "source": "INPN", "ref_code": "TAXREF-cdnom-610645",
          "url": "https://inpn.mnhn.fr/espece/cd_nom/610645",
          "quote": "Statut biogéographique : Indigène en France métropolitaine" }
      ],
      "habitat_dordogne": "Forêts de plaine, bocage",
      "notes": "Espèce parapluie historique du bocage périgourdin"
    },
    "Robinia pseudoacacia": {
      "primary": "eee",
      "secondary": ["auxiliaire"],
      "evidence": [
        { "source": "INPN-EEE", "url": "https://inpn.mnhn.fr/espece/cd_nom/103029",
          "quote": "Espèce exotique envahissante avérée — Liste France métropolitaine" }
      ]
    }
  }
}
```

Couvre les ~250 espèces les plus probables en Dordogne (chêne pédonculé, robinier, jussie, loutre, milan noir, pissenlit, pucerons communs, abeilles…). Versionné dans le repo, éditable par PR, **auditable**.

## Edge function refactorisée — `analyze-exploration-species`

```text
1. Auth + curator check (inchangé)
2. Build species pool depuis biodiversity_snapshots (inchangé)
3. Pour chaque espèce :
   a. Lookup dans knowledge-base.json → si trouvé : source='knowledge_base', confidence=1.0
   b. Sinon → fetch GBIF + iNaturalist en parallèle, croise avec liste EEE statique
   c. Sinon → batch IA (max 30 espèces/appel) avec tool schema imposant evidence[]
4. Insert dans exploration_curations avec evidence + source + confidence
5. needs_review=true si confidence < 0.6 OU si evidence.length === 0
```

## UI — composants à créer / refondre

### A. Badge cliquable — `<CategoryBadge />`
Click → ouvre `<ClassificationEvidenceSheet />` (Sheet shadcn) avec :
- Label catégorie + couleur + icône
- Liste des `evidence` : source (logo INPN/UICN/GBIF), citation, lien externe
- Niveau de confiance (jauge)
- Source (knowledge_base / gbif / ai / curator) avec libellé clair
- Si curateur : bouton « Corriger la classification »

### B. Card refondue — multi-badges
```text
┌──────────────┐
│ [photo]      │
│              │
│ Pissenlit    │
│ Taraxacum    │
│ ┌─────────┐  │  ← badge principal (pleine couleur)
│ │ Bio-ind │  │
│ └─────────┘  │
│ ⊕Indigène ⊕Auxiliaire   ← secondaires (outline)
└──────────────┘
```

### C. Filtres — adaptation des chips
- 6 chips au lieu de 5
- Filtre matche `primary OR secondary.includes(cat)`
- Compteur reste contextuel à l'onglet (correctif récent préservé)

### D. Tableau de bord curateur — onglet « Classification »
Nouveau sous-onglet dans Apprendre→L'œil :
- Liste des espèces avec `needs_review=true` en priorité
- Stats globales (nb par catégorie, % couvert par knowledge_base vs IA)
- Bouton « Promouvoir cette classification au knowledge_base » → génère un patch JSON pour PR

### E. Page publique « Dossier vivant » — `/lecteurs/<slug>/dossier-vivant`
Nouveau template public (priorité haute selon votre choix) :
```text
┌─ HÉRO ──────────────────────────────────────┐
│ [Photo signature] Titre exploration         │
│ Sous-titre géopoétique + fréquence du jour  │
└─────────────────────────────────────────────┘

┌─ CHIFFRES VIVANTS ──────────────────────────┐
│ 142 espèces · 6 catégories · 23 sources    │
└─────────────────────────────────────────────┘

┌─ PAR CATÉGORIE (sections déroulantes) ─────┐
│ ▸ 🌿 Indigènes (87) — chênaie périgourdine  │
│ ▸ 🪲 Bio-indicatrices (12) — sols vivants   │
│ ▸ 🐝 Auxiliaires (18) — pollinisateurs…     │
│ ▸ ⚠ EEE (4) — vigilance robinier, jussie    │
│ ▸ 💎 Patrimoniales (6) — loutre, milan noir │
│ ▸ 🌾 Ravageurs (3) — équilibre à veiller    │
│   Chaque carte cliquable → fiche + sources  │
└─────────────────────────────────────────────┘

┌─ CARTE DES OBSERVATIONS ───────────────────┐
│ [Leaflet — markers colorés par catégorie]  │
└────────────────────────────────────────────┘

┌─ SOURCES & MÉTHODE ────────────────────────┐
│ « Cette analyse croise INPN, UICN France,  │
│ GBIF, iNaturalist et un référentiel local  │
│ versionné. Toute classification est        │
│ cliquable pour en voir les preuves. »      │
│ + bouton « Télécharger en PDF »            │
└────────────────────────────────────────────┘
```

Couleurs/typo : Forêt Émeraude (dark) + Papier Crème (light), conformes au design system.

### F. Export PDF dossier
Bouton sur la page publique → réutilise l'infrastructure d'export PDF existante (`pdfExportUtils.ts`) avec template dédié intégrant les sources.

## Plan de livraison (4 phases)

**Phase 1 — Fondations (référentiel + schéma)**
1. Migration SQL (colonnes `secondary_categories`, `classification_evidence`, `classification_source`, `classification_confidence`, `needs_review`)
2. Création `src/data/species-knowledge-base.json` avec 50 espèces dordoniennes seed
3. Création `src/data/eee-france-metropolitaine.json` (liste UE 1143/2014 + INPN)
4. Mise à jour `curationCategories.ts` : 6 nouvelles catégories + couleurs

**Phase 2 — Moteur de classification cascade**
1. Refonte edge function `analyze-exploration-species` avec cascade KB → GBIF/iNat → IA
2. Tool schema IA imposant `evidence[]` non vide
3. Tests unitaires sur quelques cas clés (Quercus robur, Robinia, Lutra lutra, espèce inconnue)

**Phase 3 — UI auditabilité**
1. Composant `<CategoryBadge />` cliquable
2. Composant `<ClassificationEvidenceSheet />`
3. Refonte `<CuratedSpeciesCard />` multi-badges
4. Adaptation chips filtre (6 catégories, match primary OR secondary)
5. Sous-onglet curateur « Classification à réviser »

**Phase 4 — Page publique « Dossier vivant »**
1. Route `/lecteurs/<slug>/dossier-vivant`
2. Template hero + sections par catégorie + carte
3. Bouton export PDF
4. Lien depuis page exploration publique existante

## Pourquoi cette approche

- **Sourçable** : chaque badge a au moins une URL INPN/UICN/UE/iNat consultable
- **Explicable** : la cascade KB→API→IA dit toujours d'où vient la décision
- **Auditable** : `classification_source` + `confidence` + `evidence[]` permettent de rejouer/contester chaque classification
- **Évolutif** : le knowledge-base.json grandit avec les corrections curateur
- **Wahou** : la page publique transforme une donnée scientifique en récit géopoétique avec preuves cliquables — rare dans le paysage des outils naturalistes

## Notes

- Le correctif récent sur les compteurs de chips contextuels est préservé
- Le système de pin/épinglage et de score IA reste inchangé
- Les 5 anciennes catégories (`emblematique`, `parapluie`, `protegee`) sont remappées à la migration : `protegee → patrimoniale`, `parapluie → indigene+secondary patrimoniale`, `emblematique → patrimoniale` (avec `needs_review=true` pour relecture)
- L'effet « wahou » repose sur 3 piliers : transparence radicale (sources), beauté visuelle (Forêt Émeraude + Papier Crème), narration (textes éditoriaux par catégorie)
