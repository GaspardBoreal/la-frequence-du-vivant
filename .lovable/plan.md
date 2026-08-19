# Carte BRAD TECHNOLOGY : des textes lisibles, pensés mobile d'abord

Sur la copie d'écran, la ligne d'informations de la carte partenaire se superpose au pied de fenêtre : « Partenaire IoT », « 4 sondes » et « poste de contrôle · carte » se chevauchent avec la phrase « Changement d'espace possible… ». Trois causes cumulées : trop de micro-textes sur une seule ligne, des contrastes trop faibles (opacités 45–70 %), et la dernière carte qui passe sous le fondu bas et le pied.

## Ce que je propose

### 1. Moins de textes, mais lisibles
- Une seule ligne d'information sous le nom : `4 sondes actives` (chiffre en gras, pastille verte) — la mention « poste de contrôle · carte » disparaît, elle n'apporte rien au moment du choix.
- Le badge « Partenaire IoT » devient un sur-titre discret au-dessus du nom, plutôt qu'une pastille qui se bat pour la place.
- Remontée des contrastes : textes secondaires à ~80 % au lieu de 45–70 %, taille minimale 12 px (plus de 9 px en majuscules serrées).

### 2. Mobile first
- Sous 640 px : logo 48 px, nom sur deux lignes maximum, information sur sa propre ligne — aucun élément côte à côte qui puisse se chevaucher.
- Zone tactile de la carte d'au moins 64 px de haut, étoile « espace par défaut » toujours visible sur mobile (pas de survol sur tactile) et déplacée pour ne jamais recouvrir le texte.
- La flèche d'entrée est masquée sur mobile pour libérer de la largeur.

### 3. Plus aucun chevauchement avec le pied
- Marge basse de la zone scrollable augmentée et fondu bas réduit, pour que la dernière carte ne soit plus mangée.
- Pied de fenêtre simplifié : les raccourcis clavier ne s'affichent que sur écran large ; sur mobile, une seule phrase courte.

## Détail technique
- Modifications limitées à `src/components/community/AppChoiceDialog.tsx`.
- Réécriture du bloc `partenaireEntries` (lignes ~344-398) : hiérarchie sur-titre / nom / info, classes responsive `sm:` pour tailles de logo et flèche.
- `StarToggle` : visible par défaut (opacité pleine) en dessous de `sm`, comportement survol conservé au-dessus.
- Ajustement du `pb` de la liste scrollable et de la hauteur du fondu bas ; footer avec `hidden sm:inline-flex` sur les raccourcis clavier.
- Aucune modification de données, de requête, de route ni de navigation.
