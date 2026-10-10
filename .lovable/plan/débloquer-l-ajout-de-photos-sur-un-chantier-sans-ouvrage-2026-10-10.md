# Débloquer l'ajout de photos sur un chantier sans ouvrage

## Cause (vérifiée)
Le chantier « Massif méditerranéen Laurent » contient un seul emplacement et aucun ouvrage. Aujourd'hui, chaque photo de chantier doit être rattachée à un ouvrage. Sans ouvrage, le bouton « Choisir des médias » reste grisé et le glisser-déposer ne fait rien, sans aucune explication.

## Ce qui change
- Les photos et vidéos peuvent aussi être rattachées à un **emplacement** du chantier, pas seulement à un ouvrage.
- Le sélecteur « Rattacher à » liste les ouvrages et les emplacements du chantier. S'il n'y a qu'un seul choix (le cas ici), il est pris automatiquement et le bouton est actif.
- Le carnet visuel, le Rideau, le classement Avant / Pendant / Après et les rapports PDF affichent aussi les médias des emplacements.
- Si le chantier n'a ni ouvrage ni emplacement, un court message dit pourquoi l'ajout est bloqué, avec un lien « Modifier le lot ».

## Détails techniques
- Migration : `propriete_objet_photos.objet_id` devient facultatif, ajout de `zone_id uuid` (référence vers l'emplacement) et d'un trigger de validation : exactement l'un des deux champs doit être rempli. Les règles d'accès existantes, basées sur `propriete_id`, restent les mêmes.
- `useObjetPhotos` : l'envoi accepte une cible `{ kind: 'objet' | 'zone', id }`. Le chemin de stockage suit la même convention, avec le préfixe de l'emplacement.
- `ChantierPhotoIntake` : options regroupées « Ouvrages » et « Emplacements », plus l'état vide expliqué.
- `ChantierOverlay` : `handleIntake` et la liste `phased` incluent les médias liés à `active.zone_ids`, et les phases restent enregistrées dans `propriete_chantier_media_phases`.
- Vérification : envoi réel d'une photo sur ce chantier, puis contrôle qu'elle apparaît dans le carnet en « Avant travaux ».
