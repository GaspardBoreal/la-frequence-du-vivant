# Fiche espèce du Tour de Jardin : photo agrandissable et vraie date d'observation

Deux corrections sur le panneau qui s'ouvre depuis une action du Tour de Jardin (exemple : Pigeon ramier sur « Maison sous Blossac »).

## 1. Ouvrir la photo en grand, sans quitter le tour

Aujourd'hui la vignette n'est pas cliquable.

- La vignette devient un bouton (curseur, contour au clavier, libellé « Agrandir la photo »).
- Au clic, la photo s'affiche en grand par-dessus le panneau, toujours dans la fiche du tour : fond sombre, image centrée qui s'adapte à l'écran, croix de fermeture en haut à droite, fermeture aussi par Échap ou en touchant le fond.
- Mobile d'abord : image plein cadre, zone de fermeture large (≥ 44 px), aucun défilement de la page derrière.
- Quand plusieurs photos existent pour l'espèce, on peut passer de l'une à l'autre par glissement latéral ou par flèches, avec un compteur discret (1/3).
- Le panneau du bas reste ouvert dessous : fermer la grande image ramène exactement à la fiche.

## 2. Afficher la date de dernière observation

Le champ « Dernière fois » affiche aujourd'hui la date du jour. Vérifié en base : la date fournie par la fonction `get_exploration_species_pool` est un `GREATEST(dernier instantané, dernière observation marcheur)` — pour une espèce issue d'iNaturalist, c'est donc la date de collecte de l'instantané (aujourd'hui si la synchronisation vient de tourner), pas la date d'observation.

Correction : la date affichée sera calculée à partir des observations elles-mêmes — la plus récente parmi les relevés marcheurs et les observations iNaturalist rattachées à l'espèce (ces dates sont déjà transportées avec chaque observation). Si aucune date d'observation n'existe, on affiche « — » plutôt qu'une date trompeuse, et on précise « date d'observation » sous la valeur.

Bonus au passage : le champ « Famille » affiche parfois un simple numéro (« 2715 ») ; il sera masqué quand la valeur n'est pas un vrai nom de famille.

## Détails techniques

- `src/components/propriete/tour/refs/RefSpeciesPanel.tsx` : vignette en `<button>`, état local `zoomIndex`, visionneuse rendue via `PortalOverlay` (ou portail équivalent) au-dessus du `Sheet`, gestion Échap / clic fond / swipe, `prefers-reduced-motion` respecté, tokens sémantiques uniquement.
- Date : nouveau champ dérivé `lastObserved` calculé dans `usePropertySpeciesPool` (max des `observation_date` de `marcheur_attrs` et des `attributions`), exposé en plus de `lastSeen` existant pour ne rien casser dans les autres vues ; le panneau utilise `lastObserved` avec repli sur `—`.
- Famille : filtre `/^\d+$/` sur `sp.family` avant affichage.
- Aucune migration de base, aucune modification de fonction edge.
