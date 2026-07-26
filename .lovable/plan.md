## Objectif

Ajouter à la carte « Carte des révélations » (étape J'identifie) le même mode plein écran que celui déjà en place sur « Étape 2 · Prélèvements — 3 à 5 échantillons représentatifs ».

## Ce qui existe déjà (référence)

`SamplesMapBlock.tsx` implémente le motif suivant :
- un état `fullscreen`, un bouton rond vert en haut-gauche de la carte (Maximize2/Minimize2, placé à gauche pour ne pas recouvrir les contrôles Géo/Sat/Relief/Cadastre en haut-droite) ;
- la carte extraite dans une fonction `mapNode(height)` réutilisée en mode normal et en plein écran (une seule instance montée à la fois, un placeholder « Carte affichée en plein écran… » remplace l'emplacement inline) ;
- un overlay via `createPortal` vers `document.body`, `fixed inset-0 z-[2000]`, fond crème, animé en fondu par framer-motion ;
- un en-tête reprenant numéro, catégorie, titre, compteur et bouton de fermeture ;
- fermeture par Échap et blocage du scroll du body pendant l'ouverture.

## Modification prévue

Un seul fichier : `src/components/propriete/identify/blocks/RevealMapBlock.tsx`

1. Extraire la barre de filtres (Tous / Plantes / Animaux / Champignons / Bio-indicatrices + compteur d'observations) dans une variable `filtersBar`, et le bloc `<RichMap>` + marqueurs dans une fonction `mapNode(height)` afin de les rendre à l'identique dans les deux modes.
2. Ajouter l'état `fullscreen` et le bouton rond en haut-gauche de la carte, strictement même style et mêmes icônes que les Prélèvements.
3. Ajouter l'effet Échap + verrouillage du scroll du body.
4. Ajouter l'overlay `createPortal` : en-tête (pastille numéro, sur-titre « Carte des révélations », titre « Où les marcheurs ont-ils observé le vivant ? », compteur « n obs. », bouton X), barre de filtres sous l'en-tête pour rester pilotable en plein écran, puis la carte occupant toute la hauteur restante.
5. En mode normal, remplacer la carte par le même placeholder pointillé pour éviter deux instances Leaflet simultanées.

Aucune logique de données, de filtrage ou de requête n'est touchée : uniquement la présentation.

## Détails techniques

- Réutilisation des tokens `--ds-cream`, `--ds-forest`, `--ds-forest-deep`, `--ds-line` déjà employés, aucune couleur en dur ajoutée.
- Le layout plein écran est vertical (filtres en bandeau, carte plein cadre) plutôt que carte + panneau latéral, car ce bloc n'a pas de liste latérale à afficher.
- Les popups Leaflet fonctionnent tels quels dans le portail puisque la carte est remontée dans le nouveau conteneur.
