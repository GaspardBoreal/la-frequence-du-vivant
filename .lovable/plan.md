# L'œil — Curation IA + Saisie terrain + Galerie magazine

Ce plan transforme **L'œil** en une expérience double (IA + Terrain) débouchant sur une galerie magazine éditoriale et des exports multi-formats (Web public, PDF dossier presse, JSON scientifique).

---

## 1. Architecture générale

```text
L'ŒIL (CeQueNousAvonsVu › Œil)
├── Onglet "Terrain"  ← saisies manuelles ambassadeur/sentinelle (priorité éditoriale)
├── Onglet "Pool observé" ← agrégat GBIF/iNat (existant)
└── Bouton "Analyse IA" → pré-affectation + score + raison

→ Mode "Galerie magazine" (lecture / page publique)
→ Exports : Web /lecteurs/{slug}/decouvertes • PDF dossier • JSON scientifique
```

---

## 2. Base de données

**Nouvelle table `exploration_manual_species`** (saisies terrain)

| Colonne | Type | Notes |
|---|---|---|
| id | uuid PK | |
| exploration_id | uuid FK | |
| marche_event_id | uuid FK NULL | optionnel (rattachement marche) |
| scientific_name | text NULL | |
| common_name | text NOT NULL | |
| gbif_taxon_key | bigint NULL | si validé via GBIF |
| group_taxon | text NULL | oiseau, plante, mammifère… |
| photo_url | text NOT NULL | bucket `manual-species-photos` |
| photo_lat / photo_lng | numeric NULL | EXIF auto |
| observed_at | timestamptz | |
| observer_name | text | profil ou nom libre |
| comment | text NULL | note po\u00e9tique/scientifique |
| source_mode | enum('gbif','free') | |
| created_by | uuid FK profiles | |
| created_at | timestamptz |

RLS : lecture publique exploration publiée, écriture ambassadeur/sentinelle/admin.

**Bucket Storage** `manual-species-photos` (public, RLS par exploration).

**Extension `exploration_curations`** (existant) : ajout colonnes
- `ai_score` int (0–100)
- `ai_reason` text
- `ai_criteria` jsonb (`{iucn:'NT', rarity_local:'rare', umbrella:true, invasive:false}`)
- `source` enum('manual','ai','gbif_pool')

**Table `exploration_ai_analyses`** (cache IA, relançable)
| id | exploration_id | analyzed_at | model | species_analyzed_count | summary jsonb |

---

## 3. Edge Functions

### 3.1 `analyze-exploration-species` (nouvelle)

