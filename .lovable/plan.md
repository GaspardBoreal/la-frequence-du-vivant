

## Corriger l'export CSV "Données brutes biodiversité"

### Cause racine (2 bugs)

1. **Données jamais chargées** — `EventExportPanel.tsx` ligne 172 : la condition est `if (includeBiodiversity && ...)`. Quand seul `includeRawBiodiversity` est coché (et `includeBiodiversity` décoché), aucune donnée biodiversité n'est récupérée → `biodiversity` reste `null`.

2. **Aucune section CSV pour les données brutes** — `eventExportUtils.ts` : la fonction `exportEventsToCSV` ne gère jamais `options.includeRawBiodiversity`. Il n'y a aucun bloc qui écrit les données brutes → le fichier est vide.

3. **topSpecies limité à 15** — Même quand les données sont chargées, `topSpecies` est tronqué à 15 espèces (`.slice(0, 15)`). Pour un export "données brutes", il faut TOUTES les espèces.

### Corrections

**Fichier `src/components/admin/EventExportPanel.tsx`** :
- Ligne 172 : changer la condition en `if ((includeBiodiversity || includeRawBiodiversity) && event.exploration_id)`
- Stocker TOUTES les espèces (sans `.slice(0, 15)`) dans un nouveau champ `allSpecies` sur `biodiversity`, en plus de `topSpecies` qui reste tronqué pour la synthèse

**Fichier `src/utils/eventExportUtils.ts`** :
- Ajouter `allSpecies` au type `EventExportData.biodiversity`
- Ajouter un bloc CSV dédié pour `includeRawBiodiversity` qui exporte la liste complète des espèces avec colonnes : Événement, Type, Espèce, Nom scientifique, Royaume, Observations

### Fichiers impactés

| Action | Fichier |
|--------|---------|
| Modifier | `src/components/admin/EventExportPanel.tsx` — condition de chargement + champ `allSpecies` |
| Modifier | `src/utils/eventExportUtils.ts` — type `allSpecies` + section CSV données brutes |

