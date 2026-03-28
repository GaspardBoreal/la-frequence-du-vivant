

# Corriger l'onglet Vivant : format de donnees incompatible

## Diagnostic

Le VivantTab a deux sources de donnees :
1. **Snapshot** (table `biodiversity_snapshots`) : champs `total_species`, `birds_count`, `plants_count`, `species_data`
2. **Realtime** (edge function `biodiversity-data`) : champs `summary.totalSpecies`, `summary.birds`, `summary.plants`, `species`

Quand aucun snapshot valide n'existe (radius <= 600m), le fallback realtime est appele. Mais le code lit ensuite `territoryData.total_species` et `territoryData.species_data` — des noms de colonnes snapshot qui n'existent pas sur la reponse realtime. Resultat : tout affiche 0 ou rien.

## Solution

Normaliser les donnees realtime au format attendu avant de les stocker dans `territoryData`. Transformer la reponse edge function en un objet compatible snapshot.

## Fichier modifie

| Fichier | Changement |
|---------|-----------|
| `src/components/community/MarcheDetailModal.tsx` | Dans la `queryFn` du `realtimeData` query (ligne ~570-574), transformer la reponse : `{ total_species: data.summary.totalSpecies, birds_count: data.summary.birds, plants_count: data.summary.plants, fungi_count: data.summary.fungi, others_count: data.summary.others, species_data: data.species }`. Cela garantit que `territoryData.total_species` et `territoryData.species_data` fonctionnent identiquement quelle que soit la source. |

## Resultat attendu

L'onglet Vivant affichera les memes chiffres (42 especes, N oiseaux, N plantes) que la page bioacoustique publique, avec le meme rayon de 500m et le meme filtre temporel 2 ans.

