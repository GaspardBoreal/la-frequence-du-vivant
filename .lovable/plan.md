# Vignette de carte : accéder aux idées d'animation

La petite fenêtre qui s'ouvre quand on touche un point de la carte reste discrète, mais elle donne désormais accès aux idées d'animation de l'étape — celles liées au lieu et celles liées au vivant.

## Ce que l'on verra

Dans la vignette, sous les compteurs (photos, sons, textes, espèces), une nouvelle ligne « Idées d'animation » avec deux pastilles côte à côte :

- **Le lieu — 3** (teinte ambre, icône repère)
- **Le vivant — 3** (teinte émeraude, icône feuille)

Chaque pastille est tactile (hauteur confortable au doigt) et affiche le nombre réel d'idées enregistrées. S'il n'y a aucune idée pour l'étape, la ligne n'apparaît pas : la vignette reste aussi sobre qu'aujourd'hui.

Un appui ouvre une **fiche plein écran par le bas** (sur mobile) / une fenêtre centrée (sur ordinateur) :

- en-tête : numéro de l'étape, son nom, un sous-titre court, et un dégradé sombre rappelant le marais ;
- deux onglets « Le lieu » / « Le vivant », celui touché étant déjà actif ;
- les idées en cartes empilées : titre, durée en pastille, description, matériel en petites étiquettes ;
- apparition en cascade des cartes, glissement horizontal entre les deux onglets ;
- en bas, un bouton « Explorer cette étape → » qui conduit à l'étape complète, et une fermeture qui ramène simplement à la carte, sans perdre la position ni le zoom.

Le bouton « Explorer cette étape → » actuel reste en place, inchangé.

## Détail technique

- **Comptes** : nouveau hook `useIdeesCountsParMarche(marcheIds)` — une seule requête sur `marche_animation_idees` jointe aux `exploration_waypoints` via `after_marche_id`, agrégée côté client en `{ marcheId: { lieu, vivant, waypointId } }`. Une requête pour toute la carte, pas une par vignette.
- **Vignette** : dans `ExplorationCarteTab.tsx`, insertion de la ligne de pastilles dans le `Popup` existant (autour des lignes 1090-1100), rendue seulement si `lieu + vivant > 0`.
- **Fiche** : nouveau composant `src/components/community/exploration/IdeesAnimationSheet.tsx`, basé sur `Sheet` (`side="bottom"`, `max-h-[85vh]`, contenu défilant, `safe-area` en bas) et sur les jetons de couleur existants. Lecture via le hook `useIdeesArret(waypointId)` déjà en place (lecture publique, aucune écriture ici).
- **État** : `useState` dans `ExplorationCarteTab` pour `{ waypointId, marcheNom, index, groupeActif }`; fermeture = remise à `null`, la carte n'est jamais remontée.
- Aucune migration : la table `marche_animation_idees` et ses règles de lecture publique suffisent.
- Lecture seule : édition et régénération restent réservées à la page `/sauniers`.
