## Objectif

Quand l'étape 1 « J'observe » est terminée (`completed_at != null`), remplacer la grille éditable des 8 cartes par **une synthèse "Carnet scellé"** — la maquette v2 validée au premier tour (Portrait de la Propriété, sceau rond daté, 8 blocs en grille 2 colonnes, bloc 8 pleine largeur pour l'Âme du Lieu) — en y ajoutant sous chaque titre de bloc **une ligne de pictos représentant les choix cochés** (les non cochés restent en fantôme pour lisibilité).

## Ce qu'on construit

### 1. Nouveau composant `ObserveSummary.tsx`
`src/components/propriete/observe/ObserveSummary.tsx`

Rendu conforme à la maquette v2 :
- **Header** : chip "Étape 1 — Terminée" + titre serif italique "Portrait de la Propriété" + sous-titre + trait de séparation.
- **Sceau daté** en haut à droite : cercle 128px, bordure or, texte circulaire "Diagnostic Propriété • Fréquence du Vivant", centre "Validé · 25/07/2026" (date issue de `completed_at`), rotation 12°.
- **Grille 2 colonnes** des 7 premiers blocs :
  - Numéro `01. Relief`, titre uppercase forest, phrase narrative générée à partir des choix (voir ci-dessous).
  - **Sous le titre : rangée de pictos** (icônes des `choices` du bloc dans `observeConfig`). Cochés = plein forest sur pastille crème bordure or ; non cochés = même picto opacité 20 %, pas de bordure. 24×24, gap 8px.
  - Blocs contenant des choix « à risque » (pollution, tassement, sécheresse, sel, inondation, vent salin, piétinement) reçoivent le fond amber-50/50 + tag "ATTENTION" comme dans la maquette.
  - Bouton crayon apparaît au hover (`opacity-0 group-hover:opacity-100`) → `onEditBlock(blockId)`.
- **Bloc 8 pleine largeur "L'Âme du Lieu"** : titre serif italique, jauge intensité 10 segments (forest pleins jusqu'à `intensity`, ds-line ensuite) + label "7/10", puis grille 5 colonnes (Vues / Sons / Odeurs / Textures / Ambiance) avec label uppercase gray + valeur texte du champ sensoriel.
- **Footer** : coche + "Observation verrouillée pour le rapport client" à gauche, bouton "Imprimer la synthèse" à droite. Ajout de deux boutons additionnels : "Rouvrir en édition complète" (repasse en mode grille éditable) et "Étape suivante · J'analyse le sol".

### 2. Génération des phrases narratives par bloc
Utilitaire `src/components/propriete/observe/summarizeAnswers.ts` :
- Fonction `describeBlock(blockId, selectedValues[], allChoices[]) → string` : produit une phrase courte à partir des labels des choix cochés (ex : `['secheresse', 'ombre_permanente']` sur bloc 7 → « Le terrain subit une **ombre permanente** et une **sécheresse marquée**. »).
- Templates par bloc (relief / eau / sol_nu / vegetation / faune / usages_passes / particularites) définis dans le fichier, avec fallback générique « Choix retenus : X, Y. » si aucun template ne matche.
- Aucun appel LLM, purement local.

### 3. Branchement dans `TabObserve.tsx`
Dans `src/components/propriete/tabs/TabObserve.tsx` :
- Ajouter un état local `mode: 'summary' | 'edit'` initialisé à `'summary'` si `completedAt` existe, sinon `'edit'`.
- Si `mode === 'summary'` et `completedAt` : rendre `<ObserveSummary … onEditBlock={id => { setMode('edit'); scrollToBlock(id); }} onReopenAll={() => setMode('edit')} />` à la place de la grille actuelle.
- Sinon : conserver la grille éditable actuelle inchangée.
- Après édition, le bouton "Marquer l'étape comme terminée" repasse automatiquement en `'summary'` via effet sur `completedAt`.

### 4. Ancrage/scroll vers un bloc édité
Ajouter `id={`observe-block-${b.id}`}` sur chaque `<ObservationCard>` de la grille éditable pour que `scrollToBlock` fonctionne quand on clique le crayon d'un bloc dans la synthèse.

## Ce qu'on ne touche PAS

- Le hook `usePropertyObservation` (état, autosave, RPC) : inchangé.
- `observeConfig.ts` : inchangé, la synthèse lit `OBSERVE_BLOCKS` pour retrouver labels + icônes des choix.
- Les 3 autres étapes (J'analyse, J'identifie) : inchangées.
- La palette CSS (`--ds-cream`, `--ds-forest`, `--ds-forest-deep`, `--ds-gold`, `--ds-line`) : inchangée.

## Détails techniques

- Le sceau utilise un `<svg>` avec `<textPath>` sur un cercle pour le texte curviligne (déjà présent dans le prototype v2).
- Les icônes cochés/non-cochés viennent de `block.choices[i].icon` (déjà des composants React dans `observeConfig`).
- Détection "à risque" : liste blanche des `value` sensibles → `RISK_VALUES = ['pollution', 'tassement', 'secheresse', 'sel', 'inondation', 'vent_salin', 'pietinement', 'erosion']`.
- Le mode impression est déjà géré ailleurs → le bouton "Imprimer" appelle simplement `window.print()`.

## Fichiers créés
- `src/components/propriete/observe/ObserveSummary.tsx`
- `src/components/propriete/observe/summarizeAnswers.ts`

## Fichiers modifiés
- `src/components/propriete/tabs/TabObserve.tsx` (mode summary/edit + rendu conditionnel + id d'ancre sur les cartes)

Prêt à passer en build si tu valides.
