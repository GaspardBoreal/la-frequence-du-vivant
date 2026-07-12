## Problème

Sur `/marches-du-vivant/carte-marches-du-vivant?cat=jardin&sv=1` :

- Le filtre **Catégorie** est appliqué aux événements (5 marches "Jardin" affichées ✅)
- Mais les **753 points Partenaires Sol Vivant** s'affichent tous, sans respecter la catégorie active. Sur gogocarto, ne cocher que `Jardins d'insertions` + `Jardiniers` renvoie ~75 points.

## Cause racine

Dans `src/pages/CarteMarchesDuVivant.tsx` :

```tsx
const { data: solPoints = [] } = useSolVivantPoints(filters.solVivantEnabled);
...
<MapView ... solVivantPoints={solPoints} ... />
```

Les points Sol Vivant sont passés bruts à `MapView`. `applyFilters` ne s'applique qu'aux `events`. Résultat : chaque point est rendu quelle que soit la catégorie.

L'utilitaire `mapSolVivantToCategory(labels)` existe déjà dans `src/lib/marcheCategories.ts` (map `Arboriculteurs → arboriculture`, `Jardiniers → jardin`, `Maraîchers/MSV → maraichage`, etc.), mais n'est jamais utilisé côté carte.

## Correction

### 1. Filtrer les points Sol Vivant par catégorie active (`CarteMarchesDuVivant.tsx`)

Ajouter un `useMemo` qui applique `mapSolVivantToCategory(point.categories)` et ne garde que les points dont la catégorie interne appartient à `filters.categories` (quand cette liste est non vide). Si `filters.categories` est vide → afficher tous les points (comportement actuel).

```ts
const filteredSolPoints = useMemo(() => {
  if (!filters.solVivantEnabled) return [];
  if (filters.categories.length === 0) return solPoints;
  const set = new Set(filters.categories);
  return solPoints.filter(p => set.has(mapSolVivantToCategory(p.categories)));
}, [solPoints, filters.solVivantEnabled, filters.categories]);
```

Passer `filteredSolPoints` à `MapView`.

### 2. Recolorer/relabeler la légende par catégorie interne (`MapView.tsx`)

Actuellement la légende affiche « Partenaires Sol Vivant 753 » en vert unique. Étendre pour :

- Utiliser le **compte réel affiché** (`solVivantPoints.length` après filtrage).
- Quand `filters.categories` restreint (info portée via le compte reçu), afficher le libellé au singulier de la catégorie active : ex. « Partenaires Sol Vivant · Jardin 74 ».
- Colorer les points Sol Vivant avec la couleur sémantique de leur catégorie interne (via `getMarcheCategoryMeta(mapSolVivantToCategory(...)).iconWrapClassName` traduit en couleur hex/HSL) au lieu du vert générique. Ainsi un point Jardin Sol Vivant partage la même couleur qu'une marche Jardin.

Aucune requête réseau supplémentaire ; le filtrage est purement client sur les 753 points déjà chargés (léger).

### 3. Aucun changement backend

Pas de migration nécessaire. `carte_sol_vivant_points.categories` est déjà exposé et suffit.

## Fichiers touchés

- `src/pages/CarteMarchesDuVivant.tsx` — filtrage `filteredSolPoints` + passage à `MapView`.
- `src/components/carte-mdv/views/MapView.tsx` — couleur par catégorie interne + count/label légende dynamiques.

## Vérification

1. `?cat=jardin&sv=1` → n ≈ 50–80 points verts/tons "jardin", plus les 5 marches Jardin.
2. `?cat=arboriculture&sv=1` → uniquement points Arboriculteurs.
3. `?sv=1` seul (sans `cat`) → 753 points (comportement inchangé).
4. Multi-cat `?cat=jardin,maraichage&sv=1` → union des deux mappings.
