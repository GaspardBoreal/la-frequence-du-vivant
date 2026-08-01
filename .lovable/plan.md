## Objectif

Afficher dans la vue Scénario (Scénographe) exactement la même pastille « carnet photo » que dans l'Atelier — même code, une seule source de vérité, pour que les évolutions futures profitent aux deux vues.

## Constat

- L'Atelier affiche la pastille via `ObjectsLayer.tsx` : elle y est codée en dur au milieu du rendu des objets (calcul d'ancrage `photoAnchor`, choix du côté `sideById`, variante compacte selon le zoom, `photoPastilleIcon`, handler `onOpenPhotos`), alimentée par le hook `useObjetPhotos` et ouverte dans `OuvragePhotoViewer`.
- Le Scénographe dessine les emprises avec `OuvrageGeometryLayer.tsx`, qui ne connaît ni les photos ni la pastille — d'où l'icône absente.

## Ce qu'on fait

1. **Extraire la couche pastille** dans un nouveau composant partagé `src/components/propriete/palette/studio/photos/OuvragePhotoPastilleLayer.tsx` :
   - il reçoit `objets`, `photoCounts`, `photoThumbs`, `selectedId`, `onOpenPhotos` ;
   - il embarque `photoAnchor`, le calcul `sideById` (anti-chevauchement) et la variante compacte selon le zoom, déplacés depuis `ObjectsLayer`.
2. **Rebrancher l'Atelier** dessus : `ObjectsLayer.tsx` supprime son bloc pastille interne et rend la nouvelle couche. Rendu visuel strictement identique.
3. **Brancher le Scénographe** : `ScenographeFullscreen.tsx` appelle `useObjetPhotos(proprieteId)`, rend `<OuvragePhotoPastilleLayer />` juste après `OuvrageGeometryLayer` (pastilles sur l'ouvrage actif ET les voisins, comme dans l'Atelier), et ouvre `OuvragePhotoViewer` au clic — même visionneuse, mêmes légendes/navigation.
4. Le clic sur la pastille n'entraîne pas de changement d'ouvrage ni de pose de sujet (stop propagation, neutre en mode « pose armée »).

## Détails techniques

- Aucun changement de schéma ni de requêtes : `useObjetPhotos` est déjà property-wide et alimente déjà les compteurs/vignettes.
- `PhotoPastille.tsx` (icône + bouton) reste inchangé : il est déjà la brique commune.
- Les z-index Leaflet (`zIndexOffset={800}`) sont conservés pour que la pastille passe au-dessus des sujets plantés.
- Vérification par typecheck après refactor.
