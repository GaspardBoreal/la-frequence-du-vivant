## Diagnostic

Notre base contient bien la même source que gogocarto (multi-catégories par point), mais on affiche 60 au lieu de 75 pour "Jardin" à cause d'une simplification côté client.

**Vérifié en base (`carte_sol_vivant_points`) :**

- Colonne `categories` (tableau, source de vérité gogocarto) :
  - Jardiniers → **51**
  - Jardins d'insertions ou pédagogiques → **25**
  - Total union ≈ **75** ✅ (aligné avec gogocarto : 50 + 25)
- Colonne `category` (singulière, dérivée) :
  - Jardiniers → 47, Jardins d'insertions → 16 (≈ 63)

**Cause du 60 affiché :** dans `CarteMarchesDuVivant.tsx`, le filtre appelle `mapSolVivantToCategory(p.categories)` qui **ne renvoie qu'une seule catégorie interne par point** (priorité arboriculture > vignoble > maraîchage > élevage > grande_culture > jardin). Un point taggué à la fois "Jardiniers" et "Maraîchers (MSV)" est donc classé `maraichage` et **disparaît du filtre Jardin**. Résultat : 60 au lieu de 75.

C'est gogocarto qui a la bonne valeur : **75**.

## Correction proposée

Aligner strictement notre filtre sur la logique gogocarto : un point appartient à une catégorie si **au moins une** de ses étiquettes source y correspond (union, pas classification unique).

### 1. `src/lib/marcheCategories.ts`
Ajouter une fonction `solVivantMatchesCategories(labels, selectedCats)` qui, pour chaque label brut du point, calcule sa catégorie interne (même logique que `mapSolVivantToCategory` mais appliquée label par label) et renvoie `true` dès qu'une catégorie interne du point est dans `selectedCats`.

Conserver `mapSolVivantToCategory` (utilisée ailleurs pour la couleur "primaire"), mais l'extraire d'une helper `singleLabelToCategory` réutilisée par les deux fonctions — une seule table de correspondance.

### 2. `src/pages/CarteMarchesDuVivant.tsx`
Remplacer dans `filteredSolPoints` :
```ts
return solPoints.filter((p) => set.has(mapSolVivantToCategory(p.categories)));
```
par :
```ts
return solPoints.filter((p) => solVivantMatchesCategories(p.categories, set));
```

Résultat attendu avec filtre "Jardin" seul : **75** points (51 Jardiniers ∪ 25 Jardins d'insertions, dédupliqués par id).

### 3. Rassurer visuellement les visiteurs (légende `MapView`)

Dans la légende Sol Vivant, sous le compteur, afficher un lien discret :
> _Source : [Carte Sol Vivant](https://cartesolvivant.gogocarto.fr) — synchronisée quotidiennement_

Et un tooltip "?" expliquant :
> "Un partenaire peut appartenir à plusieurs catégories (ex. Maraîcher + Jardinier). Il est compté dans chaque filtre auquel il correspond."

Ainsi, même si un visiteur compare filtre par filtre (Jardin=75, Maraîchage=577, etc.) la somme peut dépasser le total unique — c'est cohérent avec gogocarto.

### 4. (Optionnel, non bloquant)

Job de synchro `sync-carte-sol-vivant` : vérifier que les 62 points avec `category IS NULL` ont bien leur `categories[]` peuplé (c'est le cas d'après les stats). Si oui, on peut à terme déprécier la colonne `category` singulière côté lecture — mais **hors périmètre de ce fix**.

## Fichiers touchés

- `src/lib/marcheCategories.ts` — refacto + `solVivantMatchesCategories`
- `src/pages/CarteMarchesDuVivant.tsx` — nouveau filtre union
- `src/components/carte-mdv/views/MapView.tsx` — mention source + tooltip dans légende

Aucune migration DB, aucun changement d'edge function.
