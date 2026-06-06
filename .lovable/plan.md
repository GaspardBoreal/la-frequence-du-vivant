
## Problème

Quand on clique « Datation de l'âge des grands arbres (dendrochronologie) » dans la recherche :
- ✅ on arrive bien sur la bonne exploration
- ✅ on arrive bien sur l'onglet **Apprendre** (URL `?focus=practice:<id>&tab=apprendre`)
- ❌ mais le sous-onglet sensoriel reste sur **L'Œil** au lieu de **La main**, donc la fiche pratique n'est jamais visible — et donc jamais auto-dépliée par `MainCuration`.

## Cause

`CeQueNousAvonsVu` (le sélecteur des 5 sens dans Apprendre › Ce que nous avons vu) initialise un état local `activeSense = 'oeil'` et **n'écoute pas le focus bus**. Le focus de la recherche est bien diffusé (`dispatchFocus({ kind: 'practice', … })`) et `MainCuration` sait déjà auto-déplier la bonne carte (`data-focus-id="practice:<id>"`), mais il n'est jamais monté car on reste sur le sens « œil ».

## Correction

Brancher `CeQueNousAvonsVu` sur le focus bus pour qu'il bascule automatiquement vers le bon sens lorsque la recherche pointe vers une entité curée :

| Focus venant de la recherche | Sens à activer |
| --- | --- |
| `kind: 'practice'` | `main` |
| `kind: 'testimony'` (sous-onglet coeur) | `coeur` |
| `kind: 'text'` (déjà routé vers Marches/Lire — pas concerné ici) | — |
| `kind: 'species'` (l'œil contient les espèces curées) | `oeil` (déjà défaut) |

Implémentation (un seul fichier modifié) :

```text
src/components/community/insights/curation/CeQueNousAvonsVu.tsx
  + import { subscribeFocus, getLastFocus } from '@/lib/focusBus';
  + useEffect au montage :
      - lit getLastFocus() (replay si récent)
      - subscribeFocus(d => mapKindToSense(d.kind) && setActiveSense(...))
```

Le bus rejoue déjà le dernier focus si reçu < 4 s (`RECENT_MS`) → fonctionne même si le composant monte après le `dispatchFocus`.

`MainCuration` fait déjà le reste (scroll + dépliage de la carte via `data-focus-id`), et `FocusHalo` ajoute le halo sur la cible.

## Détails techniques

- Pas de migration BDD, pas de changement du RPC `search_global` (la route `?focus=practice:<id>&tab=apprendre` est déjà correcte).
- Pas de changement de la barre de recherche ni de `ExplorationMarcheurPage`.
- Aucun risque de régression sur le défaut « œil » : on ne change `activeSense` que si un focus pertinent existe.

## Validation

1. Taper « dendro » dans la recherche globale → cliquer la pratique.
2. On doit atterrir sur Apprendre › Ce que nous avons vu › **La main**, avec la carte « Datation de l'âge des grands arbres » dépliée et le halo visible.
3. Le défaut sans focus reste « L'œil ».
