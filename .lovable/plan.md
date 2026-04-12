

## Analyse exhaustive des métadonnées EXIF de la photo SophieD_01.jpeg

### Contexte

L'outil de parsing de documents ne permet pas d'extraire les métadonnées EXIF/IPTC/XMP d'une image JPEG. Pour une analyse exhaustive, il faut utiliser des outils spécialisés.

### Ce qui sera fait

1. Copier la photo vers `/tmp/SophieD_01.jpeg`
2. Extraire **toutes** les métadonnées avec Python (`Pillow` + `exifread`) et/ou `nix run nixpkgs#exiftool`
3. Produire un rapport structuré couvrant :
   - **EXIF** : appareil photo, modèle, objectif, ouverture, vitesse, ISO, date/heure de prise de vue, orientation, flash, balance des blancs, mode de mesure, programme d'exposition
   - **GPS** : latitude, longitude, altitude, précision (si présent)
   - **IPTC** : titre, description, auteur, copyright, mots-clés
   - **XMP** : logiciel de retouche, historique de modifications, profil colorimétrique
   - **Technique** : dimensions en pixels, résolution DPI, espace colorimétrique, profondeur de bits, taille du fichier, format de compression, sous-échantillonnage chromatique
   - **Thumbnail** : présence et dimensions du thumbnail embarqué
   - **Maker Notes** : données propriétaires du constructeur (si disponibles)

4. Présenter le résultat complet de manière structurée directement dans le chat

### Aucune modification du code du projet

Cette tâche est purement analytique -- aucun fichier du projet ne sera modifié.

