# Effacer vraiment une mesure de pH (cas « Terrasse »)

## Diagnostic vérifié

Lecture de la fiche sol de Maison sous Blossac et de son historique :

- État actuel : point **A · Terrasse → pH 4** (test vide), point **C · Terrain potager → pH 7,5**. La valeur globale de la fiche est **5,8**.
- L'historique montre que l'effacement **a bien fonctionné à 11 h 16** (A sans valeur), puis que **la valeur 4 est revenue toute seule à 11 h 20**, au moment de l'ajout d'un autre prélèvement.
- Cause : l'écran peut réappliquer une version du registre **plus ancienne** que la dernière enregistrée lorsque deux lectures se croisent. La saisie effacée est alors restaurée à l'écran, puis réécrite en base par l'action suivante.
- Deuxième manque confirmé : le bouton « effacer » ne retire que la valeur, pas le test associé, et la **valeur globale de pH n'est jamais remise à vide** quand plus aucun point n'est mesuré — la fiche continue donc d'afficher 5,8 même sans mesure.

## Correction

1. **Ne jamais revenir en arrière.** L'écran n'accepte une version venue du serveur que si elle est **postérieure** à la dernière version connue ou enregistrée. Une lecture en retard est ignorée au lieu d'écraser la saisie.
2. **Ne pas perdre une saisie faite pendant un enregistrement.** Si l'utilisateur modifie quelque chose pendant qu'une sauvegarde est en cours, cette modification reste marquée « à enregistrer » et part à la sauvegarde suivante.
3. **Effacement complet d'un point.** Le bouton devient « Effacer la mesure » et retire d'un coup la valeur **et** le test du point concerné ; il reste proposé dès que l'un des deux est renseigné.
4. **Valeur d'ensemble cohérente.** Quand plus aucun prélèvement n'a de valeur, le pH global de la fiche repasse à « non mesuré » au lieu de conserver l'ancienne moyenne.
5. **Cas Terrasse.** Après la correction, effacer la mesure de A supprime définitivement le 4 ; la fiche affichera alors la seule mesure restante (7,5).

## Vérifications

- Ouvrir Maison sous Blossac → J'analyse → bloc pH, effacer la mesure de « Terrasse », attendre l'enregistrement, recharger la page : la valeur ne doit pas réapparaître.
- Effacer aussi « Terrain potager » : la lecture d'ensemble doit indiquer « non mesuré », sans valeur résiduelle dans la synthèse.
- Ajouter puis retirer un prélèvement juste après un effacement : aucune ancienne valeur ne doit revenir.

## Détails techniques

- `src/hooks/propriete/usePropertySoil.ts` : comparer `updated_at` (horodatage) avant d'appliquer `query.data`, mémoriser l'instant de la dernière écriture réussie, et n'abaisser `dirtyRef` que si aucun changement n'est survenu depuis le début du `persist` (compteur de révision local).
- `src/components/propriete/analyze/PhSampleRow.tsx` : action unique `onPatch({ ph_value: null, ph_test: null })`, affichée si `ph_value != null || ph_test != null`. Le garde-fou serveur reste levé via `isClearingPatch`, déjà compatible avec un patch multi-champs.
- `src/components/propriete/analyze/blocks/PhBlock.tsx` : l'effet de dérivation propage aussi `null` quand `agg.average == null` (signature `onChange: (v: number | null) => void`, ajustée côté `TabAnalyze`).
- Aucune migration : le garde-fou et l'historique en base restent inchangés.
