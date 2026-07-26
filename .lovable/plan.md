## Objectif

Ajouter les trois vidéos de référence sur la fiche « Bandelette / kit colorimétrique » (5 · A), exactement comme pour le Test du boudin.

## Ce qui est déjà en place

La carte protocole du pH (`PhProtocolCard`) affiche déjà l'étagère vidéo `TestVideoShelf` avec le titre « Voir le geste » — même composant, même design que le Test du boudin. Elle reste invisible tant que le tableau `videos` du test est vide : il l'est aujourd'hui pour la bandelette.

## Changement

Un seul fichier : `src/components/propriete/analyze/phTests.ts`, entrée `bandelette` du tableau `PH_TESTS`.

Renseigner les trois vidéos avec, pour chacune, un libellé de source et un « angle » éditorial (une ligne expliquant ce que la vidéo apporte), sur le modèle du boudin :

1. **Truffaut** — `https://youtu.be/jIeS6Kfpt5g` — le regard jardinier : le geste du test pH pas à pas.
2. **PH du sol : comment le connaître ?** — `https://youtu.be/ATBwDzRjMCc` — le regard méthodique : les différentes façons de mesurer et leurs limites.
3. **Tout savoir sur le pH et les sols calcaires** — `https://youtu.be/AHiwHK_QxNw` — le regard agronomique : interpréter le résultat et corriger.

Aucun changement de composant, de CSS ni de base de données : l'étagère apparaîtra automatiquement, dépliable, avec la même mise en forme que sur le Test du boudin.
