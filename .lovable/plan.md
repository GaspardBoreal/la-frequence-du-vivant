## Objectif

Transformer le tableau « 07. Registre des prélèvements » en pièce maîtresse du carnet : chaque cellule affiche la valeur complète mesurée, et une ligne de pied de tableau donne la synthèse colonne par colonne. Même qualité de lecture à l'écran et à l'impression A4 (page 3).

## 1. Cellules enrichies (valeurs complètes)

Aujourd'hui chaque cellule n'affiche que le résultat court + le nom du test. Contenu cible, par colonne :

| Colonne | Contenu enrichi |
| --- | --- |
| **#** | Lettre A→E en pastille ronde encrée + puce dorée « géolocalisé » (coordonnées lat/lng en micro-texte) |
| **Lieu** | Repère saisi ; à défaut « sans repère » en italique atténué |
| **Structure** | Résultat (Compacte / Grumeleuse / Très meuble) + test employé (bêche / stabilité) + micro-barre d'état 3 crans |
| **Texture** | Résultat (Sable / Limon / Argile) + test (boudin / sédimentation) + forme du boudin observée |
| **pH** | Valeur chiffrée à 1 décimale + classe (acide / neutre / calcaire) + test (bandelette / pH-mètre) + micro-jauge colorée positionnée sur l'échelle 4→9 |
| **Vie du sol** | Nombre de vers + indices cochés listés en clair + test employé |
| *(nouveau)* **Complétude** | Pastille discrète : cellule remplie / à compléter (remplace le fond ambré plein, trop bruyant à l'impression) |

Les valeurs manquantes restent un tiret cadratin atténué (jamais de case vide muette).

## 2. Ligne « Synthèse » en pied de tableau

Nouveau `<tfoot>` sur fond forêt clair, séparé par un filet doré, avec par colonne :

- **#** : libellé « Synthèse » + nombre de prélèvements (n dont x géolocalisés)
- **Lieu** : nombre de repères nommés
- **Structure** : dominante + « x / n testés » + mention « sol contrasté » si les résultats divergent
- **Texture** : dominante + « x / n testés » + mention « texture contrastée »
- **pH** : moyenne à 1 décimale + min–max + classe dominante
- **Vie du sol** : moyenne de vers / bêchée (1 décimale) + indice de vie /100 arrondi à 1 décimale + classe
- **Complétude** : « n / n complets » ou la liste des prélèvements à compléter

Toutes ces valeurs viennent des agrégats déjà calculés dans `buildSoilReading` (`structure`, `texture`, `ph`, `life`, `placedSamples`, `incomplete`) — aucune nouvelle logique métier, aucun changement de base de données. Seuls min/max pH et le comptage de repères nommés sont dérivés localement à partir des mêmes échantillons.

## 3. Présentation « wahouhh », écran

- En-tête de tableau en petites capitales espacées sur fond forêt très clair, filet doré en dessous.
- Lignes alternées crème / crème plus clair, ligne survolée légèrement dorée (écran uniquement).
- Colonne « # » collante à gauche en défilement horizontal sur mobile, tableau scrollable avec ombre de bord.
- Valeur principale en semi-gras, qualificatifs et tests en micro-capitales atténuées : hiérarchie à deux niveaux dans chaque cellule.
- Micro-visualisations vectorielles (barre structure, jauge pH) dessinées en SVG inline, sans dépendance nouvelle, couleurs issues des tokens `--ds-*` existants.

## 4. Présentation à l'impression

- Tableau en pleine largeur de la page 3 A4 déjà créée, corps 9 pt, interlignage serré, en-tête répété si le tableau déborde (`thead` en `table-header-group`).
- Pied de synthèse en `table-footer-group` pour rester attaché en bas du tableau.
- Aplats et jauges forcés en couleurs exactes (`print-color-adjust: exact`), suppression des ombres et des effets de survol.
- Bordures fines dorées/grises pour rester lisible en impression laser noir et blanc (contraste porté aussi par le gras, pas seulement la couleur).

## Détails techniques

- `src/components/propriete/analyze/AnalyzeSummary.tsx` : refonte du bloc `samplesTable` (cellules + `tfoot`), extraction des micro-jauges en petits composants locaux.
- Éventuel nouveau fichier `src/components/propriete/analyze/SamplesRegisterTable.tsx` si le bloc dépasse ~150 lignes, pour garder `AnalyzeSummary` lisible ; mêmes props (`reading`, `printOnly`).
- `src/index.css` : règles d'impression du registre dans le bloc `analyze-print-mode` déjà en place (répétition d'en-tête, `table-footer-group`, tailles 9 pt) + réutilisation dans le cahier complet (`combined-print-analyze`).
- Aucune modification des hooks, RPC ou schéma.
