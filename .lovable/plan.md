

## Afficher le badge "Contributions" à côté du badge "Observations" dans l'en-tête marcheur

### Problème

Le badge photo (📷 23) s'affiche correctement car il vient de `marcheur.stats.photos`. Le badge contributions (🌿) ne s'affiche pas car `marcheur.stats.speciesCount` vaut 0 pour les marcheurs communautaires — les données réelles sont dans `biodiversity_snapshots.species_data`.

### Solution

Charger le compteur de contributions depuis les `biodiversity_snapshots` pour chaque marcheur (même logique de normalisation des noms que le `ContributionsSubTab`) et l'afficher comme badge élégant dans l'en-tête de la carte.

### Modifications dans `MarcheursTab.tsx`

**1. Hook dédié pour le compteur de contributions par marcheur**

Créer un petit hook `useWalkerContributionsCount(prenom, nom, explorationMarcheIds)` qui :
- Requête `biodiversity_snapshots` pour les `marche_id` de l'exploration
- Parse `species_data[].attributions[]` avec la normalisation NFD (accents)
- Retourne le nombre d'observations individuelles attribuées au marcheur

**2. Badge dans l'en-tête du `MarcheurCard`**

Remplacer le badge `speciesCount` actuel (qui ne fonctionne pas) par le vrai compteur issu du hook :

```text
┌─────────────────────────────────────────────────────────┐
│ (GB) Gaspard Boreal              📷 23  🌿 42    ˅     │
│      Sentinelle                                        │
└─────────────────────────────────────────────────────────┘
```

- Badge 📷 : inchangé (photos/vidéos publiques)
- Badge 🌿 : nouveau compteur réel depuis snapshots, icône `Leaf`, couleur `amber-500`
- Les deux badges partagent le même style pill (`rounded-full bg-muted/60`)
- Mobile-first : badges compacts, `gap-1.5`, taille `text-[11px]`

**3. Optimisation**

- La requête snapshots est déjà faite dans `ContributionsSubTab` — on la remontera au niveau du `MarcheurCard` pour éviter la duplication, en passant le résultat aux deux composants
- `staleTime: 60s` pour éviter les refetch inutiles
- Le hook ne se déclenche que si `explorationMarcheIds.length > 0`

### Fichier modifié

| Fichier | Action |
|---------|--------|
| `src/components/community/exploration/MarcheursTab.tsx` | Ajouter hook compteur contributions + badge dans header card |

