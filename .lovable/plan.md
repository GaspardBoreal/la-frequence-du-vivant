## Constat

Aujourd'hui la pastille « carnet photo » est posée sur le **centroïde** de la géométrie (`photoAnchor()` dans `ObjectsLayer.tsx` : moyenne des sommets du polygone). Résultat : un carré posé en plein milieu du massif, qui masque le remplissage, entre en concurrence visuelle avec les marqueurs d'espèces et paraît « collé au hasard » sur les formes allongées comme celle de la copie d'écran.

## Proposition : l'étiquette d'angle (« onglet de carnet »)

Le signe reste le même polaroïd doré, mais il devient une **étiquette accrochée au bord de l'ouvrage**, comme un onglet de carnet glissé dans la marge, jamais dans le motif.

1. **Nouvel ancrage géométrique** — au lieu du centroïde :
  - Polygone : sommet le plus au **nord-ouest** de l'enveloppe (coin haut-gauche du bbox projeté sur le sommet réel le plus proche), avec un léger décalage vers l'extérieur.
  - Ligne : première extrémité, décalée perpendiculairement.
  - Point : inchangé (décalé en haut-droite du picto pour ne pas le recouvrir).
2. **Décalage en pixels, pas en degrés** — `iconAnchor` déporté (ex. `[-6, 34]`) pour que la pastille reste **hors** de la surface quel que soit le zoom, sans dérive quand on zoome de z16 à z24.
3. **Fil d'attache** — une fine amorce dorée (2 px) dessinée dans le divIcon relie la pastille au bord, pour lire immédiatement « cette photo appartient à cet ouvrage ».
4. **Ancrage stable en édition** — recalcul de l'ancre à la volée quand l'objet est déplacé/redimensionné en mode Transformer.
5. **Discrétion adaptative** — sous un seuil de zoom (petites échelles), la pastille se réduit à un point doré compté ; au-delà, elle reprend sa micro-vignette photo. Sur l'objet **sélectionné**, elle se relève légèrement (scale + halo) pour rester cliquable.
6. **Anti-collision légère** — si deux ouvrages voisins produisent des ancres à moins de ~24 px, la seconde bascule sur le coin nord-est pour éviter la superposition.

## Détails techniques

- `ObjectsLayer.tsx` : remplacer `photoAnchor()` par `photoTagAnchor()` (coin NO / extrémité + variante NE en cas de collision), et passer un `iconAnchor` déporté.
- `photos/PhotoPastille.tsx` : ajouter une variante `--tag` (amorce de fil, orientation gauche/droite) et un mode compact (`--dot`) pour les petits zooms ; l'API `PhotoPastilleButton` du registre reste inchangée.
- `src/index.css` : styles `.ds-photo-pastille--tag`, `.ds-photo-pastille__thread`, `.ds-photo-pastille--dot`, transitions douces.
- Aucun changement de données, de hook (`useObjetPhotos`) ni de comportement au clic (ouverture du rail galerie).