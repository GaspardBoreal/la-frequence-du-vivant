# Zoom précis et réversible des photos

## Diagnostic confirmé

- Dans l’exploration, un clic sur une photo ouvre la visionneuse `MediaLightbox`.
- Cette visionneuse sait actuellement fermer, passer à la photo précédente/suivante et balayer au doigt, mais elle ne possède aucun zoom ni déplacement dans l’image.
- L’application utilise déjà ailleurs un moteur fiable de zoom tactile et souris (`react-zoom-pan-pinch`) : il peut être réemployé ici sans inventer une interaction fragile.

## Solution proposée

### 1. Zoomer aussi loin que l’image le permet

- Molette ou geste de pincement : zoom progressif, centré exactement sous le pointeur ou entre les doigts.
- Double-clic ou double-tap : agrandissement rapide de la zone visée.
- Une fois agrandie, la photo se déplace par glissement pour examiner tous ses détails.
- Autoriser une forte amplitude de zoom, adaptée à la définition réelle de chaque photo, tout en protégeant les téléphones contre les blocages provoqués par les très grandes images.

### 2. Des commandes simples, toujours accessibles

Installer une barre compacte au bas de la visionneuse :

- **–** réduire ;
- niveau courant, par exemple **250 %** ;
- **+** agrandir ;
- **Ajuster** revenir instantanément à la vue initiale où la photo entière tient à l’écran.

Le bouton **Ajuster** devient particulièrement visible dès que la photo est agrandie ou déplacée. Les commandes restent utilisables au pouce, sans couvrir la zone centrale observée.

### 3. Éviter les conflits de gestes

- À l’échelle initiale, un balayage horizontal conserve la navigation entre les photos.
- Dès que la photo est agrandie, le même geste déplace la photo au lieu de changer accidentellement d’image.
- Changer de photo remet automatiquement la suivante dans sa vue initiale.
- Les vidéos conservent leurs commandes actuelles et n’affichent pas les outils de zoom.
- La fermeture, les flèches précédent/suivant, les informations d’auteur et la réattribution restent disponibles.

## Robustesse et validation

- Réutiliser le moteur déjà éprouvé dans les jeux biodiversité, avec sa protection contre les images trop lourdes sur mobile.
- Vérifier souris, pavé tactile, pincement à deux doigts, double-tap et glissement sur téléphone.
- Vérifier le retour **Ajuster**, le changement de photo pendant/après un zoom et l’absence de défilement parasite de la page.
- Contrôler la visionneuse sur ordinateur et mobile, ainsi que les photos en format portrait, paysage et très haute définition.
- Vérifier enfin la compilation et l’absence d’erreurs dans la visionneuse.

## Périmètre technique

Modification ciblée de la visionneuse photo de l’exploration et réemploi des utilitaires de zoom sécurisé déjà présents. Aucune donnée, photo, URL publique ou règle métier ne sera modifiée.
