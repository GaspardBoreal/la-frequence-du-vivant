## Alignement vertical titre événement ↔ QR code

**Problème** : quand un événement est sélectionné, le titre (ex. "POITIERS Maison Sous Blossac") s'affiche trop haut sur le fond d'écran, désaligné avec le QR code positionné en bas à droite.

**Correction** dans `src/components/wallpaper-studio/renderer/wallpaperCanvas.ts` :

- Dans `drawSignature`, quand un événement est sélectionné (titre seul, mode compact), calculer la baseline du texte pour qu'elle s'aligne sur le **bord bas du QR code** (même `y` que `qrRect.y + qrRect.height`), au lieu de la marge basse générique actuelle.
- Conserver le couloir de sécurité horizontal à gauche du QR (padding déjà en place).
- Garder le comportement actuel (positionnement bas standard) quand aucun événement n'est sélectionné.

**Détails techniques** :
- `drawQrCode` doit exposer/retourner le `Rect` du QR (déjà le cas ou à ajouter) pour que `drawSignature` puisse s'y référer.
- Ordre d'appel : rendre le QR d'abord, puis passer son rect à `drawSignature` pour l'alignement.

Aucun autre changement visuel.
