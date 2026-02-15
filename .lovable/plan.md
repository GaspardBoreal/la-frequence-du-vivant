

# Filtrage des Carnets de Terrain -- Marches visibles aux lecteurs uniquement

## Probleme

Le hook `useFeaturedMarches` charge toutes les marches de la table `marches` sans verifier :
1. Si elles sont associees a une exploration (table `exploration_marches`)
2. Si leur statut de publication est "Visible aux lecteurs" (`published_public` ou `published_readers`)

Resultat : des marches orphelines et des brouillons apparaissent dans la galerie et les fiches.

## Solution

### Fichier unique a modifier : `src/hooks/useFeaturedMarches.ts`

Ajouter une requete prealable sur `exploration_marches` pour ne garder que les marches visibles :

1. **Charger les marches autorisees** : Requeter `exploration_marches` filtree sur `publication_status IN ('published_public', 'published_readers')` pour obtenir la liste des `marche_id` eligibles
2. **Filtrer les marches** : Utiliser `.in('id', allowedMarcheIds)` sur la requete principale `marches` au lieu de charger toutes les marches
3. **Cas vide** : Si aucune marche autorisee, retourner un tableau vide immediatement

### Changement concret

Avant la requete existante sur `marches`, ajouter :

```
// Fetch only marches visible to readers (linked to an exploration with proper status)
const { data: visibleLinks } = await supabase
  .from('exploration_marches')
  .select('marche_id')
  .in('publication_status', ['published_public', 'published_readers']);

const allowedIds = [...new Set((visibleLinks || []).map(l => l.marche_id))];
if (allowedIds.length === 0) return [];
```

Puis modifier la requete `marches` existante pour ajouter `.in('id', allowedIds)`.

### Impact

- **Galerie** (`/marches-du-vivant/carnets-de-terrain`) : N'affiche que les marches visibles aux lecteurs
- **Fiches individuelles** : La navigation prev/next ne propose que des marches visibles
- **Compteurs hero** : Refletent uniquement les marches publiees
- Aucun changement sur les autres pages qui utilisent d'autres hooks

### Pas de nouveau fichier, pas de migration

Une seule modification dans le hook existant, environ 8 lignes ajoutees.

