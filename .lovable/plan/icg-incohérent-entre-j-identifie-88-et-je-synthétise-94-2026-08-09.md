# ICG incohérent entre « J'identifie » (88) et « Je synthétise » (94)

## 1. Pourquoi

Les deux écrans appellent bien le même moteur (`computeConcordanceDetail`, méthode D.S., 8 lignes / 16 points). Ils ne lui donnent pas le même sol.

- `TabSynthesize.tsx:111` passe `soilLiteFromState(soilState)` : lecture dérivée des **prélèvements** (texture dominante, structure dominante, pH moyen, signes de vie unis), vocabulaire normalisé.
- `TabIdentify.tsx:80` passe l'objet brut `soil` (`PropertySoilState`) : ce sont les **champs globaux hérités** (`structure`, `texture`, `ph`, `life_signs`) — ceux d'avant le registre des prélèvements, non normalisés.

Un sol différent en entrée donne des niveaux de lecture différents sur certaines lignes, donc des verdicts OUI/PARTIEL/NON différents, donc deux ICG différents. Rien n'est cassé dans le barème : c'est la source du sol qui diverge.

## 2. Que s'est-il passé

Quand l'Étape 2 est passée au registre de prélèvements, `soilLiteFromState` a été créé comme source de vérité unique (« les prélèvements priment, les champs globaux ne sont qu'un repli »). La Synthèse et la Palette ont été branchées dessus ; l'Étape 3 « J'identifie » est restée sur l'objet brut. Comme c'est l'Étape 3 qui persiste `icg_score` en base (`setField('icg_score', detail.icg)`), la valeur stockée est elle aussi celle de la mauvaise entrée.

## 3. Correction proposée

Une seule règle : **partout, le sol qui entre dans la concordance est `soilLiteFromState(state)`**.

- `TabIdentify.tsx` : calculer `soilLite` et le passer à `computeConcordanceDetail`, à `IdentifySummary`, au contexte IA et à la persistance `icg_score` / `concordance`. `soilAvailable` passe par `soilLiteAvailable(soilLite)` au lieu du test ad hoc sur les champs bruts.
- `IdentifySummary.tsx:465` : recevoir un `SoilLite` déjà dérivé (le composant est appelé aussi depuis les impressions) — vérifier chaque appelant et supprimer le `fallbackTextureCounts` si les vrais comptages sont disponibles.
- `chantierIcg.ts` : vérifier que ses appelants lui fournissent aussi un `SoilLite` dérivé (l'ICG du Chantier doit s'aligner sur la même base).
- Garde-fou : `computeConcordanceDetail` ne doit accepter qu'un `SoilLite` explicitement construit. On documente en tête de `plantIndicatorKb.ts` que la seule fabrique autorisée est `soilLiteFromState`, et on retire de `TabIdentify` tout accès direct à `soil.structure` / `soil.texture` / `soil.ph`.
- Reprise de l'existant : après correction, l'ICG persisté sera réécrit automatiquement au prochain affichage de l'Étape 3 (l'effet de persistance se redéclenche sur changement de `detail.icg`). Aucune migration.

Après correction, les deux écrans afficheront la même valeur — celle fondée sur les prélèvements, c'est-à-dire 94 dans le cas de Jardin Monde DEVIAT si les prélèvements sont bien la lecture de référence.

## Détails techniques

- Fichiers touchés : `src/components/propriete/tabs/TabIdentify.tsx`, `src/components/propriete/identify/IdentifySummary.tsx`, et les appelants d'impression (`IdentifyPrintLayout.tsx`, `CombinedPrintLayout.tsx`) pour la propagation du `SoilLite`.
- Aucun changement de barème, aucune nouvelle table, aucune URL publique touchée.
- Vérification : sur Jardin Monde DEVIAT, comparer l'ICG affiché en Étape 3, en Synthèse, en Palette et dans le rapport imprimé — les quatre doivent être identiques.
