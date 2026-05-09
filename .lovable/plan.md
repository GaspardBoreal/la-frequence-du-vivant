# Catégorie unique à l'attribution

## Intention

Quand une espèce a plusieurs identifications dans la KB (ex. *Iris pseudacorus* = Indigène + Bio-indicatrice), le curateur doit **trancher une catégorie unique** avant de pouvoir confirmer l'attribution. Ce choix devient la vérité éditoriale (curation L'Œil) et bascule l'espèce dans le bon bucket Sentinelle pour tous les marcheurs concernés.

## Comportement UX (dialogue d'attribution)

Au-dessus du sélecteur de marche, ajout d'un bloc **« Identification de l'espèce »** :

- **Si KB.primary seul** → bandeau lecture seule : badge catégorie + « Classification confirmée ».
- **Si KB.primary + secondaries** → groupe de chips radio (1 par catégorie KB), aucune pré-sélection. Tant qu'aucune chip n'est choisie, le bouton **Confirmer** reste désactivé avec libellé *« Choisissez une identification »*.
- **Si une curation L'Œil existe déjà** → la chip correspondante est mise en valeur (ring + petit label « actuel ») mais le choix reste obligatoire et explicite à chaque attribution.
- **Garde-fou conflit** : si une curation `sense='oeil'` existe déjà avec une catégorie ≠ choix curateur **ET** que d'autres marcheurs ont déjà été attribués sur cette espèce dans cette exploration, on bloque la soumission avec une AlertDialog :
  > « *Iris faux-acore* est déjà classé **Bio-indicatrice** pour 3 marcheur·ses. Modifier l'identification écraserait leur classement. Voulez-vous **conserver Bio-indicatrice** ou **demander une validation curateur** ? »
  Deux actions : **Conserver l'actuelle** (force le choix sur l'existant et continue) / **Annuler**.

Mobile-first : chips wrap sur 2 lignes, hauteur 32px, focus visible.

## Persistance

Avant `attribute_species_to_marcheurs`, on **upsert une curation** :
- `sense='oeil'`, `entity_type='species'`, `entity_id = scientificName`, `category = <choix>`, `classification_source='curator'`, `needs_review=false`.
- L'override est immédiat car `bucketSensibleSpecies` consulte déjà `curationByName` avant la KB.
- Conséquence directe : Iris classé « Bio-indicatrice » apparaît dans le bucket Bio des marcheurs attribués → recompte du Sentinelle Index sur invalidation.

## Détails techniques

**Fichiers à modifier (frontend uniquement) :**

1. `src/lib/speciesClassification.ts`
   - Exporter `getSpeciesCategoryOptions(scientificName): SpeciesCategory[]` qui renvoie `[primary, ...secondary]` à partir de la KB (déduplication, ordre stable).

2. `src/components/community/insights/curation/AttribuerObservationDialog.tsx`
   - Nouveau bloc « Identification » entre le bandeau observateurs et le select Marche.
   - State : `chosenCategory: SpeciesCategory | null`, initialisé à `null` (jamais pré-rempli même si curation existe).
   - Lookup : `useExplorationCurations(explorationId, 'oeil')` filtré par `entity_id === scientificName` pour récupérer la curation actuelle + `useExplorationMarcheurs` pour compter les attributions existantes (déjà disponible via `useExplorationParticipants` + comptage via observations, ou nouveau hook léger `useSpeciesAttributionCount`).
   - `canSubmit = selected.size > 0 && !!marcheId && !!chosenCategory && !mutation.isPending`.
   - Détection conflit avant `mutation.mutate()` → ouvre `AlertDialog` shadcn.
   - Mutation enchaînée : `upsertCuration` (via `useUpsertCuration`) **puis** `attribute_species_to_marcheurs`. Si l'upsert échoue, on n'attribue pas.

3. `src/hooks/useExplorationCurations.ts`
   - Aucun changement de signature, on réutilise `useUpsertCuration` tel quel (gère déjà id existant vs nouveau).

4. Invalidations supplémentaires après succès :
   - `['exploration-curations', explorationId]` (déjà géré par `useUpsertCuration`)
   - `['marcheur-sensible-species']`, `['exploration-marcheurs']`, `['marcheur-impact-snapshots']` (déjà gérés).

**Pas de migration SQL** : `exploration_curations` supporte déjà `sense='oeil' / entity_type='species' / category` et la RPC `attribute_species_to_marcheurs` reste inchangée.

## Hors scope

- Pas de changement du Sentinelle Index lui-même.
- Pas de re-classification rétroactive des espèces déjà attribuées sans curation (elles continuent d'utiliser KB.primary tant qu'aucun curateur ne passe par le dialogue).
- Pas d'extension à d'autres sens (Main, Cœur…) — uniquement L'Œil.
