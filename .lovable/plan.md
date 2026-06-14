## Problème

Quand on clique sur une vignette du Bento de `/admin/crm` (ex. « Équipe active »), la page de destination s'ouvre à la position de scroll précédente — l'utilisateur arrive en bas de page sans s'en rendre compte. React Router ne réinitialise pas le scroll lors d'un changement de route.

## Cause

`CrmShell` (layout commun `/admin/crm/*`) ne contient aucun mécanisme de scroll-restoration. Le scroll est porté par la fenêtre (`min-h-screen` sans `overflow`), donc il faut remettre `window.scrollY = 0` à chaque changement de pathname.

## Solution — `CrmScrollToTop` (scope CRM uniquement)

Ajout d'un petit composant utilitaire monté dans `CrmShell`, pour ne pas modifier le comportement du reste de l'app (espace marcheur, exploration, etc., qui peuvent vouloir conserver leur scroll).

### Fichiers

1. **Créer `src/layouts/CrmScrollToTop.tsx`**
   - `useLocation()` → écoute `pathname` (et éventuellement `search` ignoré pour ne pas re-scroller sur un simple changement de filtre dans la même page).
   - `useEffect` → `window.scrollTo({ top: 0, left: 0, behavior: 'instant' })`.
   - Retourne `null`.

2. **Modifier `src/layouts/CrmShell.tsx`**
   - Importer `CrmScrollToTop` et le monter en haut de `<main>` (à l'intérieur du Router, donc `useLocation` fonctionne).

### Comportement

- Click sur n'importe quelle vignette/lien du CRM → la nouvelle page s'ouvre toujours en haut.
- Changement d'onglet via le sidebar CRM → idem.
- Modification d'un `?queryParam` (filtres annuaire, pipeline) → **pas** de re-scroll (on n'écoute que `pathname`).
- Aucun impact hors `/admin/crm/*`.

## Hors scope

- Aucune autre route applicative n'est touchée.
- Pas de scroll-restoration sur "back" navigateur (comportement natif conservé).