Auto-déclenchée à l'ouverture de L'œil (si pas d'analyse < 7j) + bouton "Relancer".

Pour chaque espèce du pool agrégé :
1. Lookup IUCN status (via GBIF `/species/{key}` qui inclut threatStatuses)
2. Calcul rareté locale = nombre d'observations GBIF dans rayon 50 km / total département
3. Détection EEE (liste INPI/EEE Dordogne hardcodée + GBIF flag)
4. Heuristique parapluie/indicatrice (groupe taxonomique + criteria)
5. Appel **Lovable AI** (`google/gemini-3-flash-preview`) pour produire :
   - `ai_score` 0-100
   - `ai_reason` (1 phrase courte, ton éditorial Frequency)
   - catégorie suggérée (emblématique / parapluie / EEE / auxiliaire / protégée)

Upsert `exploration_curations` (sense='oeil', source='ai') avec score/raison.
Cache résultat dans `exploration_ai_analyses`.

### 3.2 `gbif-taxon-search` (nouvelle)

Proxy léger GBIF `/species/search?q=` pour autocomplétion saisie manuelle.

### 3.3 `export-decouvertes-pdf` (nouvelle)

Génère dossier presse PDF (puppeteer/pdfkit) à partir de la sélection finale.

### 3.4 `export-decouvertes-json` (nouvelle)

JSON scientifique structuré (Darwin Core compatible).

---

## 4. UI — L'œil (curateurs)

### 4.1 Header
Toggle 3 vues :
- **Sélection finale** (épinglés, vue par défaut)
- **Suggestions IA** (ai_score décroissant, badge étoiles 1–5 + raison au survol)
- **Pool brut** (existant, recherche)

Bouton **"Analyse IA"** (avec indicateur dernière analyse + spinner).
Bouton **"+ Ajouter espèce vue terrain"** (modal saisie manuelle).

### 4.2 Carte espèce enrichie
- Image (taille L)
- Nom commun + scientifique
- **Score IA** : pastille étoiles 1–5 (Sparkles ambré)
- **Raison IA** : tooltip + drawer détail au clic
- Critères : badges IUCN / Rare / EEE / Parapluie
- Catégorie éditable (popover existant)
- Pin toggle (épingle)
- Source : icône (📡 IA / ✋ Terrain / 🌍 Pool)

### 4.3 Modal saisie manuelle
Étapes :
1. **Photo** (obligatoire, drag/upload, EXIF parsé → date/GPS auto)
2. **Identification** :
   - Recherche GBIF (autocomplete) → pré-remplit scientifique/commun/groupe
   - OU bascule "Saisie libre" (juste nom commun + commentaire)
3. **Contexte** : rattacher à une marche (optionnel), observateur (auto = user), commentaire
4. **Aperçu** + Enregistrer

---

## 5. Saisie terrain — points d'entrée additionnels

### 5.1 Marches → Voir (par marche)
Dans `MarcheDetailModal.tsx` (ou équivalent vue marche) ajouter section **"Espèces vues sur le terrain"** avec :
- Liste compacte des espèces manuelles rattachées à cette marche
- Bouton "+ Ajouter" (réutilise même modal, pré-remplit `marche_event_id`)

### 5.2 Empreinte → Taxons observés (transverse)
Nouvel onglet/section **"Taxons observés"** dans la vue Empreinte exploration, listant **toutes** les espèces manuelles + bouton ajout libre (sans marche).

---

## 6. Mode "Galerie magazine éditoriale" (vue lecture)

Vue alternative déclenchée par bouton **"Aperçu galerie"** ou auto sur page publique.

Design :
- **Hero** : grande image de l'espèce la plus emblématique + citation IA
- **Sections par catégorie** (Emblématiques → Parapluie → Auxiliaires → Protégées → EEE)
  - Titre cat\u00e9gorie en typo \u00e9ditoriale (Cormorant Garamond / serif chic)
  - Grille asymétrique : 1 image XL + 2 M + 4 S (mosaïque magazine)
  - Pour chaque espèce : nom, statut IUCN en filigrane, raison IA en italique, photo crédit observer
- **Palette** : Papier Crème / Forêt Émeraude (selon thème actif) + dorure ambrée pour Sparkles
- **Animations** : fade-in au scroll (framer-motion), parallax léger sur images hero
- Footer : crédits observateurs + date analyse IA + lien "Télécharger dossier"

Composant : `OeilGalerieMagazine.tsx`

---

## 7. Page publique `/lecteurs/{event-slug}/decouvertes`

Route déjà décidée. Réutilise `OeilGalerieMagazine` en mode read-only.
- Lit `exploration_curations` épinglées + `exploration_manual_species` validées
- SEO : meta title/description générés (espèce phare + nombre d'espèces)
- Bouton **"Télécharger PDF"** + **"JSON scientifique"** (publics si exploration publiée)

---

## 8. Exports

### 8.1 PDF dossier presse
Mise en page magazine (couverture exploration, sommaire, fiches espèces 1/page, méthodologie, crédits).

### 8.2 JSON scientifique (Darwin Core like)
```json
{
  "exploration": { "id", "name", "dates", "departement" },
  "occurrences": [
    {
      "scientificName", "vernacularName", "kingdom",
      "decimalLatitude", "decimalLongitude",
      "eventDate", "recordedBy",
      "iucnStatus", "basisOfRecord": "HumanObservation|MachineObservation",
      "associatedMedia": ["url"],
      "remarks": "raison IA + commentaire"
    }
  ]
}
```

---

## 9. Hooks frontend

- `useExplorationManualSpecies(explorationId, marcheEventId?)` — CRUD
- `useGbifTaxonSearch(query)` — debounce autocomplete
- `useExplorationAiAnalysis(explorationId)` — état cache + mutation relance
- `useDecouvertesExport(explorationId, format)` — déclenche edge fn

---

## 10. Validations à implémenter (côté validation IA)

Décision par défaut retenue (puisque non répondu) : **Hybride** — top 5 par catégorie pré-épinglés (`source='ai'` + auto-pin), reste visible dans onglet "Suggestions IA" à valider une par une. L'ambassadeur peut désépingler à tout moment.

---

## 11. Livraisons proposées

| # | Contenu |
|---|---|
| **L3a** | Migrations DB (manual_species, ai_analyses, colonnes curations) + bucket storage |
| **L3b** | Edge fn `analyze-exploration-species` + `gbif-taxon-search` + UI L'œil enrichie (3 vues, bouton IA, badges score) |
| **L3c** | Modal saisie manuelle + intégration Marches→Voir + Empreinte→Taxons observés |
| **L3d** | `OeilGalerieMagazine` (vue lecture éditoriale) + page publique `/lecteurs/{slug}/decouvertes` |
| **L3e** | Edge fns export PDF + JSON, boutons téléchargement |

---

## Détails techniques (résumé pour l'implémentation)

- IA via **Lovable AI Gateway** (`google/gemini-3-flash-preview`) — analyse batch toutes les espèces du pool en 1 appel structuré (tool call `categorize_species`).
- IUCN : utiliser GBIF `species/{key}` (`threatStatuses` array) — gratuit, pas d'API key.
- EEE : liste hardcodée espèces invasives Nouvelle-Aquitaine (CEN NA) + flag GBIF `extinct`/`invasive` si dispo.
- Photos terrain : compression côté client (max 1600px) avant upload, EXIF via `exifr`.
- Galerie magazine : framer-motion + grid Tailwind responsive (1 col mobile, 3 col desktop, mosaïque CSS grid-template-areas).
- PDF : `pdf-lib` côté edge function (lightweight, pas de chrome headless).

