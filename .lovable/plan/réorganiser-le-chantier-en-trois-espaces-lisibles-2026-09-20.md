# Réorganiser « Le Chantier » en trois espaces lisibles

## Nouvelle structure

Le bandeau supérieur reste toujours visible et devient le repère commun de l’écran :

- nom du chantier et ouvrages concernés ;
- date des travaux et niveau de rigueur ;
- **indice ICG actuel mis en évidence** — 81 dans l’exemple, avec son niveau sur 100 ;
- accès aux rapports, à la modification du lot et à la fermeture ;
- trois sous-menus immédiatement sous le bandeau.

```text
Visu chantier     Palette végétale     Bilan écologique
```

Le sous-menu actif est clairement souligné. Sur mobile, les trois entrées restent visibles dans une barre compacte, sans empiler tous les contenus.

## 1. Visu chantier

Cet espace devient le carnet visuel avant / pendant / après :

- « Verser des photographies » devient **« Ajouter des photos ou vidéos »** ;
- choix de l’ouvrage et de la phase avant / pendant / après ;
- import depuis les fichiers, prise de photo sur mobile et sélection de vidéos courtes ;
- progression d’envoi et refus explicite avant transfert si une vidéo dépasse la limite réelle de 50 Mo ;
- mosaïque commune des photos et vidéos, avec lecture vidéo dans la visionneuse ;
- comparaison au rideau réservée aux photographies avant / après compatibles ;
- possibilité de corriger la phase de chaque média après l’import.

Ce sera le sous-menu d’arrivée : on entre d’abord dans le chantier par ses preuves visuelles.

## 2. Palette végétale

Cet espace rassemble la projection et les décisions sur le cortège :

- choix **Après projeté / Après constaté** ;
- choix du scénario existant ;
- accès au Scénographe pour créer ou modifier la plantation projetée ;
- tri des espèces : conservée, retirée, nouvelle ou écartée ;
- aperçu immédiat de l’effet de ces choix sur l’ICG avant validation ;
- lecture du rôle positif, négatif ou neutre de chaque espèce.

L’objectif est d’avoir un seul parcours cohérent : comprendre le cortège, faire ses choix, puis voir leur effet.

## 3. Bilan écologique

Ce titre remplace « Autres ». Il regroupe les éléments qui expliquent et justifient le résultat :

- comparaison synthétique avant / après et variation de l’ICG ;
- détail des concordances sol / flore ;
- quatre échelles écologiques ;
- « Comment ce chiffre est né » ;
- jury détaillé des espèces avant et après ;
- prélèvements de sol retenus dans le périmètre du chantier.

Les rapports simple et complet restent accessibles depuis le bandeau, quel que soit le sous-menu ouvert.

## Détails techniques

- Refactoriser l’affichage de `ChantierOverlay` en trois vues internes, sans changer l’URL ni le format des chantiers existants.
- Conserver les calculs ICG au niveau commun afin que le chiffre du bandeau et les trois vues restent synchronisés.
- Étendre le carnet des ouvrages aux vidéos tout en restant compatible avec toutes les photos existantes : ajouter le type de média et la durée, conserver le rattachement à l’ouvrage et la phase du chantier.
- Réutiliser l’envoi vidéo instrumenté déjà présent dans l’espace d’analyse : contrôle à 50 Mo, progression réelle, métadonnées et messages d’échec lisibles.
- Adapter la mosaïque, la visionneuse et l’indicateur d’envoi aux deux types de médias ; ne jamais proposer une vidéo dans le rideau photographique.
- Employer les composants de navigation et les couleurs sémantiques déjà utilisés dans l’espace Propriété.

## Vérification

- Contrôler les trois sous-menus sur ordinateur et mobile, avec l’ICG toujours visible et sans perte d’état en changeant d’espace.
- Importer une photo et une vidéo dans chacune des trois phases, vérifier progression, lecture, classement et réouverture.
- Vérifier le scénario, le tri du cortège, le recalcul ICG et les deux rapports après la réorganisation.
- Reproduire le cycle ouverture / fermeture de la carte et supprimer l’erreur Leaflet `_leaflet_pos` si elle se manifeste encore pendant ce parcours.
