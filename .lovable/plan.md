## Problème

77 espèces "à valider" sur une seule marche, c'est trop pour une curation 100% manuelle. Le seuil actuel (`autoFns.length === 0 && count >= 2`) déclenche dès qu'une espèce n'a aucun tag auto — typiquement les insectes, champignons, mollusques, et toute plante absente de notre base familles/strates.

La solution n'est pas de cacher le compteur, mais de **réduire drastiquement le nombre d'espèces qui arrivent sans tags** grâce à 3 niveaux d'automatisation, puis de **rendre la validation des restantes 5× plus rapide**.

---

## Stratégie en 4 leviers

### 1. Enrichir l'auto-classification (90 % du gain attendu)

Aujourd'hui `classifyFunctions` ne regarde que `family`. On ajoute :

- **iconic_taxon → tags par défaut** :
  - `Insecta` + famille pollinisatrice (Apidae, Syrphidae, Lepidoptera…) ⇒ `pollinisateur`
  - `Insecta` Coccinellidae, Carabidae, Chrysopidae ⇒ `auxiliaire_cultures`
  - `Aves` granivores/insectivores ⇒ `regulation_ravageurs` / `disperseur_graines`
  - `Fungi` ⇒ `decomposeur` + `mycorhizien` si famille connue
  - `Mollusca`, `Annelida` ⇒ `decomposeur` / `bio_indicateur`
- **GBIF taxonomy fallback** : pour toute espèce sans family connue, on appelle `useGbifTaxonSearch` (déjà existant) au moment du backfill pour récupérer family + ordre, puis re-classifier.
- **Cache familles** : table `species_family_cache` (scientific_name → family, iconic_taxon, traits) alimentée une fois par espèce, partagée entre toutes les marches.

Effet attendu sur cette marche : **77 → ~15-20 espèces** réellement non classifiables (espèces rares, taxons incertains).

### 2. Classification IA en batch (les ~15 restantes)

Nouvelle edge function `classify-species-eco-tags` :

- Entrée : liste de scientific_name + family + iconic_taxon + count
- Appel **Lovable AI Gateway** (`google/gemini-3-flash-preview`) avec tool calling structuré → renvoie pour chaque espèce `{ tags: EcoFunction[], confidence: 0-1, reasoning: string }`
- On stocke dans `exploration_curations` avec `classification_source='ai'` et `classification_confidence`
- Si `confidence >= 0.75` ⇒ auto-validé (pas dans le compteur "à valider")
- Si `0.4 ≤ confidence < 0.75` ⇒ pré-rempli mais affiché "Suggestion IA à confirmer" (1 clic pour valider)
- Si `confidence < 0.4` ⇒ reste "à valider" manuel

Déclenchement : bouton **"Lancer l'IA sur les 77 espèces"** dans le bandeau curateur, + cron quotidien automatique sur toutes les explorations.

Effet attendu : **15 restantes → ~3-5 vraiment manuelles**.

### 3. Apprentissage cross-marches

Quand un curateur valide les tags d'une espèce (ex. *Anacamptis pyramidalis* → `mellifere`, `bio_indicateur`), on propose d'enregistrer dans une **base globale** `species_eco_tags_kb` (scientific_name + tags + nb_validations + last_validator).

- Sur les marches futures, ces tags sont appliqués automatiquement avec `classification_source='knowledge_base'` (priorité max, jamais "à valider").
- Une espèce validée 1 fois ne ressort plus jamais "à valider" nulle part.

Effet sur le long terme : le compteur descend marche après marche.

### 4. UX : validation 5× plus rapide pour les restantes

Dans le drawer "À valider" :

- **Mode "rapide"** : pas de Sheet par espèce — chips directement sur la vignette, tap = toggle, swipe = espèce suivante.
- **Bulk apply** : sélection multiple + "Appliquer ces tags aux N espèces sélectionnées" (pratique pour les abeilles solitaires, papillons…).
- **Suggestions contextuelles** : pour chaque espèce on affiche les 3 tags les plus probables en avant (basé sur l'IA + voisins taxonomiques déjà validés sur la marche).
- **Skip** : "Pas sûr → laisser pour un autre curateur" sans coût cognitif.

---

## Plan technique

### Migration DB
```sql
create table public.species_eco_tags_kb (
  scientific_name text primary key,
  tags text[] not null,
  confidence numeric default 1.0,
  source text not null check (source in ('curator','ai','expert')),
  validations_count int default 1,
  last_validated_by uuid,
  last_validated_at timestamptz default now()
);
create table public.species_family_cache (
  scientific_name text primary key,
  family text, iconic_taxon text, kingdom text,
  traits jsonb default '{}'::jsonb,
  fetched_at timestamptz default now()
);
```
RLS : lecture publique, écriture via SECURITY DEFINER RPC `validate_species_tags(name, tags[])` réservée curateurs.

### Edge functions
- `classify-species-eco-tags` (POST batch, retourne suggestions IA)
- `enrich-species-taxonomy` (cron quotidien : remplit `species_family_cache` via GBIF pour toute nouvelle espèce)
- RPC `validate_species_tags` (écrit curation + KB en une transaction)

### Frontend
- `useEcologicalFunctions` : ajoute la priorité **KB > curation locale > IA confidence≥0.75 > auto-classif > needsReview**
- `ClassifyAllAIButton` dans le bandeau curateur amber (visible si needsReview > 5)
- `BulkValidationDrawer` : nouveau mode rapide chips inline + swipe + bulk apply
- `useSpeciesKbSuggestions(scientificName)` : récupère suggestions cross-marches

### Lib
- `ecologicalFunctionsClassification.ts` : étendre avec règles par iconic_taxon (insectes, oiseaux, champignons, mollusques)
- Nouveau `lib/insectFamiliesEco.ts` : map familles d'insectes → tags

---

## Sortie utilisateur attendue

Sur cette marche après mise en place :
- **Bandeau au chargement** : "77 espèces non taguées → l'IA traite en arrière-plan… ✓ 62 classifiées automatiquement"
- **Reste 15 espèces** avec suggestions IA pré-remplies → 1 clic chacune pour valider
- **Reste ~3 espèces** vraiment incertaines → validation manuelle ou skip

Temps de curation estimé : **45 min → 5 min** pour cette marche, et **encore moins** pour les marches suivantes grâce à la KB.

---

## Hors scope (à confirmer)

- Workflow d'expert/scientifique (validation niveau "expert" qui override curateur)
- Détection de conflits entre curateurs sur une même espèce KB
- Interface admin pour gérer la KB globale (édition/suppression d'entrées)
