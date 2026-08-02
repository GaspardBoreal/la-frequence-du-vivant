# Étape 2 · Prélèvements — jusqu'à 10 points, renommables et supprimables

## Constat (vérifié dans le code)
- `SamplesMapBlock.tsx` fige `MAX_SAMPLES = 5` et `LABELS = ['A'…'E']` ; `defaultPositions()` ne génère que 5 positions (pentagone ~30 m).
- `usePropertySoil.addSample()` crée l'id/label par `String.fromCharCode(65 + samples.length)` : après une suppression, un nouvel ajout **réutilise un id existant** (collision A/B/C, données de strates écrasées). C'est le vrai bug de fond à corriger avant d'ouvrir à 10.
- Le « nom » du prélèvement affiché dans la liste est en réalité le champ libre `location`, éditable inline mais sans validation ni feedback.
- La suppression est un `X` immédiat, sans confirmation, et masqué dès qu'il ne reste que 3 points ; elle efface aussi les 4 strates (structure, texture, pH, vie) sans prévenir.
- `SamplesBlock.tsx` (variante sans carte) duplique la limite « max 5 ».

## Ce qui sera fait

### 1. Capacité portée à 10 (source unique)
- Nouveau module `src/components/propriete/analyze/sample/sampleRoster.ts` : `MAX_SAMPLES = 10`, `MIN_SAMPLES = 3`, alphabet A→J, génération d'id **non colliding** (premier label libre, puis suffixe), et `defaultPositions()` étendu en double couronne (5 points à ~30 m + 5 à ~55 m, décalés d'un demi-pas) pour que 10 pastilles restent lisibles.
- `usePropertySoil.addSample()` consomme ce générateur ; `SamplesMapBlock` et `SamplesBlock` importent les constantes au lieu de les redéfinir.
- Sous-titres et compteurs passent de « 3 à 5 » à « 3 à 10 » (carte, plein écran, carte sans map).

### 2. Renommer / modifier — « l'étiquette du carottier »
- La ligne de liste devient éditable en deux temps : un champ **Nom du prélèvement** (`location`) au style étiquette manuscrite, avec crayon révélé au survol, focus au clic, validation `Entrée`, annulation `Échap`, autosave silencieux (le debounce d'enregistrement existant s'en charge).
- Ajout d'un **renommage de la lettre** : petit menu sur la pastille permettant de réattribuer une lettre libre (A→J) sans casser l'id interne — le repère cartographique, le sceau des 4 strates et la fiche Carotte suivent instantanément.
- Micro-feedback : pulse doré sur le marqueur correspondant pendant l'édition, et ligne « enregistré » discrète.

### 3. Supprimer — confirmation « scellé rompu »
- Le `X` ouvre un `AlertDialog` shadcn au ton du carnet : rappel du nom, des coordonnées, et **du nombre de strates renseignées qui seront perdues** (calculé via `strataState`).
- Bouton destructeur explicite « Retirer le prélèvement D » + « Annuler ». Après suppression, toast avec **Annuler (10 s)** qui restaure l'échantillon complet (les données restent en mémoire locale avant persistance).
- Suppression bloquée sous 3 points, avec explication au survol au lieu d'un bouton simplement absent.

### 4. Lisibilité à 10 points (le « wahou »)
- Pastilles cartographiques : léger décalage anti-superposition automatique et mise en avant du point survolé (les autres passent à 55 % d'opacité) — lien carte ↔ liste renforcé dans les deux sens.
- Panneau latéral scrollable avec en-tête collant « n / 10 » et une **jauge de couverture du carottage** (pastilles remplies = strates complètes), pour visualiser d'un coup d'œil l'avancement du diagnostic.
- Animation d'entrée/sortie en `AnimatePresence` pour que l'ajout et le retrait se lisent comme un geste, pas comme un saut.

## Détails techniques
- Fichiers touchés : `src/hooks/propriete/usePropertySoil.ts`, `src/components/propriete/analyze/blocks/SamplesMapBlock.tsx`, `src/components/propriete/analyze/blocks/SamplesBlock.tsx`, nouveau `sample/sampleRoster.ts`, nouveau `sample/SampleDeleteDialog.tsx`.
- Aucun changement de schéma : `samples` est déjà un JSON dans `propriete_soil_diagnostics`, la limite de 5 n'existait qu'en front.
- Les vues aval (`SamplesRegisterTable`, `AnalyzeSummary`, `SoilSamplesPlan` d'impression, fiche Carotte, liens sol↔ouvrage) itèrent sur le tableau : elles absorbent 10 points sans modification, seuls les gabarits d'impression seront vérifiés pour la pagination.
