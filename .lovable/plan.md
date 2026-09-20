# Planche instantanée pour « Visu chantier »

## Résultat attendu

À l’ouverture, la galerie donne immédiatement une vue d’ensemble nette du chantier, sans attendre le téléchargement des originaux.

- Une **planche de contact** apparaît en premier : six vignettes légères, stables et déjà organisées en **Avant · Pendant · Après**.
- La suite se révèle par petites vagues au défilement, avec une commande discrète « Voir la suite » si nécessaire.
- Chaque emplacement conserve ses dimensions pendant le chargement : aucun saut de page, seulement une empreinte douce qui se précise en image.
- Un clic ouvre l’original en plein écran ; seules l’image précédente et la suivante sont alors préparées en avance.
- Le mode **Rideau avant/après** reste disponible et ne charge ses deux grandes images qu’au moment où il est choisi.
- Les vidéos restent représentées par une affiche légère avec bouton lecture ; le fichier vidéo ne démarre aucun téléchargement avant le clic.

## Pourquoi l’affichage est lent aujourd’hui

Sur le jardin affiché, les 11 photographies sont des PNG d’environ 2,3 Mo chacune, soit **25,3 Mo** demandés par la mosaïque. Les balises sont différées, mais elles utilisent toujours les URLs des fichiers privés en pleine définition. Les vidéos demandent également leurs métadonnées dès leur apparition.

## Mise en œuvre

### 1. Deux qualités, deux usages

- Produire depuis chaque URL signée une variante d’affichage Supabase redimensionnée à environ 480 px, compressée et adaptée au navigateur.
- Conserver l’URL originale séparément pour le plein écran, le rapport et le téléchargement.
- Prévoir un repli automatique sur l’original si la transformation est indisponible, sans image cassée.

### 2. Rendu progressif réellement frugal

- Afficher immédiatement le premier lot utile, puis monter les lots suivants avec `IntersectionObserver`.
- Donner une priorité élevée à une seule vignette principale, normale aux suivantes, et différer tout ce qui est hors écran.
- Ne plus instancier de lecteur vidéo dans la grille : utiliser une affiche ou un signe vidéo statique, puis créer le lecteur au clic.
- Porter la durée de fraîcheur du carnet près de celle des URLs signées afin d’éviter de les signer à nouveau à chaque aller-retour entre les sous-menus.

### 3. Une planche de contact plus inspirante

- Remplacer l’empilement actuel par trois bandes visuelles **Avant / Pendant / Après**, chacune avec son compteur et une première sélection visible.
- Conserver les actions d’étiquetage AV/PD/AP sans surcharger les images ; elles apparaissent au focus ou au survol et restent accessibles au toucher.
- Ajouter une transition très courte de révélation, désactivée si l’utilisateur réduit les animations.
- Garder la palette Forêt Émeraude et le filet doré existants, sans ajouter de nouveau panneau décoratif.

### 4. Plein écran et comparaison à la demande

- Faire du plein écran une navigation continue photo/vidéo avec précédent/suivant et fermeture clavier.
- Charger l’original uniquement à l’ouverture ; afficher d’abord la vignette agrandie pour éviter tout écran vide pendant la montée en définition.
- En mode Rideau, charger les deux images sélectionnées seulement après activation et utiliser les variantes intermédiaires tant que l’utilisateur ne demande pas le plein écran.

## Validation

- Mesurer les requêtes au premier affichage : aucun original ni fichier vidéo ne doit être téléchargé par la planche seule.
- Vérifier le jardin actuel : première planche visible rapidement avec les 11 médias accessibles, ordre et phases inchangés.
- Vérifier le plein écran, le Rideau, la réaffectation Avant/Pendant/Après et l’ajout récent d’un média.
- Tester ordinateur et mobile, connexion ralentie, navigation clavier et préférence de réduction des animations.

## Périmètre technique

Principalement `useObjetPhotos`, `MediaCurtain` et un petit composant de vignette progressive. Aucun changement des photos existantes, des droits d’accès ou du format de stockage n’est nécessaire.
