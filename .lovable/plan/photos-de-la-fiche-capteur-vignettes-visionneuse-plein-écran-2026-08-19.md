# Photos de la fiche capteur : vignettes + visionneuse plein écran

Aujourd'hui la fiche capteur (panneau de la carte et popup d'accueil partenaire) n'affiche qu'**une seule** photo : l'image de couverture, non cliquable. Les autres clichés du capteur ne sont visibles que dans l'espace Jardin (bandeau « En situation »), qui dispose déjà d'une visionneuse plein écran.

## Ce qu'on met en place

**1. Une bande de vignettes dans la fiche capteur**
- La couverture reste en grand (hauteur actuelle), avec une pastille « 1/4 » en bas à droite quand il y a plusieurs photos.
- Sous la couverture, une rangée de petites vignettes carrées défilant horizontalement au doigt (masquée s'il n'y a qu'une photo).
- Un appui sur la couverture ou sur une vignette ouvre la photo en grand.

**2. Une visionneuse plein écran mobile-first**
- Ouverture en plein écran noir par-dessus la fiche (la fiche reste ouverte derrière : à la fermeture on revient exactement où on était).
- Navigation : **balayage gauche/droite au doigt**, flèches précédent/suivant (grosses cibles tactiles, masquées en début/fin), flèches clavier sur ordinateur.
- Retour à la vignette : bouton ✕ en haut à droite, appui sur le fond noir, touche Échap, et **balayage vers le bas**.
- Repères de lecture : compteur « 3 / 7 » et rangée de points en bas ; légende, date et coordonnées GPS si renseignées.
- Respect des encoches / barre d'accueil iPhone (zones sûres), image affichée en entier sans rognage, aperçu flou de la vignette pendant le chargement de l'original.

## Détails techniques

- `src/components/propriete/iot/SensorPhotoViewer.tsx` est généralisé et déplacé côté partagé (`src/components/iot/SensorPhotoViewer.tsx`), avec un ré-export depuis l'ancien chemin pour ne rien casser dans l'espace Jardin. Ajouts : gestes de balayage (Pointer Events, sans dépendance nouvelle), compteur, points de progression, `z-[4400]` pour passer au-dessus du `Dialog` de `SensorPeekDialog`, paddings `env(safe-area-inset-*)`.
- Nouveau hook léger `useCapteurPhotos(capteurId)` (déjà existant) branché dans `SensorCardBody` : chargement **uniquement à l'ouverture de la fiche**, donc aucun coût supplémentaire sur la carte ou la liste d'accueil (celles-ci continuent d'utiliser `useCapteurCovers`).
- `SensorCardBody` : la balise `<img>` de couverture devient un bouton, suivie de la bande de vignettes et du montage de la visionneuse. Le `coverUrl` existant reste le rendu de secours tant que les photos ne sont pas chargées.
- Aucun changement de schéma de base, de RLS ou d'upload : lecture seule des photos déjà stockées.

## Portée

Touche la fiche capteur partagée — donc à la fois le panneau de la carte (`/partenaire-iot/...?tab=carte`, `/admin/iot`) et la popup depuis l'accueil partenaire. Le bandeau « En situation » de l'espace Jardin garde ses fonctions d'édition (ajout, couverture, légende, suppression) inchangées.
