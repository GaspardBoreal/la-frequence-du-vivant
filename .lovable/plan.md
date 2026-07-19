## Réponse directe à ta question

**Oui, l'action « Fusionner Lantana → Lantana camara » est le bon geste** dans l'outil. Mais dans l'état actuel du code, **la fusion ne se propage PAS partout** — voici l'analyse rigoureuse.

### Ce qui fonctionne déjà (aujourd'hui, après le dernier commit)

- ✅ **Galerie / Liste / Découvrir / Score / Œil / Écologique / Chatbot pool** : tous passent par `useExplorationSpeciesPool`, qui applique désormais les alias + le merge genre. Lantana disparaît, ses 4 obs sont additionnées aux 1 de Lantana camara → **5 obs**, une seule fiche.
- ✅ **Fiche espèce → onglet Observateurs (Lantana camara)** : `useSpeciesObservers` absorbe déjà automatiquement le rang genre via `getMergedGenusFor` quand une seule binomiale du genre est présente. Les 4 attributions iNat de « Lantana » remonteront bien sur la fiche de Lantana camara.

### Ce qui NE fonctionne PAS encore (angles morts identifiés)

1. **Compteur officiel `get_exploration_species_count` (RPC)** — source unique de vérité pour :
  - le total « X espèces » affiché sur Carnet, Carte, Synthèse, badges, Score, Fréquence,
  - les explorations listées (`useExplorationsWithMetrics`, `useMarcheCollectedData`),
  - le chatbot admin (`get_admin_entity_context`),
  - les analytics et exports.
   → La RPC agrège en SQL brut : **elle comptera toujours 2 espèces** (Lantana + Lantana camara), même après ta fusion UI. Le total sera incohérent avec la galerie.
2. `**useSpeciesObservers` ne consulte PAS la table d'alias** — il ne gère que le cas « genre → espèce unique ». Pour d'autres cas (synonymes, fautes de frappe, taxons renommés par iNat), les observateurs de la source ne remonteront pas sur la fiche canonique.
3. **Consommateurs directs de la RPC** qui court-circuitent `useExplorationSpeciesPool` :
  - `SeasonSpeciesCarousel` (fiche jardin immersif) → doublon Lantana réapparaîtra.
  - Edge functions `guide-marche-chat`, `generate-pack-vivant`, `classify-species-eco-tags`, `run-frugal-audit`.
4. **Curations existantes** (`exploration_curations.entity_id`) enregistrées sous « Lantana » : après fusion, la curation continuera de pointer sur l'ancienne clé → l'éditorial et les eco-tags validés sur Lantana ne migreront pas automatiquement vers Lantana camara.
5. **Jeux pédagogiques (Quiz)** : `quiz_questions` référence des noms scientifiques en dur (colonnes texte). Aucune propagation automatique — mais impact mineur, un quiz créé sur « Lantana camara » continuera de fonctionner.

## Plan de correction en 3 étages

### Étage 1 — Normalisation côté SERVEUR (fait tout tomber d'un coup)

Migration SQL :

1. Créer une fonction SQL `public.resolve_species_alias(scientific_name text, common_name text, marche_id uuid) → jsonb` qui retourne `{ scientific_name, common_name_fr }` canoniques en consultant `species_taxonomy_aliases` (global + marche-spécifique, spécifique prioritaire).
2. Modifier `get_exploration_species_count` et `get_exploration_species_pool` : appliquer `resolve_species_alias` sur chaque ligne AVANT le `GROUP BY`. Résultat : la fusion se propage à **tout** ce qui lit la RPC (compteurs, chatbot, edges, exports).
3. Ajouter un trigger `AFTER INSERT/UPDATE` sur `species_taxonomy_aliases` qui invalide un cache éventuel (option : simple bump d'un `updated_at` global).

### Étage 2 — Client : combler les angles morts

- `useSpeciesObservers.ts` : accepter un `aliasMap` (via `useTaxonomyAliasesForMarches`) et remapper les attributions dont `taxon.scientificName` matche un alias → attribuées à la fiche canonique. Idempotent avec la logique `getMergedGenusFor` déjà en place.
- `SeasonSpeciesCarousel.tsx` : remplacer l'appel RPC direct par `useExplorationSpeciesPool` (déjà aliasé) pour garantir la cohérence UI jardin.
- Migration douce des curations : trigger SQL sur insert d'alias → `UPDATE exploration_curations SET entity_id = canonical WHERE entity_id = alias_key` (best-effort, log dans `admin_audit_log`).

### Étage 3 — UX de l'outil (petits ajustements)

- Sur la ligne du groupe fusionné, afficher un badge « ✓ Alias actif » avec le canonical cible et un bouton « Annuler la fusion » qui supprime l'alias.
- Après enregistrement, invalider aussi : `exploration-species-count`, `species-observers-citizen`, `exploration-biodiversity-summary`, `marche-collected-data`, `explorations-with-metrics`.
- Message de succès : « Fusion active. Comptes recalculés dans ~30 s (cache DB). »

## Réponse résumée à tes questions


| Question                                                                           | Réponse                                                                                                               |
| ---------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Est-ce le bon geste dans l'outil ?                                                 | ✅ Oui                                                                                                                 |
| Les observations des deux entités seront-elles regroupées sur la fiche canonique ? | ⚠️ Partiellement aujourd'hui (uniquement pour le cas genre/espèce déjà géré). Étage 2 le garantit pour tous les cas.  |
| Les analyses/outils continueront-ils à fonctionner ?                               | ✅ Pour la galerie/liste/eco-tags/chatbot pool. ❌ Compteurs officiels, jardin immersif, edges → nécessitent l'Étage 1. |
| Impact sur les quiz pédagogiques ?                                                 | Nul (référence texte statique).                                                                                       |


**Recommandation** : livrer Étage 1 (SQL) + Étage 2 (client) dans une seule passe. C'est la seule façon de garantir qu'après ta fusion Lantana, **tout** l'écosystème (compteurs, fiches, exports, chatbot, edges) affichera 5 obs sur une seule espèce, de manière durable et résistante aux prochaines synchros iNat/Pl@ntNet.

implémentation complète (Étages 1+2+3) 