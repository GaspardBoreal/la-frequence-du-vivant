# Fiches actions du Tour de Jardin : refonte mobile irréprochable

## Constat vérifié

Sur mobile, chaque fiche place sur une même ligne la poignée de déplacement, la case « réalisée », l’étoile du carnet, le titre, le bouton de modification et la suppression. À 394 px, ces commandes absorbent l’essentiel de la largeur et repoussent le contenu dans une colonne étroite.

La lecture souffre aussi de trois défauts précis :
- le type d’action et le moment sont affichés en très petit ;
- le détail, les liens vers les ressources et le schéma ne forment pas une hiérarchie visuelle nette ;
- l’édition remplace la fiche par un formulaire très long, ce qui déplace toute la liste et devient inconfortable avec le clavier mobile.

## Nouvelle présentation de chaque action

### Une carte structurée en trois zones

1. **En-tête lisible**
   - case « réalisée » tactile à gauche ;
   - type d’action dans une pastille illustrée, suffisamment lisible ;
   - étoile du carnet à droite, avec état sélectionné évident ;
   - poignée de déplacement discrète, séparée des commandes métier.

2. **Contenu prioritaire**
   - titre plus grand, sur toute la largeur disponible, avec état barré seulement quand l’action est réalisée ;
   - moment conseillé placé sous le titre avec une icône d’horloge ;
   - détail aéré, avec vrais sauts de ligne et liens vers espèces, secteurs, prélèvements ou objets conservés ;
   - schéma intégré dans un espace visuel stable, sans dépasser la carte.

3. **Pied de fiche**
   - état explicite « À faire » ou « Réalisée » ;
   - date de réalisation accessible sans comprimer le titre ;
   - menu d’actions discret pour « Modifier » et « Supprimer », afin d’éviter une rangée d’icônes concurrentes.

Les actions retenues pour le carnet auront un signal visuel léger sur la bordure et l’étoile, sans ajouter de texte encombrant.

## Édition mobile

Le crayon ouvrira un panneau depuis le bas au lieu de transformer la carte en formulaire :
- titre et détail en premier ;
- type, moment et schéma dans des champs pleine largeur ;
- aperçu du schéma sélectionné ;
- boutons « Enregistrer » et « Annuler » toujours accessibles au-dessus de la zone sûre de l’iPhone ;
- fermeture uniquement après enregistrement réussi, pour ne perdre aucune modification.

Sur ordinateur et tablette, le même panneau restera compact et centré dans une largeur confortable, afin de conserver une expérience cohérente.

## Ajustements du tour autour des fiches

- Réorganiser l’en-tête « Actions clés du tour » pour que les commandes principales occupent toute la largeur sur mobile.
- Simplifier le bandeau de sélection du carnet en deux lignes nettes plutôt qu’un texte qui se replie de façon irrégulière.
- Afficher « Enrichir avec l’Assistant » dans cette zone.
- Conserver le glisser-déposer, la sélection pour le carnet, la réalisation, la date, les liens vers les ressources et la suppression existants.

## Détails techniques

- Recomposer `TourActionRow.tsx` sans changer le modèle de données ni les fonctions de mise à jour.
- Extraire le formulaire dans un composant dédié basé sur le panneau `Sheet` existant, monté de manière stable pour éviter tout nouveau verrou de défilement.
- Utiliser uniquement les couleurs sémantiques et composants existants (`Button`, `Checkbox`, `Select`, `Sheet`, menu d’actions).
- Cibles tactiles d’au moins 40–44 px, texte secondaire au minimum 12 px, gestion des zones sûres iOS et respect de la réduction des animations.

## Vérifications

- Tester à 394 × 770 px, sur tablette et sur ordinateur.
- Vérifier une action courte, une action longue avec plusieurs paragraphes, une action avec schéma, une action réalisée et une action retenue.
- Vérifier déplacement, sélection carnet, modification, annulation, enregistrement, suppression et ouverture des ressources associées.
- Contrôler qu’aucun texte ne déborde et que l’ouverture/fermeture du panneau ne bloque jamais le défilement de la page.
