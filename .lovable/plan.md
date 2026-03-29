

# Fix: Boutons modifier/supprimer invisibles sur mobile

## Diagnostic

Les boutons d'edition et suppression dans `ContributionItem.tsx` (ligne 171) utilisent `opacity-0 group-hover:opacity-100`. Sur les appareils mobiles/tactiles (Laurence utilise Android), **il n'y a pas d'etat hover**, donc les boutons restent invisibles en permanence. Gaspard voit les boutons car il utilise un navigateur desktop.

Le RLS et la logique de donnees sont corrects — le probleme est purement CSS/UX.

## Correctif

### Fichier : `src/components/community/contributions/ContributionItem.tsx`

1. **Rendre les boutons toujours visibles sur mobile** : remplacer `opacity-0 group-hover:opacity-100` par `opacity-100 sm:opacity-0 sm:group-hover:opacity-100`. Sur ecrans larges (desktop), le comportement hover est conserve. Sur mobile, les boutons sont toujours visibles.

2. **Appliquer le meme correctif au mode immersion** (ligne 91-93) pour l'indicateur de visibilite.

### Changement

```
// Avant (ligne 171)
<div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">

// Apres
<div className="flex gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
```

## Fichier impacte

| Fichier | Action |
|---|---|
| `src/components/community/contributions/ContributionItem.tsx` | Rendre les boutons owner visibles sur mobile |

