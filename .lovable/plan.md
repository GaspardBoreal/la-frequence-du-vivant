## Diagnostic — pourquoi « consou » ne trouve rien

La recherche globale (Ctrl+K → RPC `search_global`) cherche les espèces **uniquement** dans `marcheur_observations` sur deux colonnes :
- `species_scientific_name` (ex : `Symphytum × uplandicum`)
- `taxon_common_name_fr`

Vérification BDD : pour `Symphytum × uplandicum`, **`taxon_common_name_fr` est NULL** sur toutes les observations (le nom FR n'est jamais stocké dans cette colonne pour les espèces issues d'iNat ; il est résolu à l'affichage via `useFrenchSpeciesNamesAuto` qui lit la table `species_translations`).

Résultat :
- « consou » → ne matche ni `symphytum × uplandicum` ni NULL → **0 résultat**.
- « cons » dans l'onglet Biodiversité de l'événement (copie 1) fonctionne parce que ce moteur-là (interne au tab) résout déjà le nom FR côté client avant de filtrer — c'est un autre chemin de code, sans rapport avec la recherche globale.

Le nom « Consoude de Russie » vit dans `species_translations.common_name_fr` (+ `alternative_names_fr` pour les synonymes), jointe sur `scientific_name`. La RPC l'ignore : c'est la racine du bug, qui affecte **toutes** les espèces iNat-only à travers toute l'app.

## Correctif proposé — robuste, une seule migration

Modifier `public.search_global` pour brancher `species_translations` dans la CTE `species_matches` :

1. `LEFT JOIN public.species_translations st ON st.scientific_name = o.species_scientific_name` dans `species_matches`.
2. Étendre le `WHERE` pour matcher aussi sur :
   - `f_unaccent(lower(st.common_name_fr))` (ILIKE + trigram `%`)
   - `f_unaccent(lower(array_to_string(st.alternative_names_fr, ' ')))` (ILIKE)
3. Étendre le `GREATEST(...)` du score pour inclure la similarité trigram contre `st.common_name_fr` (le meilleur des trois canaux : scientifique, FR observation, FR translation).
4. Remonter `MAX(st.common_name_fr)` dans la CTE et l'utiliser en priorité dans le `title` final :
   `COALESCE(MAX(st.common_name_fr), sm.common_name_fr, sm.species_scientific_name)`.
5. Conserver le `GROUP BY o.species_scientific_name` (la jointure n-1 reste agrégée par MAX).
6. Aucun changement de signature, aucun impact frontend, aucune autre RPC touchée.

Bénéfice : « consou », « consoude », « ortie blanche » (alias), « bourdaine »… tout nom FR connu de l'app devient cherchable partout (global + per-event), avec la même tolérance accents/casse/typos que les noms scientifiques.

## Détails techniques

Fichier touché : nouvelle migration SQL `CREATE OR REPLACE FUNCTION public.search_global(...)` reprenant le corps existant + le patch ci-dessus. Index recommandés (à créer s'ils n'existent pas déjà) :

```sql
CREATE INDEX IF NOT EXISTS species_translations_scientific_name_idx
  ON public.species_translations (scientific_name);
CREATE INDEX IF NOT EXISTS species_translations_common_name_fr_trgm_idx
  ON public.species_translations
  USING gin (public.f_unaccent(lower(common_name_fr)) extensions.gin_trgm_ops);
```

Aucun GRANT additionnel : `species_translations` est déjà accessible et la fonction est `SECURITY DEFINER`.

## Hors-scope

- Pas de refonte du composant `GlobalSearchOverlay` ni de `SearchResultCard`.
- Pas de modification du moteur de recherche interne du tab Biodiversité (déjà OK).
- Pas de changement de la logique de routage per-occurrence corrigée précédemment.
