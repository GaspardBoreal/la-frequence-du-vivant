## Problème

Dans l'onglet **Carte**, le `SelectContent` « Tous les stages » s'affiche **sous** la carte Leaflet. Cause : Radix `SelectContent` utilise `z-50`, alors que les panes/controls Leaflet montent jusqu'à `z-index: 400–700` (et `.leaflet-top` à 1000). Le dropdown est donc visuellement masqué par la carte.

## Correction

Approche minimale et ciblée — pas de refactor :

1. **`src/pages/CrmAnnuaire.tsx`** — sur les deux `<SelectContent>` du filtre « stages » (onglet Carte ligne ~399, et onglet Entreprises ligne ~353 par cohérence), ajouter `className="z-[1100]"` pour passer au-dessus de tous les layers Leaflet.

2. **`src/components/crm/CrmCompaniesMap.tsx`** (à vérifier) — s'assurer que le conteneur Leaflet est `isolate` / `relative` avec un `z-index: 0` explicite sur le wrapper, pour que le stacking context reste contenu et n'empêche pas les portails Radix de remonter. Si déjà OK, ne rien toucher.

## Hors scope

- Pas de changement de logique, de data, ni de design global.
- Pas de modification des autres `SelectContent` du projet.
- Pas de toucher au composant `ui/select` (impact transverse).

## Vérification

Après build : ouvrir `/admin/crm/annuaire?tab=carte`, cliquer sur « Tous les stages » → la liste doit apparaître intégralement au-dessus de la carte, cliquable.
