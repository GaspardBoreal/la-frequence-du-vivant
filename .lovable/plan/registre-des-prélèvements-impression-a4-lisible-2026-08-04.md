# Registre des prélèvements — impression A4 lisible

## Ce qu'on voit sur la copie

Le tableau déborde à droite (la colonne « État » est coupée en plein milieu), et dans la première colonne les mentions « GÉOLOCALISÉ » et les coordonnées se superposent au texte du lieu. Les colonnes ne sont donc plus alignées avec leurs en-têtes.

## Diagnostic (confirmé dans le code)

Deux causes cumulées, toutes deux dans les règles d'impression de `src/index.css` (bloc `.samples-register`, lignes 750-801) et dans le balisage de `SamplesRegisterTable.tsx` :

1. **Contenus non coupables dans des colonnes à largeur fixe.** Le tableau est en `table-layout: fixed` avec des largeurs en pourcentage, mais plusieurs éléments sont forcés en `white-space: nowrap` (`.print-nowrap`, `.tabular-nums`, la cellule « État » en `whitespace-nowrap`, les pastilles de statut). En largeur fixe, un contenu non coupable ne rétrécit pas la colonne : il déborde visuellement par-dessus la cellule voisine. C'est exactement la superposition « GÉOLOCALISÉ / Sous les marronniers ».
2. **Aucune borne de débordement.** Le conteneur passe en `overflow: visible` à l'impression et aucune cellule n'a de `overflow: hidden`, donc le débordement s'étale au lieu d'être contenu ; la dernière colonne finit hors de la zone imprimable.

## Correctifs proposés

1. **Supprimer les `nowrap` à l'impression** : neutraliser `.print-nowrap`, `.tabular-nums` et la cellule « État » dans le bloc `@media print`, pour que tout contenu puisse revenir à la ligne dans sa colonne.
2. **Contenir chaque cellule** : `overflow: hidden` + `overflow-wrap: anywhere` sur `.samples-register td/th`, afin qu'aucun contenu ne puisse plus chevaucher la colonne suivante.
3. **Réorganiser la colonne 1 pour l'impression** : pastille lettre + lieu sur une ligne, puis « Géolocalisé » et les coordonnées en dessous en une seule ligne compacte (icône + coordonnées abrégées), au lieu de trois blocs qui se marchent dessus.
4. **Rééquilibrer la grille de colonnes** : ajuster le `<colgroup>` et les largeurs print pour donner un peu plus à « Prélèvement » et « Lieu » (les deux colonnes textuelles) et resserrer « Structure » / « Texture » / « État ». État passe en libellé court sans pastille arrondie large.
5. **Borner la largeur du tableau** : forcer la table à la largeur de contenu A4 réelle (`width: 100%; max-width: 100%`) et neutraliser tout `min-width` résiduel hérité de l'écran, y compris dans le cahier complet.
6. **Vérification** : rendu de contrôle en émulation média `print` (Playwright, format A4) sur « Analyse seul » et « Cahier complet », pour confirmer visuellement qu'aucune colonne ne dépasse et qu'aucun texte ne se superpose avant de te rendre la main.

## Portée technique

Fichiers touchés : `src/index.css` (bloc print `.samples-register`) et `src/components/propriete/analyze/SamplesRegisterTable.tsx` (colgroup + structure de la colonne 1 et de la colonne État). Aucun changement de données ni de calcul : uniquement la présentation.
