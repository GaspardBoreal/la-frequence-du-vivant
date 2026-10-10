# Visibilité fiable des vues dans l’Atelier

## Diagnostic confirmé

- Les deux emplacements de « Jardin Monde DEVIAT » sont bien présents en base, avec une géométrie `Polygon` valide et `visible = true`. Le problème ne vient donc ni d’une absence de données ni d’un contour invalide.
- Le bouton global « Emplacements » et les yeux de chaque emplacement représentent deux niveaux distincts : la vue générale autorise leur affichage, puis chaque emplacement peut être masqué séparément.
- Sur la carte, les contours d’emplacements sont actuellement dessinés dans la couche Leaflet standard, avant les Observations du vivant et les ouvrages. Dans cette zone très dense, leurs traits fins et leurs remplissages faibles sont visuellement recouverts ou noyés.
- Le clic sur l’œil individuel appelle bien une modification de `visible`, mais `TabPalette` ne retransmet pas ce champ à l’enregistrement. L’œil peut donc sembler actif ou revenir à son état précédent sans piloter durablement la carte.

## Résolution proposée

### 1. Une commande globale sobre dans « Vues de fond »

Ajouter à droite du titre une commande compacte avec icône œil :

- si au moins une vue est active : **Masquer toutes les vues** ;
- si toutes sont masquées : **Afficher toutes les vues**.

La commande agira uniquement sur les six vues principales de cette section :

- Parcelles cadastrales ;
- Emplacements ;
- Observations du vivant ;
- Prélèvements de sol ;
- État sanitaire ;
- Capteurs et sondes.

Les réglages internes restent conservés : portée et période du vivant, halos/tournée/mémoire sanitaire. Les yeux individuels des emplacements et les calques d’ouvrages restent indépendants. La commande utilisera un état visuel clair, un libellé accessible et une zone tactile adaptée au mobile sans alourdir le panneau.

### 2. Rendre les emplacements réellement lisibles

- Créer une couche cartographique dédiée aux emplacements, placée au-dessus des parcelles et des ouvrages, mais sous les points du vivant et leurs fenêtres.
- Renforcer calmement leur signature : contour continu plus contrasté, léger liseré de séparation et remplissage discret ; l’emplacement sélectionné garde une emphase plus forte.
- Conserver les clics, doubles-clics, infobulles et outils de transformation existants.
- Utiliser une extraction géométrique partagée et défensive pour le rendu et le cadrage, afin qu’un futur contour composite ou incomplet ne disparaisse plus silencieusement.

### 3. Réparer les yeux individuels

- Transmettre intégralement les champs modifiables d’un emplacement (`visible`, verrouillage, opacité, géométrie, nom, couleur et note) lors d’une mise à jour.
- Vérifier que masquer un emplacement le retire immédiatement du plan, qu’il reste masqué après réouverture, puis que l’œil le réaffiche durablement.
- Garder la règle existante : si la vue générale « Emplacements » est éteinte, aucun emplacement ne s’affiche, même si son œil individuel est actif.

## Validation

- Tester les quatre états : tout affiché, tout masqué, affichage partiel, puis réaffichage global.
- Tester séparément les deux emplacements visibles sur la capture, avec les Observations du vivant et les ouvrages allumés.
- Vérifier la persistance des yeux individuels après fermeture/réouverture de l’Atelier.
- Vérifier sélection, infobulle et transformation d’un emplacement après le changement de couche.
- Contrôler ordinateur et mobile, thèmes clair et sombre, sans recouvrement du nouveau contrôle.
- Vérifier qu’aucune erreur Leaflet ni erreur de compilation n’est introduite.

## Périmètre technique

Interventions ciblées dans `LayersPanel`, `PaletteStudio`, le passage des mises à jour depuis `TabPalette`, et un petit utilitaire cartographique partagé. Aucune migration, aucune donnée existante et aucune URL ne seront modifiées.
