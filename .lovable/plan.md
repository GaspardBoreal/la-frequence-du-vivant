# Note technique d'audit — Algorithme « Origines du vivant »

## Objectif
Produire un document Markdown autonome (`/mnt/documents/note-audit-algorithme-origines.md`) téléchargeable, destiné à un auditeur scientifique externe, décrivant **exhaustivement** la chaîne d'enrichissement biogéographique des espèces (POWO + GBIF + descripteur) telle qu'implémentée dans l'edge function `enrich-species-biogeography` et restituée côté UI/exports.

## Plan du document (≈ 12–15 pages)

### 1. Résumé exécutif (1 p.)
- But de l'algorithme : attribuer à chaque espèce un **pays d'origine** + une **aire native** + un **niveau de confiance** + des **sources citables**.
- Périmètre : règnes Plantae (POWO prioritaire), Animalia/Fungi/Autres (GBIF strict).
- Stockage : table `species_biogeography_kb` (cache 180 jours).
- Restitution : hook `useExplorationBiogeography`, panneaux UI `OriginsFluxPanel` / `WorldOriginsGlobe` / `ClassificationRulesPanel`, exports PDF/CSV (`exportClassificationReport.ts`).

### 2. Architecture & flux de données (1 p.)
- Diagramme ASCII : `UI → invoke edge function → (GBIF match → POWO si Plantae → GBIF distributions strict → parse authorship) → upsert KB → lecture cached → agrégats UI`.
- Politique de cache + clé `force` + `maxAgeDays`.
- Rate limit interne (250 ms entre requêtes ≈ 4 req/s).

### 3. Sources externes utilisées (1 p.)
- **GBIF Backbone Taxonomy** (`/v1/species/match`) — `usageKey`, `authorship`, `kingdom`.
- **GBIF Species Distributions** (`/v1/species/{key}/distributions?limit=300`) — filtré strict `establishmentMeans ∈ {NATIVE, ENDEMIC}` ; rejets explicites de `INTRODUCED, NATURALISED, INVASIVE` ; rejet silencieux de `''`, `UNCERTAIN`, `CRYPTOGENIC`.
- **POWO (Kew RBG)** (`/api/2/search` + `/api/2/taxon/{fqId}?fields=distribution`) — uniquement pour `kingdom = Plantae`. Mapping **TDWG WGSRPD Level 3 → ISO-3166-α2** (table `TDWG_L3_TO_ISO`, 200+ entrées, mapping **conservatoire** : seulement quand L3 → 1 pays sans ambiguïté).
- **Dictionnaire descripteurs** (`DESCRIBERS_KB`, 35 historiques majeurs : Linné, Cuvier, Fabricius, etc.) — fallback uniquement, jamais affiché comme natif.

### 4. Règles de décision (2 p.)
Cascade explicite documentée avec extraits de code annotés :
1. **POWO** → confidence `verified` (≤3 pays) ou `high` (>3).
2. **GBIF strict** (NATIVE/ENDEMIC) → `high` (≤3) ou `medium` (>3).
3. **Inféré (pays du descripteur)** → `low` **uniquement** ; jamais consolidé dans `native_countries_verified`.
4. Sinon → `source='none'`, `confidence='low'`, pas de pays.

Fusion finale : `native_countries_verified = POWO ∪ GBIF_strict` (union de set), `native_continents` dérivé de `ISO_TO_CONTINENT`.

### 5. Schéma de données (1 p.)
Table `species_biogeography_kb` — colonnes commentées : `native_countries_verified text[]`, `type_locality_country`, `type_locality_source`, `type_locality_confidence`, `introduced_countries`, `sources jsonb[]`, `authorship`, `describer_*`, `gbif_usage_key`, `fetched_at`.

### 6. Restitution UI & exports (1 p.)
- Logique d'affichage : `decideRule()` dans `exportClassificationReport.ts` (priorité affichée = ordre des règles).
- Fallback inféré explicitement marqué « confiance faible · fallback inféré ».
- Exports CSV + PDF (sources URL listées par espèce).

### 7. Limites connues & biais (2 p.) — section critique pour l'auditeur
- **Sémantique « indigène » vs « endémique »** : `NATIVE` GBIF = « naturellement présent », pas endémique → risque de quiproquo type *Syrphus ribesii* (natif holarctique). Recommandation de wording (`indigène sur ce territoire`).
- **Couverture TDWG conservatrice** : régions L3 multi-pays (ex. caucase, balkans) volontairement omises → faux négatifs préférés aux faux positifs.
- **`type_locality_country` = premier ISO trié** (ordre non sémantique POWO/GBIF) — n'est pas la « locality type » Linnéenne au sens strict, mais une **proxy** ; nom de colonne historique conservé pour compat.
- **Cache 180 j** : changements taxonomiques POWO non répercutés sans `force=true`.
- **POWO uniquement Plantae** : faune → repose entièrement sur GBIF, qui peut être lacunaire pour insectes sous-décrits.
- **Parse d'authorship regex** : limites sur auteurs composés (« & »), parenthèses, abbréviations rares.
- **Pas de gestion des synonymes** : `scientificName` requêté tel quel ; un synonyme non résolu côté snapshot → cache miss.

