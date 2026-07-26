## Objectif

Donner à l'étape **« J'analyse le sol »** le même rituel éditorial que « J'observe » : une **synthèse verrouillée** (carnet scellé) avec *Observations verrouillées · prête pour le rapport client · Imprimer · Rouvrir en édition*, et une modale d'impression enrichie proposant **J'analyse (seul)** ou **Portrait + J'observe + J'analyse**.

## 1. Nouveau « carnet scellé » de l'étape 2

Nouveau composant `AnalyzeSummary.tsx` (miroir de `ObserveSummary`, même langage graphique : crème, filets or, sceau circulaire, serif italique) :

- **Cachet daté** « Validé le JJ/MM/AAAA · Étape 2 » en haut à droite (masqué à l'impression, remplacé par un cartouche centré).
- **Signature du sol** : glyphe SVG unique généré depuis les données (dominantes structure / texture / pH / vitalité) — équivalent de `SiteSignature` pour le sol, en 4 arcs concentriques + points par prélèvement.
- **Lecture dominante** en grand : une phrase agronomique de synthèse (ex. « Sol limoneux à structure grumeleuse, légèrement acide, vitalité soutenue »), composée depuis les agrégats déjà calculés dans `structureTests.ts`, `textureTests.ts`, `phTests.ts`, `lifeTests.ts`.
- **6 sections numérotées** (01 état du terrain → 06 vie du sol) avec puces de choix, barre de répartition et un crayon au survol qui rouvre l'édition et scrolle sur le bloc concerné (même mécanique `onEditBlock` que l'étape 1).
- **Tableau des prélèvements A → E** : une ligne par échantillon (lieu, test/résultat structure, test/résultat texture, pH, vers + indices de vie) — c'est la pièce maîtresse « pro » pour le rapport client. Signalement ambre des prélèvements incomplets ou contrastés.
- **Note de synthèse** libre reprise telle quelle.
- **Pied de page actions** : `Observations verrouillées · prête pour le rapport client` + boutons **Imprimer** / **Rouvrir en édition** / **Étape suivante · J'identifie**.

`TabAnalyze` adopte le pattern de `TabObserve` : état `mode: 'summary' | 'edit'`, bascule automatique en `summary` dès que `completedAt` existe, bandeau « Mode édition — les modifications seront réenregistrées » avec retour à la synthèse. Aucune modification du modèle de données (`usePropertySoil` suffit : `completed_at` existe déjà).

## 2. Modale d'impression — 3 modèles

`PrintChoiceDialog` devient générique et pilotée par une prop `options` (l'appelant déclare les modèles disponibles) :

| Modèle | Contenu | Disponible si |
|---|---|---|
| **Carnet J'observe** | Sceau + 8 blocs + Âme du Lieu (≈2 p.) | étape 1 validée |
| **Carnet J'analyse** *(nouveau)* | Sceau étape 2 + signature du sol + 6 sections + tableau des prélèvements (≈2–3 p.) | étape 2 renseignée |
| **Cahier complet** | Portrait photo → Propriété → J'observe → J'analyse (≈n p.) | ≥1 photo Portrait |

- Nouvelle miniature aquarelle `MiniAnalyze` (bêchée en coupe + 3 pastilles de prélèvement + courbe pH), dans le même style SVG que les deux existantes.
- Le libellé du « Cahier complet » et son estimation de pages s'adaptent aux étapes réellement validées (« Portrait + J'observe + J'analyse »).
- La modale est appelée depuis les deux onglets, avec présélection du modèle correspondant à l'onglet courant.

## 3. Modèles d'édition (mise en page A4)

- **`AnalyzePrintLayout`** : `AnalyzeSummary` en mode `printOnly` découpé en deux sections A4 (`printSection: 'first' | 'second'`) — page 1 : cartouche + signature du sol + terrain / prélèvements / structure ; page 2 : texture / pH / vie du sol + tableau des prélèvements + note de synthèse.
- **`CombinedPrintLayout`** gagne un `analyzeSlot` inséré après le slot J'observe, précédé d'une **page-intercalaire éditoriale** (`combined-print-divider`, déjà stylée) titrée *« J'analyse le sol »* avec sa citation — et un intercalaire équivalent pour J'observe, pour que le cahier complet se lise comme un vrai ouvrage relié (Couverture → Sommaire visuel → Propriété → planches photo → intercalaire I → J'observe → intercalaire II → J'analyse → respiration → colophon). La pagination totale de `PortraitPrintLayout` est ajustée via les props `insertedPageCount` existantes.

## Détails techniques

- Fichiers créés : `src/components/propriete/analyze/AnalyzeSummary.tsx`, `SoilSignature.tsx`, `soilReading.ts` (phrase de synthèse + agrégats partagés), `src/components/propriete/print/AnalyzePrintLayout.tsx`.
- Fichiers modifiés : `TabAnalyze.tsx` (mode summary/edit + impression + portail), `PrintChoiceDialog.tsx` (options dynamiques + `MiniAnalyze`), `CombinedPrintLayout.tsx` (slot + intercalaires), `src/index.css` (`body.analyze-printing`, `.analyze-print-root`, `.combined-print-analyze` — calqués sur les règles `observe-printing` existantes lignes 618-633 / 1063-1088).
- Réutilisation de `usePrintCombined` (portail body + attente des images + `window.print`) sans changement.
- Aucune migration, aucune modification des RPC ; les agrégats de synthèse réutilisent la logique déjà présente dans les `*ResultsSummary`.
