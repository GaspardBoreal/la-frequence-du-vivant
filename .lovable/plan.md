## Phase 3 — Sources visibles et curation augmentée

Objectif : exposer dans l'UI les évidences sourcées produites par le moteur cascade (Phase 2), permettre la multi-catégorisation et donner aux curateurs un point d'entrée dédié pour valider les classifications incertaines.

### 1. Étendre le type `ExplorationCuration`

Fichier : `src/hooks/useExplorationCurations.ts`

Ajouter les champs déjà présents en base (Phase 1) au type TS et les remonter dans les requêtes :
- `secondary_categories: string[]`
- `classification_evidence: Array<{ source: string; quote?: string; url?: string; reference?: string }>`
- `classification_source: 'knowledge_base' | 'gbif' | 'inaturalist' | 'ai' | 'curator' | null`
- `classification_confidence: number | null`
- `needs_review: boolean`

Étendre `UpsertPayload` pour permettre à un curateur d'éditer `secondary_categories` et de basculer `needs_review = false` (acte de validation humaine, qui force aussi `classification_source = 'curator'`).

### 2. Composant `<CategoryBadge />`

Nouveau fichier : `src/components/community/insights/curation/CategoryBadge.tsx`

Badge pastille réutilisable (remplace les `<span>` actuels dans `CuratedSpeciesCard` et la page publique) :
- Props : `category`, `size?: 'xs' | 'sm'`, `variant?: 'primary' | 'secondary'`, `evidence?`, `source?`, `confidence?`, `onClick?`.
- Style : reprend `getCatStyle(category)`. Variant `secondary` = même teinte mais opacité réduite + bordure dashed pour distinguer la principale.
- Icône `Info` (Lucide) discrète à droite si `evidence?.length > 0` ou `source` connu.
- Au clic → ouvre `ClassificationEvidenceSheet` (state local ou via prop `onClick`).
- Si `needs_review`, point ambré clignotant en haut-droite.

### 3. Composant `<ClassificationEvidenceSheet />`

Nouveau fichier : `src/components/community/insights/curation/ClassificationEvidenceSheet.tsx`

Drawer (shadcn `Sheet`, side `right` desktop, `bottom` mobile) pour exposer le « pourquoi » d'une classification :

```
+----------------------------------+
| Pissenlit  ·  Taraxacum officinale|
| [Bio-indicatrice] (principale)    |
| [Indigène] (secondaire)           |
+----------------------------------+
| Niveau de confiance : 95%         |
| Source : Base de connaissance     |
| Validé par : système (auto)       |
+----------------------------------+
| Évidences                         |
| ─ INPN TAXREF v17                 |
|   « Taraxacum officinale, statut  |
|    indigène France métropolitaine »|
|   ↗ Lien INPN                     |
| ─ Indices Ellenberg (N=7)         |
|   « Indicateur de sols riches en  |
|    azote »                        |
|   ↗ Référence Julve 1998          |
+----------------------------------+
| [Catégorie correcte ?]            |
| [Modifier la classification]      | ← curateurs uniquement
+----------------------------------+
```

Sections :
- **En-tête** : nom FR + scientifique, badges principal + secondaires.
- **Métadonnées** : `classification_source` (libellé humain : « Base de connaissance vérifiée », « Analyse IA », « Validé par un curateur »), `classification_confidence` (barre de progression), date d'analyse.
- **Évidences** : liste des items de `classification_evidence` (source, citation entre guillemets, lien externe). État vide si IA sans citation : message « Cette classification a été déduite par l'IA sans citation vérifiée — à réviser ».
- **Bandeau « À réviser »** si `needs_review = true` : texte explicatif + CTA curateur « Valider cette classification » (mute `useUpsertCuration` → `needs_review: false`, `classification_source: 'curator'`).
- **Actions curateur** : bouton « Modifier » qui ouvre un mini-éditeur (catégorie principale via select + multi-select pour secondaires, parmi les 5 autres).

