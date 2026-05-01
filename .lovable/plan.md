
## Constat

**Vue qui marche** (`Empreinte → Taxons observés`) :
- Composant : `SpeciesExplorer` → `SpeciesCardWithPhoto` → `SpeciesDetailModal`
- Photos hautes/lisibles via `useSpeciesPhoto(scientificName)` (API iNaturalist)
- Noms FR via `useSpeciesTranslationBatch` (table `species_translations` + fallback API)
- Photo en grand au clic via `SpeciesDetailModal`

**Vue cassée** (`Apprendre → L'œil`, composant `OeilCuration` + `SpeciesGrid` interne) :
- Affiche directement `species.imageUrl` (souvent vide ou miniature de mauvaise qualité, d'où l'icône "image cassée")
- Affiche `species.commonName || species.scientificName` brut → le `commonName` du snapshot est souvent en anglais ("Cherry laurel", "wild cherry"…)
- Aucun clic n'ouvre de modal photo

L'objectif : **réutiliser à l'identique** les briques de la vue qui marche, sans dupliquer la logique de traduction/photo/modal.

## Plan d'implémentation

### 1. Extraire une carte espèce réutilisable et "curatable"

Créer `src/components/community/insights/curation/CuratedSpeciesCard.tsx` :
- Reçoit la même `species` (objet du pool) **plus** les props de curation (`isCurator`, `curation`, `explorationId`, `onClick`, `showAiBadges`, `category`).
- À l'intérieur :
  - Appelle `useSpeciesPhoto(species.scientificName)` quand `species.imageUrl` est absente ou non chargeable, pour récupérer une photo iNaturalist nette (avec état `isLoading` + fallback `ImageOff`).
  - Reçoit la traduction FR depuis le parent (batch — voir étape 2) et affiche `commonNameFr || commonName || scientificName` en titre, et `scientificName` en sous-titre italique.
  - Conserve les badges existants : `count obs.`, étoiles IA + tooltip raison/critères, `PinToggle`, `CategoryControl`.
  - Image cliquable → déclenche `onClick(species)` (le parent gère l'ouverture de la modal).

### 2. Brancher la traduction FR par lots dans `OeilCuration`

Dans `OeilCuration.tsx` :
- Importer `useSpeciesTranslationBatch` depuis `@/hooks/useSpeciesTranslation`.
- Construire une fois `speciesForTranslation` à partir de `pool` (`{ scientificName, commonName }[]`).
- Construire un `translationMap: Map<string, SpeciesTranslation>` indexé par `scientificName`.
- Passer la traduction correspondante à chaque `CuratedSpeciesCard` (via `commonNameFr` injecté dans la species, ou prop dédiée).

### 3. Modal photo en grand

Ajouter dans `OeilCuration` :
- Un état `selectedSpecies: BiodiversitySpecies | null`.
- Convertir l'item `pool` cliqué en `BiodiversitySpecies` minimal compatible avec `SpeciesDetailModal` (id, scientificName, commonName, kingdom, family, observations=count, source, attributions=[]).
- Importer et monter `<SpeciesDetailModal species={selectedSpecies} isOpen={!!selectedSpecies} onClose={() => setSelectedSpecies(null)} />`.
- Toutes les vues (`Sélection`, `Suggestions IA`, `Pool observé`) utilisent le même handler de clic → même expérience que la vue Empreinte.

### 4. Remplacer l'ancien `SpeciesGrid` interne

Dans `OeilCuration.tsx` :
- Supprimer le rendu image actuel basé sur `species.imageUrl` brut + `<ImageOff>` direct.
- Remplacer par une grille qui mappe sur `CuratedSpeciesCard`, en passant la traduction et le handler de clic.
- Conserver la structure (grille `grid-cols-2 md:grid-cols-3 gap-2.5`, badges pin, étoiles, catégories) — seule la cellule devient le composant factorisé.

### 5. (Bonus cohérence) Vue Terrain

Le `ManualSpeciesGrid` affiche déjà la photo terrain uploadée + `common_name` saisi par le marcheur — ne rien changer (les données sont par construction propres et françaises). On garde sa modal/lightbox actuelle si présente, sinon on peut réutiliser plus tard la même `SpeciesDetailModal` avec un objet adapté (hors scope de ce ticket pour rester minimal).

## Fichiers touchés

- **Créé** : `src/components/community/insights/curation/CuratedSpeciesCard.tsx` (carte unique, branche `useSpeciesPhoto` + reçoit la traduction).
- **Édité** : `src/components/community/insights/curation/OeilCuration.tsx`
  - import `useSpeciesTranslationBatch`, `SpeciesDetailModal`, `CuratedSpeciesCard`
  - ajout du `translationMap` et de l'état `selectedSpecies`
  - réécriture de `SpeciesGrid` pour utiliser `CuratedSpeciesCard`
  - montage de `<SpeciesDetailModal />`

## Détails techniques

- `useSpeciesPhoto` n'est appelé **que si** `species.imageUrl` est manquant → pas d'appel inutile pour les espèces déjà accompagnées d'une photo dans le snapshot.
- `useSpeciesTranslationBatch` est appelé **une seule fois** au niveau d'`OeilCuration` (pas dans chaque carte) → pas de N+1.
- Le mapping pool → `BiodiversitySpecies` pour la modal :
  ```ts
  const toModalSpecies = (s: ExplorationSpecies, t?: SpeciesTranslation): BiodiversitySpecies => ({
    id: s.key,
    scientificName: s.scientificName || '',
    commonName: t?.commonName || s.commonName || s.scientificName || '',
    kingdom: (s.group as any) || 'Other',
    family: '',
    observations: s.count,
    lastSeen: '',
    source: 'inaturalist',
    attributions: [],
  });
  ```
- Aucune migration DB, aucune edge function modifiée.

## Résultat attendu

- Les vignettes de "Apprendre → L'œil" affichent désormais les **mêmes photos lisibles** que "Empreinte → Taxons observés".
- Les titres sont **en français** (Laurier-cerise, Cerisier sauvage, Fleur de coucou…) au lieu de l'anglais brut.
- Un clic sur une carte ouvre la **modal photo en grand**, identique à celle de l'onglet Empreinte.
- Aucune duplication : un seul composant carte + un seul hook traduction + une seule modal partagée.
