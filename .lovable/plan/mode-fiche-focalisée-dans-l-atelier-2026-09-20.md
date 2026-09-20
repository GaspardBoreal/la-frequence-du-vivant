# Mode Fiche focalisée dans l’Atelier

## Choix retenu

Ne pas déplacer les commandes à gauche : cela déplacerait l’encombrement sans le supprimer et entrerait en conflit avec la palette de l’Atelier.

Dès qu’un ouvrage ou un emplacement est sélectionné et que sa fiche s’ouvre à droite, la carte passe en **mode Fiche focalisée** :

- le sélecteur **Géo / Sat / Relief / Cadastre** disparaît ;
- les boutons **position GPS**, **+** et **−** disparaissent ;
- le bouton flottant **IA de Jardin** disparaît également ;
- la frise temporelle inférieure se masque si elle gêne la fiche ;
- la disparition se fait avec une transition courte et calme, sans déplacement des commandes vers un autre bord.

La carte reste utilisable : glisser pour se déplacer, molette ou pincement pour zoomer. La croix de fermeture de la fiche restaure immédiatement toutes les commandes, à leur position habituelle.

## Accès aux fonctions utiles

- L’accès contextuel à l’IA de Jardin reste présent **dans la fiche de l’ouvrage**, où il est plus pertinent que le bouton général.
- Changer de fond, se géolocaliser ou utiliser les boutons de zoom nécessite simplement de fermer la fiche ; aucun réglage n’est perdu.
- Le comportement s’applique de façon identique aux fiches d’ouvrages et d’emplacements, sur ordinateur, tablette et mobile.
- Le mode de transformation existant reste prioritaire et conserve son propre affichage épuré.

## Détails techniques

- Dans `PaletteStudio`, dériver un état `inspectorActive` depuis l’ouvrage ou l’emplacement sélectionné, indépendamment de `transforming`.
- Faire évoluer `RichMap` pour que ses commandes puissent être réellement masquées et neutralisées, et non seulement atténuées comme dans le mode Transformation actuel.
- Appliquer le même état aux commandes extérieures à la carte : bouton IA de Jardin et frise temporelle.
- Utiliser une transition d’opacité courte, puis retirer les éléments des interactions et de la navigation clavier pendant que la fiche est ouverte.
- Restaurer automatiquement les commandes à la fermeture ou au changement vers une vue sans fiche.
- Vérifier le résultat sur la largeur actuelle de l’Atelier, puis sur mobile : aucune superposition avec la fiche, la palette gauche ou les outils de transformation.

Aucune modification des données, des droits ou du fonctionnement des ouvrages et chantiers.