### 4. Carte multi-badges

Fichier : `src/components/community/insights/curation/CuratedSpeciesCard.tsx`

- Remplacer le `<span>` de catégorie unique par un cluster `<CategoryBadge>` :
  - 1 badge principal (taille `sm`), puis jusqu'à 2 badges secondaires (taille `xs`, variant `secondary`).
  - Si plus de 2 secondaires : « +N » qui ouvre la sheet.
- Pastille « À réviser » (point ambré + tooltip) en overlay top-left de la vignette quand `needs_review`.
- Click sur un badge → ouvre la sheet (state remonté via prop optionnelle `onOpenEvidence(curation)` à `OeilCuration`, qui contrôle un seul Sheet partagé pour éviter les multiples portails).

### 5. Onglet « À réviser » dans `OeilCuration`

Fichier : `src/components/community/insights/curation/OeilCuration.tsx`

- Ajouter un 5ᵉ onglet (curateurs uniquement), entre « Suggestions IA » et « Terrain » :
  ```
  { id: 'review', label: 'À réviser', count: needsReviewCount, icon: <AlertCircle/>, hidden: !isCurator }
  ```
- Calcule `needsReviewItems = pool.filter(s => curationByKey.get(s.key)?.needs_review)`.
- Vue dédiée : grille triée par `classification_confidence` ascendant. Bandeau d'intro : « Ces espèces ont une classification automatique à confirmer. Cliquez sur un badge pour voir les sources, puis validez ou corrigez. »
- Compteur affiché en rouge/ambré si > 0 pour signaler au curateur qu'il y a du travail.
- Filtre catégorie réutilisé tel quel.

### 6. Sheet partagée au niveau `OeilCuration`

Pour éviter d'instancier une `Sheet` par carte :
- State `evidenceFor: ExplorationCuration | null` dans `OeilCuration`.
- Passé à `SpeciesGrid` puis à `CuratedSpeciesCard` via `onOpenEvidence`.
- Une seule `<ClassificationEvidenceSheet curation={evidenceFor} species={...} onClose={...} />` rendue en bas du composant.

### Détails techniques

- **Aucune nouvelle migration SQL** : les colonnes existent déjà depuis Phase 1.
- **Compatibilité** : tant qu'une curation n'a pas encore été retraitée par le nouveau pipeline, `secondary_categories=[]`, `classification_evidence=[]`, `classification_source=null`. Les badges et la sheet doivent gérer ces cas (afficher « Source non documentée » + CTA « Relancer l'analyse IA »).
- **Lecteurs publics** : la sheet et le badge cliquable fonctionnent aussi pour `isCurator=false` (lecture seule, pas de bouton de modification). C'est le socle de l'expérience publique « voir d'où vient cette information ».
- **i18n / sobriété** : libellés sources humanisés via une petite map dans `curationCategories.ts` (`SOURCE_LABELS`). Citations affichées en italique entre guillemets français « ».

### Fichiers touchés

- Nouveau : `src/components/community/insights/curation/CategoryBadge.tsx`
- Nouveau : `src/components/community/insights/curation/ClassificationEvidenceSheet.tsx`
- Modifié : `src/hooks/useExplorationCurations.ts` (type + payload + select)
- Modifié : `src/components/community/insights/curation/CuratedSpeciesCard.tsx` (cluster badges + pastille review + prop `onOpenEvidence`)
- Modifié : `src/components/community/insights/curation/OeilCuration.tsx` (onglet « À réviser », sheet partagée, branchement `onOpenEvidence`)
- Modifié : `src/components/community/insights/curation/curationCategories.ts` (ajout `SOURCE_LABELS`)

### Hors scope (Phase 4)

- Page publique `/lecteurs/<slug>/dossier-vivant` et export PDF : seront construits en Phase 4, en réutilisant `<CategoryBadge />` et `<ClassificationEvidenceSheet />`.
