# Tour de jardin : la page se fige à l'ouverture (ordinateur et tablette)

Vous ouvrez un tour et plus rien ne défile : toute la page est figée, pas seulement la fiche du tour. Ce symptôme correspond à un « verrou de défilement » resté actif — le mécanisme que le site utilise normalement pendant qu'une fenêtre ou un panneau est ouvert, et qui doit être relâché à la fermeture.

## Étape 1 — Identifier le verrou avec certitude

La cause exacte n'est pas encore prouvée par une lecture du code : plusieurs mécanismes peuvent poser ce verrou dans cette page. Première action, donc : reproduire l'ouverture d'un tour et regarder ce qui, à ce moment précis, bloque la page (défilement bloqué par un panneau invisible resté « ouvert », ou par une visionneuse photo fermée sans relâcher le verrou, ou par un fond de fenêtre resté monté). Le résultat de ce contrôle décide de la correction exacte.

## Étape 2 — Corriger la cause trouvée

Deux fragilités déjà repérées dans le code du Tour, à corriger dans tous les cas car elles peuvent produire exactement ce blocage :

1. **Panneau des ressources du tour** : quand on ouvre un prélèvement de sol, le panneau bas est retiré de l'écran alors qu'il est encore considéré comme ouvert. Il sera désormais refermé proprement avant d'être retiré, pour que le verrou soit relâché.
2. **Visionneuse photo d'une espèce** : elle bloque le défilement à l'ouverture et restaure l'état précédent à la fermeture ; si un autre panneau a déjà posé un verrou, elle peut restaurer une valeur périmée. Elle utilisera le même mécanisme partagé que le reste du site.

## Étape 3 — Filet de sécurité

Ajout d'une sécurité au niveau de l'espace jardin : quand plus aucune fenêtre ni panneau n'est ouvert, tout verrou de défilement résiduel est relâché. Ainsi, même si un autre panneau de la page se comporte mal demain, la page ne restera jamais figée.

## Détails techniques

- Contrôle en préalable : état de `document.body` (`overflow`, `pointer-events`, attribut `data-scroll-locked`) et présence d'éventuels overlays Radix montés au moment de l'ouverture d'un tour depuis `TourList` → `TourDetail`.
- `src/components/propriete/tour/refs/TourRefSheet.tsx` : le cas `kind === 'sample'` ne doit plus renvoyer `null` pendant que `open` est vrai (démontage d'un `Sheet` ouvert = verrou `react-remove-scroll` jamais nettoyé). Le composant rend toujours le `Sheet`, avec `open` forcé à faux pour les prélèvements, et délègue à `openSampleCore` après fermeture effective.
- `src/components/propriete/tour/refs/SpeciesPhotoViewer.tsx` : remplacer la manipulation directe de `document.body.style.overflow` par un compteur partagé (même approche que `src/lib/uiOverlayLevel.ts`), pour ne jamais restaurer une valeur capturée alors qu'un autre verrou était déjà posé.
- `src/pages/ProprieteEspace.tsx` : effet de garde qui, lorsqu'aucun élément `[data-state="open"][role="dialog"]` n'est présent, nettoie `body.style.overflow`, `body.style.pointerEvents` et `data-scroll-locked`.
- Aucune modification de logique métier, de base de données ni de contenu.

## Vérification

Ordinateur (1280 px) et tablette (1024 px) : ouvrir un tour depuis la liste, défiler jusqu'aux notes de terrain ; ouvrir puis fermer un lien d'espèce, un prélèvement, une photo plein écran et le carnet de terrain, et vérifier à chaque fois que la page défile encore. Contrôle identique en thème clair et sombre.