### 8. Sécurité & RLS (0,5 p.)
Edge function avec `SUPABASE_SERVICE_ROLE_KEY` (bypass RLS), pas d'input utilisateur autre que `scientificNames`/`explorationId` ; pas de stockage de PII.

### 9. Jeux de test reproductibles (3 p.)
Tableau de 10 espèces de calibration avec **sortie attendue** vs comportement de l'algorithme. Pour chaque ligne : nom scientifique, règne, règle attendue, source primaire attendue, pays attendu, confiance attendue, piège pédagogique testé.

| # | Espèce | Règne | Règle | Source | Pays attendu | Confiance | Piège testé |
|---|--------|-------|-------|--------|--------------|-----------|-------------|
| 1 | *Quercus robur* L. | Plantae | POWO | powo | Europe large | high | Aire native vaste |
| 2 | *Olea europaea* L. | Plantae | POWO | powo | Bassin médit. (≤3) | verified | Endémisme régional |
| 3 | *Syrphus ribesii* L. | Animalia | GBIF strict | gbif | Holarctique multi | medium | **Faux « originaire »** |
| 4 | *Apis mellifera* L. | Animalia | GBIF strict | gbif | EU+AF | medium | Espèce cosmopolite domestiquée |
| 5 | *Sequoia sempervirens* | Plantae | POWO | powo | US (CA) seul | verified | Vrai endémique strict |
| 6 | *Ailanthus altissima* | Plantae | POWO + introduced | powo | CN | high | Invasive en EU |
| 7 | *Lupinus polyphyllus* | Plantae | POWO | powo | US/CA | high | Naturalisée EU à exclure |
| 8 | Espèce taxon inconnu (mock) | — | Aucune | none | — | low | Cache miss propre |
| 9 | *Helix pomatia* L. | Animalia | GBIF strict | gbif | EU centre | medium | Mollusque, hors POWO |
| 10 | *Boletus edulis* Bull. | Fungi | GBIF strict (ou inféré) | gbif/inferred | EU large | medium/low | Champignon → GBIF lacunaire, possible fallback descripteur (Bulliard, FR) → doit afficher « confiance faible · fallback inféré » |

Pour chaque test : commande `curl` prête à coller :
```bash
curl -X POST https://xzbunrtgbfbhinkzkzhf.functions.supabase.co/enrich-species-biogeography \
  -H "Authorization: Bearer <anon>" -H "Content-Type: application/json" \
  -d '{"scientificNames":["Syrphus ribesii"],"force":true}'
```
+ requête SQL de vérification :
```sql
select scientific_name, native_countries_verified, type_locality_country,
       type_locality_source, type_locality_confidence, sources
from species_biogeography_kb where scientific_name = 'Syrphus ribesii';
```

### 10. Checklist auditeur (1 p.)
- [ ] La cascade respecte l'ordre POWO > GBIF > inféré ?
- [ ] `INTRODUCED/NATURALISED/INVASIVE` jamais comptés en `native_countries_verified` ?
- [ ] Statuts vides/`UNCERTAIN` jamais comptés ?
- [ ] Pour Plantae, POWO est interrogé avant GBIF ?
- [ ] Confiance `low` jamais traduite en « originaire » dans l'UI ?
- [ ] Sources URLs présentes dans `sources jsonb[]` pour traçabilité ?
- [ ] Mapping TDWG → ISO conservateur (aucune assignation multi-pays implicite) ?
- [ ] Cache 180 j contournable par `force:true` ?
- [ ] Rate limit respecté (≤ 4 req/s sortantes vers GBIF/POWO) ?

### 11. Annexes
- A. Extrait complet du fichier `enrich-species-biogeography/index.ts` (avec numéros de ligne pour pointage).
- B. Table `TDWG_L3_TO_ISO` complète.
- C. Table `ISO_TO_CONTINENT` complète.
- D. Dictionnaire `DESCRIBERS_KB` complet.
- E. Glossaire (NATIVE, ENDEMIC, INTRODUCED, NATURALISED, CRYPTOGENIC, TDWG WGSRPD L3, fqId POWO, usageKey GBIF, authorship).
- F. Références bibliographiques (POWO citation, GBIF Backbone DOI, WGSRPD standard).

## Livraison
Un seul fichier :
- `/mnt/documents/note-audit-algorithme-origines.md` (≈ 40–50 ko, lecture web/IDE/GitHub)
- Émis via `<presentation-artifact>` pour téléchargement immédiat.

**Aucune modification de code** n'est faite à cette occasion : la note documente l'existant tel quel. Les recommandations (renommer `type_locality_country` → `primary_origin_country`, ajouter résolution synonymes GBIF, étendre POWO Fungi via IndexFungorum, etc.) sont listées en section 7 comme *suggestions d'évolution*, pas comme correctifs immédiats.
