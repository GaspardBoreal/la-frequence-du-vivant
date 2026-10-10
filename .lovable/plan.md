# Rendre les noms d’emplacements lisibles dans « Le Chantier »

## Solution retenue

Remplacer la rangée de petites pastilles par une **grille de sélecteurs adaptatifs** :

- sur grand écran, deux emplacements par ligne avec une largeur égale ;
- sur téléphone, un emplacement par ligne ;
- nom affiché en entier, avec retour naturel sur deux lignes si nécessaire ;
- lettre colorée conservée à gauche et coche de sélection à droite ;
- hauteur minimale stable pour garder un ensemble propre et facile à parcourir.

Cette présentation est préférable à une simple infobulle : elle rend les noms lisibles immédiatement, fonctionne aussi au tactile et évite de demander une action supplémentaire.

## Infobulle de secours

Ajouter malgré tout une infobulle discrète contenant le nom complet au survol, au focus clavier et lors d’un appui prolongé compatible. Elle servira uniquement aux noms exceptionnellement longs, sans devenir le moyen principal de lecture.

## Cohérence

Appliquer le même sélecteur dans les deux endroits concernés :

- composition d’un nouveau chantier ;
- modification des emplacements rattachés à un chantier existant.

La sélection, les couleurs et le fonctionnement du chantier restent inchangés.

## Vérification

Contrôler les noms longs sur ordinateur et téléphone, les états sélectionné/non sélectionné, l’infobulle au clavier et l’absence de débordement dans la fenêtre.
