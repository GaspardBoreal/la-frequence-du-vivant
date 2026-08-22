# Filtrer la liste par clic sur les vignettes de rôle

Dans Admin → Communauté des Marcheurs → onglet « Communauté », les 5 vignettes de rôle (En devenir, Marcheur, Éclaireur, Ambassadeur, Sentinelle) et la vignette « Total » sont aujourd'hui purement décoratives. Seule « Admins » filtre déjà la liste.

## Comportement visé

- Clic sur une vignette de rôle → la liste ne montre que les marcheurs de ce rôle.
- Re-clic sur la même vignette → filtre retiré.
- Clic sur une autre vignette → remplace le filtre (un seul rôle actif à la fois).
- Clic sur « Total » → remet tout à zéro (rôle + filtre Admins).
- Le filtre de rôle se combine avec la recherche texte et avec le filtre « Admins ».
- Vignette active : même style que celui déjà utilisé par « Admins » (bordure + anneau primaire), avec curseur pointeur et libellé d'aide au survol.
- Un bandeau discret au-dessus de la liste indique le filtre actif avec un bouton « Effacer », dans le même esprit que le bandeau admin existant.

## Détail technique

Fichier concerné : `src/pages/CommunityProfilesAdmin.tsx` (uniquement, aucune requête ni logique serveur modifiée).

- Ajout d'un état local `roleFilter: CommunityRoleKey | null`.
- Les vignettes de rôle deviennent des `<button type="button">` reprenant les classes de la vignette Admins ; la vignette Total devient également cliquable (reset).
- `filtered` ajoute la condition `!roleFilter || p.role === roleFilter`.
- Aucun changement sur les compteurs eux-mêmes : ils continuent de compter sur l'ensemble des profils, pas sur la liste filtrée.
