# Export Excel + CSV de la base flore bio-indicatrice

Objectif : produire un fichier à envoyer à Vincent pour comparer nos coefficients avec ceux de Julve.

## Source

La base `plantIndicatorKb` (méthode D.S., Flore Forestière Française) contient ~40 espèces avec 4 coefficients chacune : Eau (hydrique), Texture (granulométrie), Nutrition (richesse), pH (acidité), sur une échelle -3 à +3.

## Contenu du fichier

Un onglet « Base flore » avec une ligne par espèce et une colonne par coefficient :

| Nom vernaculaire | Nom scientifique | Famille | Eau | Texture | Nutrition | pH | Julve Eau | Julve Texture | Julve Nutrition | Julve pH | Écart / Remarque |

- Colonnes 1 à 7 : nos données, remplies.
- Colonnes « Julve » : vides, en fond jaune, à compléter par Vincent.
- Colonne « Écart / Remarque » : libre.

Un second onglet « Légende » explique l'échelle -3 / +3 pour chacun des 4 axes et rappelle la source méthodologique.

## Mise en forme

- Police Arial, en-têtes en gras sur fond sombre, ligne d'en-tête figée, filtres automatiques.
- Coefficients centrés, largeurs de colonnes ajustées, zéros affichés « 0 » (pas de tiret ici car -3..+3 est une échelle, pas une valeur monétaire).
- Colonnes à compléter surlignées en jaune.

## Livrables

- `base-flore-bioindicatrice.xlsx` (2 onglets)
- `base-flore-bioindicatrice.csv` (onglet principal seul, séparateur `;` pour Excel FR, encodage UTF-8 BOM)

Les deux fichiers seront déposés dans vos documents, prêts à joindre à la réponse mail.

## Note technique

Génération par script Python (openpyxl) lisant directement `src/lib/plantIndicatorKb.ts`, sans modification du code de l'application.
