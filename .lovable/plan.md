

## Corriger les compteurs de biodiversité des "Empreintes passées"

### Cause racine

Deux méthodes différentes calculent les compteurs par royaume :

- **Empreinte (correct)** — `EventBiodiversityTab.tsx` parcourt le JSON `species_data` et compte par `kingdom === 'Animalia' | 'Plantae' | 'Fungi'` (dédoublonné par `scientificName`)
- **Empreintes passées (incorrect)** — `useExplorationBiodiversitySummary.ts` utilise les colonnes `snapshot.birds_count`, `snapshot.plants_count`, `snapshot.fungi_count`, `snapshot.others_count` qui sont obsolètes/incohérentes

Résultat : DEVIAT affiche 0 Faune / 27 Flore au lieu de 3 Faune / 18 Flore.

### Correction

**`src/hooks/useExplorationBiodiversitySummary.ts`** (lignes 100-116) — Remplacer le calcul basé sur les colonnes `birds_count`/`plants_count`/etc. par un calcul identique à `EventBiodiversityTab` : parcourir `species_data`, extraire les `scientificName` uniques, et compter par `kingdom`.

Concrètement :
1. Supprimer `birds += snapshot.birds_count || 0` (et plants, fungi, others)
2. Après la boucle de construction de `uniqueSpeciesMap`, recalculer les compteurs à partir du `kingdom` stocké dans cette map
3. Le compteur "Faune" = entries avec `kingdom === 'Animalia'`, "Flore" = `Plantae`, "Champi." = `Fungi`, "Autres" = le reste

Cela garantit que les "Empreintes passées" et l'onglet "Empreinte" utilisent exactement la même logique de calcul.

### Fichier impacté

| Action | Fichier |
|--------|---------|
| Modifier | `src/hooks/useExplorationBiodiversitySummary.ts` — recalculer `speciesByKingdom` depuis `uniqueSpeciesMap` au lieu des colonnes `*_count` |

