## Objectif

Dans l'étape « J'analyse le sol » → test pH (bandelette / kit colorimétrique), remplacer la troisième vidéo proposée.

## Changement

Fichier : `src/components/propriete/analyze/phTests.ts`, entrée `videos[2]` du test `bandelette` (lignes 178-182).

Avant :
- Label : « Tout savoir sur le pH et les sols calcaires »
- URL : `https://youtu.be/AHiwHK_QxNw`

Après :
- Label : « Tester l'acidité de votre sol avec des produits du quotidien »
- URL : `https://youtu.be/PB9HNnOItU0`
- Angle reformulé : le regard maison — vinaigre et bicarbonate pour un test rapide sans matériel.

Aucun autre fichier n'est touché ; `TestVideoShelf` consomme déjà la liste telle quelle.