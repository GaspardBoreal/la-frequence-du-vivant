# Refonte de « Démarrer mon jardin »

## Objectif
Réorganiser `/jardin/demarrer` en deux sous-menus simples : **Créer** et **Carte des jardins**, tout en conservant les parcours actuels et en protégeant la localisation des jardins privés.

## 1. Sous-menu « Créer »
- Ajouter une navigation claire à deux entrées en haut de page : **Créer** et **Carte des jardins**.
- Regrouper sous **Créer** les trois cartes existantes :
  - **Créer mon jardin** ;
  - **Rejoindre un jardin** ;
  - **Inviter quelqu’un dans un de vos jardins**.
- Conserver les comportements actuels : création, choix d’un modèle, géolocalisation, code d’invitation et accès aux jardins existants.
- Afficher la carte d’invitation uniquement quand la personne possède au moins un jardin, avec un état explicite sinon.
- Adapter la disposition aux téléphones, tablettes et ordinateurs sans imbriquer inutilement les cartes.

## 2. Sous-menu « Carte des jardins »
- Ajouter une carte interactive basée sur la carte déjà utilisée dans le projet.
- Afficher tous les jardins disposant de coordonnées, soit actuellement 10 jardins sur 12.
- Ne jamais envoyer les coordonnées exactes au navigateur : calculer côté base une position approximative, stable pour chaque jardin, suffisamment décalée pour protéger l’adresse réelle.
- Ajuster automatiquement la carte à l’ensemble des points et proposer zoom, changement de fond et géolocalisation de la personne.
- Une seule infobulle par jardin, sans nom de propriétaire, adresse, courriel ni autre donnée personnelle.
- Contenu de l’infobulle :
  - type de jardin ;
  - surface totale en m² ;
  - nombre d’espèces identifiées ;
  - nombre d’analyses de sol ;
  - type de sol ;
  - nombre de tours de jardin ;
  - nombre de chantiers réalisés.
- Afficher « Non renseigné » lorsqu’une donnée n’existe pas, plutôt qu’un chiffre ou un libellé inventé.
- Prévoir un état vide si aucun jardin géolocalisé n’est disponible et un état de chargement lisible.

## 3. Données et confidentialité
- Créer une fonction de lecture dédiée qui ne retourne que les données nécessaires à la carte et des coordonnées déjà approximées.
- Autoriser cette lecture aux personnes connectées, puisque la page redirige actuellement vers la connexion.
- Calculer la surface depuis la réponse d’intention `surface_totale`, avec repli sur `surface_hectares × 10 000`.
- Déduire le type de jardin depuis le modèle choisi, puis depuis le style renseigné.
- Déduire le type de sol depuis le dernier diagnostic réellement renseigné.
- Compter les analyses terminées, les tours enregistrés et uniquement les chantiers dont le statut indique qu’ils sont réalisés.
- Compter les espèces avec la source canonique déjà utilisée par les pages Jardin, en dédoublonnant par nom scientifique entre les explorations liées.
- Ne modifier aucune politique générale d’accès aux données détaillées des jardins.

## 4. Pied de page
- Ajouter en bas de page le pied de page existant des **Marches du Vivant**, dans sa variante `marches`, sur toute la largeur.

## 5. Vérifications
- Vérifier les deux sous-menus et les trois parcours de création/rejoindre/inviter.
- Vérifier la carte avec plusieurs points, une seule infobulle ouverte à la fois et toutes les valeurs demandées.
- Contrôler qu’aucune coordonnée exacte ni donnée personnelle n’est exposée dans les réponses reçues par la page.
- Vérifier le rendu sur téléphone et ordinateur, ainsi que le pied de page.

## Détails techniques
- Interface : `JardinDemarrer`, composants dédiés pour la navigation et la carte, `RichMap`, marqueurs et infobulles Leaflet, `Footer variant="marches"`.
- Données : nouvelle fonction SQL `SECURITY DEFINER` à résultat strictement limité et permissions accordées à `authenticated` seulement.
- Approximation : décalage déterministe calculé côté base à partir de l’identifiant du jardin, afin que le point reste stable sans révéler sa position réelle.
