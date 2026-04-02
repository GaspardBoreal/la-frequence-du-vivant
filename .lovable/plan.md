

## Corriger le débordement des badges dans EnhancedSpeciesCard

### Probleme

Dans `EnhancedSpeciesCard.tsx` (ligne 188), la rangée de badges (`source`, `Audio X`, `Photo`) utilise `flex` sans contrainte de débordement. Sur des cartes étroites (grille 4 colonnes), les badges dépassent du conteneur visible.

### Correction

**Fichier unique** : `src/components/audio/EnhancedSpeciesCard.tsx`

Ligne 188 — ajouter `flex-wrap` et `overflow-hidden` pour que les badges passent à la ligne ou restent contenus :

```tsx
// AVANT
<div className="flex items-center gap-1 mt-1">

// APRÈS
<div className="flex items-center gap-1 mt-1 flex-wrap overflow-hidden max-h-[3.5rem]">
```

Egalement raccourcir les labels pour gagner de l'espace :
- Badge source (ligne 189-191) : tronquer si trop long avec `truncate max-w-[80px]`
- Badge Photo (ligne 200) : garder tel quel (court)
- Badge Audio (ligne 194) : raccourcir en juste la lettre de qualité si l'espace manque

Approche retenue : `flex-wrap` seul suffit pour résoudre le débordement proprement sans tronquer. Les badges passeront à la ligne si nécessaire.

### Impact

`EnhancedSpeciesCard` est utilisé uniquement dans `SpeciesExplorer.tsx` — c'est le seul composant affichant cette grille de badges. La correction s'applique donc automatiquement à toutes les vues qui utilisent `SpeciesExplorer` (Vivant dans Marches, Taxons dans Empreinte).

