## Objectif

Le bandeau de filtres de `/admin/outils/taxonomie` ne s'applique aujourd'hui qu'à la vue **Liste**. On veut :

1. Ajouter un filtre **Règne du vivant** (Toutes / Faune / Plantes / Champignons / Autres) — même chip UX que la copie écran (`SpeciesExplorer`).
2. Faire en sorte que **tous** les filtres (Événement, Marche, Règne, Recherche, Tri) s'appliquent aussi à la vue **Carte** (`DuplicatesMapView`) — et donc au clustering, au bandeau « X constellations », au comptage « hors périmètre » et au Sheet.

## Ce qui change

### 1. `src/pages/AdminTaxonomyCuration.tsx`

- Ajouter un `useState<'all'|'faune'|'plants'|'fungi'|'others'>` pour le règne.
- Insérer un `Select` « Règne du vivant » dans le bandeau existant (grille 3 colonnes : Tri / Recherche / Règne) avec compteurs live calculés depuis `pool`.
- Étendre la requête `taxonomy-curation-pool` pour sélectionner aussi `kingdom` (déjà présent dans `marcheur_observations`).
- Étendre `SpeciesRow` avec `kingdom: string | null` (agrégé : premier non-null rencontré par clé).
- Appliquer le filtre règne + recherche au calcul de `pool` affiché ET à `suspects` (via un `poolFiltered` mémoïsé) ; la logique de `getGenus`/`isGenusOnly` reste intacte.
- Passer les filtres à la carte : nouvelles props `kingdomFilter` et `search` sur `<DuplicatesMapView>`.

### 2. `src/components/admin/taxonomy/DuplicatesMapView.tsx`

- Ajouter `kingdomFilter` et `search` aux `Props`.
- Étendre le `select()` Supabase pour inclure `kingdom` et `iconic_taxon`.
- Avant le clustering, filtrer `obs` par :
  - **règne** : bucket `Animalia` → faune, `Plantae` → plants, `Fungi` → fungi, autre/null → others (même mapping que `SpeciesExplorer`).
  - **recherche** : normalisation NFD comme dans la page (matches sur `species_scientific_name`, `taxon_common_name_fr`, ou genre).
- Recalculer clusters, bandeau, filaments, points, tooltips et Sheet à partir de ce sous-ensemble.
- Ajouter le règne + `search` dans la `mapKey` pour forcer le re-fit des bounds quand le filtre change.

## Ce qui ne change pas

- Logique de fusion (`upsert_species_taxonomy_alias`), portée (marche/événement/global), triggers SQL, ni les autres vues du site : uniquement UI + queries côté page admin.
- L'apparence générale du bandeau reste identique (mêmes composants shadcn, mêmes chips).

## Vérifs

- Filtrer sur « Faune » → seules les observations `kingdom='Animalia'` alimentent Liste, Suspects et Carte (mêmes counts).
- Taper « lantana » → même sous-ensemble visible dans la Liste, dans « Doublons probables » et dans les constellations Carte.
- Combiner Événement + Règne + Recherche → aucun résidu de cluster hors filtre sur la carte.
