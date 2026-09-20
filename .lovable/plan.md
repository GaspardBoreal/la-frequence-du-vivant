# Ouvrir un chantier même quand aucun ouvrage n'est encore dessiné

## Ce qui bloque aujourd'hui

La fenêtre « Le Chantier » demande de cocher au moins un ouvrage. Sur « Maison sous Blossac », la base ne contient **aucun ouvrage** : la colonne de droite affiche seulement « Dessinez d'abord un ouvrage dans l'Atelier », et le bouton « Ouvrir le chantier » reste grisé. Ce n'est pas un problème de droits — le propriétaire et l'équipe ont bien le droit de créer chantiers et ouvrages.

## Ce qui change

**1. Créer un ouvrage sans quitter la fenêtre**

Sous la liste des ouvrages, une rangée « Nouvel ouvrage » propose les tracés les plus courants (massif, potager, haie, mare, arbre…). Un clic :

- ferme la fenêtre du Chantier et arme l'outil de dessin sur le plan,
- affiche un bandeau « Tracez votre ouvrage — il rejoindra le chantier »,
- dès le tracé terminé, la fenêtre du Chantier se rouvre avec le nouvel ouvrage déjà coché et son nom prérempli.

Un bouton « Annuler » dans le bandeau ramène simplement à la fenêtre du Chantier.

**2. Chantier sur l'ensemble du jardin**

Pour ceux qui ne veulent rien dessiner, une option « Tout le jardin » remplace la sélection d'ouvrages : le chantier prend alors le périmètre de la propriété. Le bouton n'est donc plus jamais bloquant — soit des ouvrages sont cochés, soit « Tout le jardin » est choisi.

**3. Message clair si les droits manquent**

Un visiteur en lecture seule voit un message explicite (« Vous consultez ce jardin en lecture seule ») au lieu d'un bouton inerte.

## Détails techniques

- `ChantierLotPicker.tsx` : nouvelle prop `onDrawNew(toolKey)` et option `scope: 'ouvrages' | 'jardin'`. Bouton actif si `selected.length > 0 || scope === 'jardin'`.
- `PaletteStudio.tsx` : mémorise `chantierResume` (lot en cours de composition), ferme l'overlay, appelle le sélecteur d'outil existant (`setTool`), et sur `upsertObjet` réussi rouvre `ChantierOverlay` avec l'identifiant du nouvel ouvrage présélectionné.
- Ouvrages proposés : sous-ensemble de `TOOL_BY_KEY` (massif, potager, haie, mare, arbre, allée), mêmes glyphes que la boîte à outils.
- Périmètre « tout le jardin » : `objet_ids = []` dans `propriete_chantiers`; `useChantierScope` retombe sur l'emprise cadastrale de la propriété quand la liste est vide, au lieu du périmètre géométrique des ouvrages.
- Droits : affichage conditionné par `can_curate_propriete_parcelles` (déjà exposé côté studio via `canCurate`). Aucune migration, aucune modification de politique d'accès.
