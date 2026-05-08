## Diagnostic

Les noms restent en anglais dans **Marches → Vivant** (`SpeciesExplorer`) à cause de la coexistence de **deux systèmes de traduction** non alignés :

| Hook | Lit `species_translations` | Auto-fill via edge function | Utilisé par |
|---|---|---|---|
| `useSpeciesTranslationBatch` (ancien, `src/hooks/useSpeciesTranslation.ts`) | ✅ | ❌ | **SpeciesExplorer (Vivant)**, MarcheursTab, OeilCuration (Apprendre → L'œil), BioacousticSheet, SpeciesAudioModal, BiodiversityTestPanel |
| `useFrenchSpeciesNamesAuto` (nouveau) | ✅ | ✅ via `translate-species` | DayDetailDrawer + modals Phase 2 |

Conséquence : toute espèce absente de `species_translations` (Peach, dappled willow, Cuckooflower, Macroglossin…) **reste en EN à jamais** dans la grille Vivant, parce que l'ancien hook ne déclenche **jamais** la fonction edge. Aucun bug de rendu — c'est un oubli de la Phase 2 : ces écrans n'ont pas été migrés.

C'est exactement le **risque architectural** identifié dans la mémoire `french-name-resolution-architecture` : tant que deux hooks coexistent, certaines vues échappent à l'auto-traduction.

## Solution : convergence par la racine (pas écran par écran)

Au lieu de migrer 6+ composants un par un (risque d'oubli + churn), on **rebranche l'ancien hook sur le nouveau**. Une seule modification dans `useSpeciesTranslation.ts` répare automatiquement **tous** les écrans qui l'utilisent, sans toucher à leurs props ni à leur UI.

### Étapes

1. **Refactor `useSpeciesTranslationBatch`** (`src/hooks/useSpeciesTranslation.ts`) :
   - À l'intérieur, appeler `useFrenchSpeciesNamesAuto(species)` (qui lit le DB **et** déclenche l'edge function pour les manquantes).
   - Mapper son résultat (`Map<scientificName, FrenchNameResolution>`) vers le format `SpeciesTranslation[]` attendu par les consommateurs existants.
   - Garder strictement la même signature publique → zéro changement chez les appelants.
   - Conserver la logique `language === 'en'` pour ne pas forcer FR si l'utilisateur est en EN.

2. **Stabilisation des inputs** : dans `SpeciesExplorer` et `MarcheursTab`, le `useMemo` qui construit `speciesForTranslation` est déjà OK ; vérifier juste que la dépendance reste sur `species` pour éviter de retrigger inutilement l'edge function.

3. **Marquer obsolète le hook unitaire `useSpeciesTranslation`** (singulier, non-batch) : ajouter un commentaire JSDoc `@deprecated — utiliser useFrenchSpeciesNamesAuto ou <SpeciesName />`. Pas de suppression dans cette passe.

4. **QA visuelle** : recharger l'écran Vivant → les espèces s'affichent en EN immédiatement puis swap en FR sous ~1–2s (latence edge function + invalidation cache). Au second chargement, FR direct (cache DB).

5. **Mémoire** : mettre à jour `mem://technical/species/french-name-resolution-architecture` pour noter que `useSpeciesTranslationBatch` est désormais un **alias** de `useFrenchSpeciesNamesAuto` (compat shim) et que tout nouvel écran doit utiliser directement `<SpeciesName />` ou `useFrenchSpeciesNamesAuto`.

### Pourquoi cette approche

- **Un seul fichier modifié** pour réparer 6 écrans (Vivant, Marcheurs, L'œil, Bioacoustique, Audio modal, Test panel).
- **Aucune régression UI** possible : la signature et le format de retour restent identiques.
- **Cohérence garantie** : impossible qu'un écran "oublie" l'auto-fill, puisqu'il n'y a plus qu'un seul moteur sous-jacent.
- **Migration douce** vers `<SpeciesName />` : peut continuer écran par écran sans urgence, puisque le bug de fond est corrigé à la racine.

## Fichiers touchés

- `src/hooks/useSpeciesTranslation.ts` — refactor de `useSpeciesTranslationBatch` en wrapper de `useFrenchSpeciesNamesAuto` ; JSDoc `@deprecated` sur le hook unitaire.
- `mem://technical/species/french-name-resolution-architecture` — mise à jour de la note.

Aucun composant consommateur n'est modifié.
