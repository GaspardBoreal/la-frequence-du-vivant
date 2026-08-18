# L'Avant-première : ce que voit un marcheur avant sa première marche

## Ce que révèle la copie d'écran

Le nouvel inscrit est arrivé sur l'événement **« Les Secrets de Sauniers »** (12 septembre 2026, Ars-en-Ré). Vérifié en base :

- cet événement n'est rattaché à **aucune exploration** (`exploration_id` vide) et n'a donc **aucune étape** ;
- la page marcheur ne sait alors afficher ni titre (« Exploration » générique), ni carte, ni biodiversité ;
- l'événement possède pourtant des coordonnées GPS (46.208 / -1.509), un lieu et une description de 900 caractères — tout cela reste invisible ;
- il n'a pas d'image de couverture.

Ce n'est donc pas un problème de droits : c'est un écran vide par défaut quand la marche n'a pas encore eu lieu. À comparer avec Château Boutinet, qui a 11 étapes géolocalisées et s'affiche normalement.

## Le principe

Tant que la marche n'a pas eu lieu (ou que la présence n'est pas validée), la page bascule en **mode Avant-première** : tout se regarde, rien ne se saisit. On ne montre plus un vide, on montre une promesse.

## Ce qu'on construit

**1. Fond de carte toujours vivant**
Quand l'événement n'a pas d'étapes, la carte se centre sur ses coordonnées : épingle du point de rendez-vous, halo de la zone de marche, fond satellite/cadastre au choix, itinéraire d'accès. Plus jamais « Aucune coordonnée GPS » quand la base contient une position.

**2. Le compte à rebours sensible**
Bandeau haut : titre réel de la marche, date en toutes lettres, lieu, « dans 25 jours », statut d'inscription (« Inscription enregistrée — présence à valider sur place »). Respiration douce, une seule couleur d'accent.

**3. Le vivant qu'on va rencontrer**
Aperçu de biodiversité calculé autour du point de rendez-vous (mêmes sources iNaturalist que les marches existantes) : nombre d'espèces déjà connues dans le rayon, répartition par règne, carrousel « Vous croiserez peut-être… » avec vignettes d'espèces. C'est le moment wahouh : un lieu vide devient un lieu peuplé.

**4. La galerie d'anticipation**
À défaut de photos de cette marche, on montre les plus belles images d'autres marches du même type (éco-tourisme, agroécologique…), clairement libellées « Ailleurs, une marche du vivant » — inspiration, jamais confusion.

**5. Apprendre avant de marcher**
L'onglet Apprendre est ouvert dès maintenant : gestes d'observation, comment photographier, ce que l'on cherche, quiz. Le marcheur arrive préparé.

**6. Le verrou élégant**
Les zones de saisie (photos, sons, textes, observations) restent visibles mais scellées : une pastille discrète « Se déverrouille le jour de la marche » plutôt qu'un onglet absent. On explique ce qui viendra, on ne cache pas.

**7. Le rattrapage éditorial**
Dans l'admin de l'événement, un rappel signale ce qui manque pour une belle avant-première : image de couverture, description, exploration rattachée. « Les Secrets de Sauniers » n'a pas de couverture — c'est le premier écran que voit un inscrit.

## Détails techniques

- `src/components/community/ExplorationMarcheurPage.tsx` : quand `effectiveExplorationId` est nul ou qu'aucune étape n'existe, construire une étape virtuelle depuis `marche_events` (titre, `latitude`, `longitude`, `lieu`, `description`) au lieu de rendre les onglets à vide ; utiliser `marcheEvent.title` comme titre de page.
- `src/components/community/exploration/ExplorationCarteTab.tsx` : remplacer l'état vide par un rendu centré sur le point de l'événement quand `geoMarches` est vide mais que l'événement est géolocalisé ; masquer les outils d'édition (création de marche, GPS, waypoints) en mode avant-première.
- Nouveau `src/components/community/exploration/AvantPremiere/` : bandeau compte à rebours, carte du rendez-vous, aperçu biodiversité, galerie d'anticipation, cartes de préparation.
- Aperçu biodiversité : réutiliser les snapshots et le pipeline existant autour d'un point (`collect-biodiversity-step` / `collect-waypoint-biodiversity`) avec un rayon de découverte, sans écrire de nouvelles données de marche.
- Mode lecture seule : dérivé de la participation (`validated_at` nul) ou d'une date future ; propagé en prop aux onglets sensoriels pour désactiver les actions d'écriture (l'affichage seul suffit, les RLS restent la garantie réelle).
- Aucune migration de schéma. Uniquement des tokens sémantiques, thèmes clair et sombre respectés, vérification à 375 px.
