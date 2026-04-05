

## Corriger le filtre contributeur : ne pas afficher d'espèces pour un marcheur sans identification

### Problème

Ligne 159-165 de `SpeciesExplorer.tsx` : quand un marcheur communautaire est sélectionné (`isSelectedMarcheur === true`), le filtre est **ignoré** et toutes les espèces sont affichées. C'est trompeur : Laurence Karki n'a identifié aucune espèce via iNaturalist/eBird/GBIF, mais on lui en attribue visuellement 21.

### Correction

**Fichier unique** : `src/components/biodiversity/SpeciesExplorer.tsx`

1. **Supprimer le bypass marcheur** : quand un marcheur est sélectionné, appliquer le même filtre par `attributions.observerName` que pour un observateur taxonomique. Si ce marcheur n'a aucune attribution → 0 espèce affichée, ce qui est correct.

2. **Adapter le bandeau contextuel** : au lieu de « Espèces observées lors de la participation de X », afficher « Aucune identification rattachée à [Nom] » quand le filtrage retourne 0 résultat et que le contributeur sélectionné est un marcheur.

3. **Conserver les marcheurs dans le dropdown** : ils restent visibles pour montrer la dynamique participative, mais le filtre est honnête sur leur contribution taxonomique réelle (0 si aucune identification, N si des attributions existent).

### Logique modifiée

```text
AVANT (ligne 161) :
  if (selectedContributor !== 'all' && !isSelectedMarcheur)
    → marcheur sélectionné = bypass, toutes espèces affichées

APRÈS :
  if (selectedContributor !== 'all')
    → même filtre pour tous : species.attributions.observerName === selectedContributor
    → marcheur sans attribution = 0 espèce = affiché honnêtement
```

### Impact

- Toutes les vues utilisant `SpeciesExplorer` (Empreinte, MarcheDetailModal, BioDivSubSection) bénéficient du correctif automatiquement.
- Les marcheurs avec de vraies attributions (ex: Chantal Brillet sur DEVIAT) continueront à afficher leurs espèces.
- Les marcheurs sans identification (ex: Laurence Karki) afficheront correctement 0 espèce avec un message informatif.

