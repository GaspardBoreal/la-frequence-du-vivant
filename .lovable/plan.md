

# Remplacer les 3 marches de la galerie light par des marches specifiques

## Objectif

Au lieu de charger dynamiquement les 3 marches les plus "completes" via `useFeaturedMarches(3)`, afficher exactement ces 3 marches :

1. La ou elle se jette, je me redresse a Bec d'Ambes
2. L'arbre a papillon du moulin Grand de Gintrac
3. Un moment sauvage a la sortie de Bergerac

## Approche technique

### Fichier a modifier : `src/hooks/useFeaturedMarches.ts`

Ajouter un parametre optionnel `specificIds` au hook. Quand des IDs sont fournis, le hook charge uniquement ces marches (dans l'ordre donne) au lieu de trier par completude.

### Fichier a modifier : `src/pages/MarchesDuVivantExplorer.tsx`

Passer les 3 IDs en dur au hook :

```
const EXPLORER_MARCHE_IDS = [
  'b88f774b-3131-4ff5-8f2a-1dd682f8b6de', // Bec d'Ambes
  '8ab7818c-f8d0-4432-9093-12c65a3db117', // Gintrac
  'fd99ffe8-edf4-4cdd-99f4-66c3dd2d9d57', // Bergerac
];

const { data: featuredMarches } = useFeaturedMarches(3, false, EXPLORER_MARCHE_IDS);
```

### Detail du changement dans le hook

Dans `useFeaturedMarches.ts` :
- Ajouter le parametre `specificIds?: string[]`
- L'inclure dans la `queryKey`
- Si `specificIds` est fourni et non vide, remplacer la requete initiale sur `exploration_marches` par un filtre `.in('id', specificIds)` directement sur `marches`
- Conserver l'ordre des IDs fournis (pas de tri par completude)
- Toute la logique existante (photos, audio, biodiversite) reste inchangee

### Aucun impact sur la galerie principale

La page `/marches-du-vivant/carnets-de-terrain` continue d'appeler `useFeaturedMarches(5)` sans `specificIds`, donc son comportement est inchange.

