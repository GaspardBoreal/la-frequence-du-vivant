# Aligner le « Cortège vivant » avec l’emplacement vu dans l’Atelier

## Constat vérifié

Le chantier « Arbre de Judée : Mise en lumière » associe actuellement **un ouvrage** (« Massif polychromatique ») **et un emplacement** (« Massif Arbre de Judée »). Leurs tracés enregistrés sont distincts et éloignés. Avec « Dans le tracé », le Cortège vivant regroupe les observations des **deux surfaces** ; la carte de l’Atelier montre ici les points autour du seul emplacement. Le total de 29 désigne les espèces distinctes dans l’union du chantier, et non dans le seul emplacement. La douzaine visible sur la capture est un nombre de points à l’écran, pas encore un décompte vérifié d’espèces uniques dans ce tracé.

## Changement proposé

1. Ajouter dans « Cortège vivant » un choix de périmètre lisible sur téléphone : **Tout le chantier**, puis chaque **emplacement** et chaque **ouvrage** rattachés, nommés séparément. Conserver « Tout le chantier » pour la lecture globale du lot ; sélectionner « Massif Arbre de Judée » pour retrouver uniquement les observations de ce tracé.
2. Appliquer le même calcul géométrique et le même rayon depuis le bord au tracé choisi, puis regrouper les résultats par nom scientifique normalisé. Faire suivre ce choix par les compteurs Tout / Flore / Faune / Autres, les orbites, la liste et le curseur temporel. Afficher côte à côte le nombre d’**espèces** et d’**observations** pour éviter de confondre photos, points et espèces.
3. Rendre le périmètre explicite dans le titre central et les libellés du Cortège ; lorsqu’un seul emplacement est associé, le proposer comme vue d’arrivée du Cortège, avec retour immédiat à « Tout le chantier ». Ne pas modifier silencieusement le périmètre global du chantier, son ICG, ses prélèvements ou ses rapports.
4. Vérifier sur ce chantier les deux modes et les rayons 0 / 5 / 25 m : les espèces et observations de « Massif Arbre de Judée · Dans le tracé » doivent correspondre aux points situés dans ce même tracé dans l’Atelier. Vérifier la bascule sur mobile et le cas de plusieurs tracés qui se chevauchent, sans double comptage.

## Détails techniques

Réutiliser `scopeByRadius` sur la géométrie sélectionnée ou sur l’union existante, à partir des mêmes `pool.waypoints` que l’Atelier. Garder les calculs du bilan et de l’ICG sur l’union enregistrée ; limiter la nouvelle sélection à la présentation du « Cortège vivant ». Aucun changement de base de données nécessaire.
