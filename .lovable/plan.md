

# Plan : Exclure les marches orphelines de l'export par exploration

## Problème identifié

Quand une exploration est sélectionnée (ex: "Dordogne"), le code actuel inclut **automatiquement toutes les marches orphelines** (non liées à aucune exploration). C'est ce qui fait apparaître la marche "PICHERANDE / Les nuages se drapent..." dans l'export alors qu'elle n'appartient pas à l'exploration Dordogne.

## Code responsable

Dans `src/pages/ExportationsAdmin.tsx`, lignes 329-334 :

```typescript
// Include marches not linked to any exploration (orphans)
marches.forEach(m => {
  if (!marcheExplorationsMap.has(m.id) || marcheExplorationsMap.get(m.id)?.size === 0) {
    availableMarcheIds.add(m.id);  // ← Ajoute les marches orphelines
  }
});
```

## Solution

**Supprimer ce bloc de code** pour que seules les marches explicitement liées aux explorations sélectionnées soient disponibles dans l'export.

## Comportement après modification

| Scénario | Avant | Après |
|----------|-------|-------|
| Exploration "Dordogne" sélectionnée | 50 textes (49 Dordogne + 1 PICHERANDE orpheline) | 49 textes (uniquement Dordogne) |
| Aucune exploration sélectionnée | Toutes les marches (y compris orphelines) | Toutes les marches (y compris orphelines) |

## Fichier à modifier

| Fichier | Modification |
|---------|--------------|
| `src/pages/ExportationsAdmin.tsx` | Supprimer les lignes 329-334 (bloc d'inclusion des marches orphelines) |

## Code modifié

```typescript
// Get marches available based on selected explorations
const availableMarches = useMemo(() => {
  if (selectedExplorations.size === 0) {
    return marches;
  }
  
  const availableMarcheIds = new Set<string>();
  selectedExplorations.forEach(expId => {
    explorationMarchesMap.get(expId)?.forEach(marcheId => {
      availableMarcheIds.add(marcheId);
    });
  });
  
  // SUPPRIMÉ : le bloc qui ajoutait les marches orphelines
  
  return marches.filter(m => availableMarcheIds.has(m.id));
}, [marches, selectedExplorations, explorationMarchesMap]);
```

## Impact

- La marche "PICHERANDE / Les nuages se drapent..." n'apparaîtra plus dans l'export de l'exploration Dordogne
- Les marches orphelines restent accessibles quand aucune exploration n'est sélectionnée
- Le compteur passera de 50 textes à 49 textes pour l'exploration Dordogne

## Validation

1. Aller sur `/admin/exportations`
2. Sélectionner l'exploration "Dordogne"
3. Vérifier que la marche "PICHERANDE" n'apparaît plus dans la liste
4. Vérifier que le compteur affiche bien 49 textes (et non 50)
5. Vérifier dans l'onglet "Structure" qu'il n'y a plus de "Textes sans partie assignée"

