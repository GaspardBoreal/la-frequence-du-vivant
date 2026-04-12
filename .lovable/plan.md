

## Corriger le sous-onglet "Contributions" — Afficher les taxons issus des snapshots biodiversité

### Problème

Le `ContributionsSubTab` actuel affiche `marcheur.speciesObserved` qui est **toujours vide** pour les marcheurs communautaires (ligne 159 de `useExplorationParticipants.ts` : `speciesObserved: []`). Les données existent dans `biodiversity_snapshots.species_data` avec des attributions riches (observerName, date, source, kingdom, photos).

### Solution

Remplacer la logique du `ContributionsSubTab` pour charger les espèces directement depuis les `biodiversity_snapshots` de l'exploration, filtrer par `observerName` correspondant au marcheur, et afficher chaque taxon avec le même style que l'onglet Empreinte.

### Modifications

**1. `ContributionsSubTab` dans `MarcheursTab.tsx`** — Refonte complète :

- Ajouter une requête React Query qui charge les `species_data` depuis `biodiversity_snapshots` pour tous les `marche_id` de l'exploration
- Parser les attributions pour extraire les espèces observées par ce marcheur spécifique (`observerName` contenant prénom + nom)
- Afficher chaque taxon avec :
  - Photo (depuis `photos[0]` ou `photoData.url`)
  - Icône royaume (Bird/Flower2/TreePine/Leaf) avec couleur
  - Label royaume ("Faune", "Flore", "Champignon")
  - Nom scientifique en italique
  - Nom français via `useSpeciesTranslationBatch` (déjà utilisé)
  - Date d'observation formatée
  - Source (iNaturalist, eBird, GBIF)
- Ajouter un `SortToggle` (asc/desc par date)
- Compteur discret en en-tête

**2. Structure de données extraite des snapshots** :

```text
species_data[].attributions[] contient :
  - observerName: "Gaspard Boréal"
  - date: "2026-03-30"
  - source: "inaturalist"
  - originalUrl: lien vers l'observation

species_data[] contient :
  - scientificName, commonName, kingdom
  - photos[], photoData
  - observations (count)
```

**3. Matching marcheur ↔ observations** :

- Pour les marcheurs communautaires : match `observerName` avec `"${prenom} ${nom}"`
- Pour l'équipe (crew) : idem
- Si aucun match par nom → afficher toutes les espèces de l'exploration (données collectives)

### Design (identique à Empreinte)

Chaque ligne de taxon :
```text
┌──────────────────────────────────────────────────┐
│ [Photo 44px]  🐦 FAUNE                          │
│               Turdus merula                      │
│               Merle noir           30 mars · iNat│
└──────────────────────────────────────────────────┘
```

### Fichiers modifiés

| Fichier | Action |
|---------|--------|
| `src/components/community/exploration/MarcheursTab.tsx` | Refonte du `ContributionsSubTab` pour charger depuis snapshots |

Aucun nouveau fichier, aucune migration SQL.

