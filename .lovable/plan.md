
# Plan de correction : Export ÉDITEUR - Visibilité et Synchronisation

## Problèmes identifiés

### 1. Badge "51 textes" non lisible
**Cause** : Le `Badge variant="outline"` sur la ligne 146-149 du composant `EditorExportPanel.tsx` utilise un texte de couleur par défaut (sombre) qui ne contraste pas suffisamment avec le fond `bg-slate-50` du panneau.

### 2. Titre du manuscrit non synchronisé avec les filtres
**Cause** : Le `useState(defaultTitle)` en ligne 32 utilise `defaultTitle` uniquement comme valeur **initiale**. Quand l'utilisateur change l'exploration sélectionnée dans les filtres, la prop `defaultTitle` change mais le state `title` reste à sa valeur d'origine.

---

## Corrections à apporter

### Fichier : `src/components/admin/EditorExportPanel.tsx`

#### Correction 1 : Visibilité du badge "textes"

Remplacer le Badge outline par un style avec un contraste fort :

```diff
- <Badge variant="outline" className="gap-1">
-   <ScrollText className="h-3 w-3" />
-   {textes.length} textes
- </Badge>
+ <Badge className="gap-1 bg-slate-700 text-white">
+   <ScrollText className="h-3 w-3" />
+   {textes.length} textes
+ </Badge>
```

#### Correction 2 : Synchronisation du titre avec les filtres

Ajouter un `useEffect` pour mettre à jour le state `title` quand `defaultTitle` change :

```typescript
import { useState, useMemo, useEffect } from 'react';

// Dans le composant :
const [title, setTitle] = useState(defaultTitle);

// Ajouter après la déclaration du state :
useEffect(() => {
  setTitle(defaultTitle);
}, [defaultTitle]);
```

Cette approche :
- Initialise le titre avec la valeur par défaut
- Met à jour automatiquement quand l'utilisateur change l'exploration dans les filtres
- Permet toujours à l'utilisateur de modifier manuellement le titre après

---

## Récapitulatif des modifications

| Ligne | Modification |
|-------|--------------|
| 1 | Ajouter `useEffect` à l'import React |
| 32 | Ajouter un `useEffect` après la déclaration de `title` |
| 146-149 | Changer le style du Badge "textes" pour meilleur contraste |

---

## Résultat attendu

1. **Badge visible** : "51 textes" affiché en blanc sur fond slate-700, clairement lisible
2. **Titre synchronisé** : Quand l'utilisateur sélectionne "Fréquences de la rivière Dordogne" dans les filtres, le champ "Titre du manuscrit" affiche automatiquement ce nom
