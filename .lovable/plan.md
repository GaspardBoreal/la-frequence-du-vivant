# L'Avant-première : ce que voit un marcheur avant sa première marche

## Analyse corrigée

Tu as raison : le QR code pointe bien sur **Château Boutinet : le vignoble vivant**. Vérifié en base :

- lien d'inscription actif `07779042ad491308` → événement Boutinet du 26 septembre 2026 ;
- l'exploration rattachée contient **11 étapes, toutes géolocalisées** (Malbec, Mare, Cabernet Franc, Haie, Forêt ELFE, 3 prairies, vignes, Yourte) ;
- 5 participations sur cet événement, toutes validées, dont la nouvelle inscrite du 29 juillet ;
- l'événement n'a **pas d'image de couverture**.

Donc la carte de Boutinet a de quoi s'afficher. L'écran vide de la copie ne vient pas de Boutinet : le bandeau affiche « Exploration », or ce libellé générique n'apparaît que lorsque **ni l'exploration ni l'événement ne sont résolus** — sur Boutinet, le titre réel serait affiché. Le marcheur a donc atterri sur une page d'exploration sans contexte : cas typique d'un événement sans exploration rattachée (« Les Secrets de Sauniers », dernière inscription du 7 août, n'en a aucune) ou d'un identifiant d'exploration introuvable.

Je ne conclus pas sans preuve : **première étape du chantier, reproduire l'écran** avec l'URL exacte du nouvel inscrit (ou son compte) pour figer la cause. Le reste du plan tient quelle que soit la cause, puisqu'il supprime tous ces culs-de-sac.

## Le principe

Tant que la marche n'a pas eu lieu — ou que la présence n'est pas validée — la page bascule en **mode Avant-première** : tout se regarde, rien ne se saisit. On ne montre plus un vide, on montre une promesse.

## Ce qu'on construit

**0. Reproduire et fermer les culs-de-sac**
Rejouer le parcours QR → inscription → première ouverture, relever l'URL réelle d'arrivée. Puis garantir qu'aucun chemin ne mène à une page sans titre : un événement sans exploration se rend depuis l'événement lui-même, un identifiant inconnu renvoie vers la liste des marches avec un message clair.

**1. Fond de carte toujours vivant**
Sur Boutinet, les 11 étapes s'affichent d'emblée en lecture seule, avec le point de rendez-vous mis en avant. Pour un événement sans étapes, la carte se centre sur les coordonnées de l'événement : épingle du rendez-vous, halo de la zone, accès. Plus jamais « Aucune coordonnée GPS » quand une position existe en base.

**2. Le compte à rebours sensible**
Bandeau haut : titre réel de la marche, date en toutes lettres, lieu, « dans 39 jours », statut d'inscription (« Inscription enregistrée — présence à valider sur place »). Respiration douce, une seule couleur d'accent.

**3. Le vivant qu'on va rencontrer**
Aperçu de biodiversité autour du point de rendez-vous (mêmes sources que les marches existantes) : espèces déjà connues dans le rayon, répartition par règne, carrousel « Vous croiserez peut-être… ». C'est le moment wahouh : un lieu inconnu devient un lieu peuplé.

**4. La galerie d'anticipation**
Boutinet n'a pas d'image de couverture : à défaut, on montre les plus belles images d'autres marches du même type, clairement libellées « Ailleurs, une marche du vivant » — inspiration, jamais confusion.

**5. Apprendre avant de marcher**
L'onglet Apprendre est ouvert dès l'inscription : gestes d'observation, comment photographier, ce que l'on cherche, quiz. Le marcheur arrive préparé.

**6. Le verrou élégant**
Les zones de saisie (photos, sons, textes, observations) restent visibles mais scellées : pastille « Se déverrouille le jour de la marche » plutôt qu'un onglet absent.

**7. Le rattrapage éditorial**
Dans l'admin de l'événement, un rappel signale ce qui manque pour une belle avant-première : image de couverture, description, exploration rattachée. Boutinet n'a pas de couverture — c'est le premier écran que verront les inscrits du QR.

## Détails techniques

- `src/components/community/ExplorationMarcheurPage.tsx` : supprimer le titre générique « Exploration » (les requêtes `.single()` sur exploration et événement retournent `null` silencieusement) ; quand `effectiveExplorationId` est nul, s'appuyer sur `marche_events` seul (titre, `latitude`, `longitude`, `lieu`, `description`) et construire une étape virtuelle ; état d'erreur explicite si rien n'est résolu.
- `src/components/community/exploration/ExplorationCarteTab.tsx` : remplacer l'état vide par un rendu centré sur le point de l'événement quand `geoMarches` est vide mais que l'événement est géolocalisé ; masquer les outils d'édition en mode avant-première.
- Nouveau `src/components/community/exploration/AvantPremiere/` : bandeau compte à rebours, carte du rendez-vous, aperçu biodiversité, galerie d'anticipation, cartes de préparation.
- Aperçu biodiversité : réutiliser les snapshots et le pipeline point existant (`collect-biodiversity-step` / `collect-waypoint-biodiversity`) avec un rayon de découverte, sans écrire de données de marche.
- Mode lecture seule : dérivé de la participation (`validated_at` nul) ou d'une date future ; propagé en prop aux onglets sensoriels pour désactiver les actions d'écriture — les RLS restent la garantie réelle.
- Aucune migration de schéma. Tokens sémantiques uniquement, thèmes clair et sombre, vérification à 375 px.
