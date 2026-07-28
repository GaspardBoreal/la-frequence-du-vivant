## Objectif

Apporter à l'étape 3 « J'identifie la flore en place » le même rituel que les étapes 1 et 2 : synthèse scellée, impression de l'étape seule ou du cahier complet, et un **atlas botanique** imprimant en petites vignettes toutes les bio-indicatrices cochées, 24 par page.

## 1. Synthèse scellée « IdentifySummary »

Nouveau composant `IdentifySummary.tsx` (calque de `AnalyzeSummary`), affiché dès que l'étape est validée :

- Bandeau « Flore verrouillée · prête pour le rapport client » avec date de scellé, boutons **Imprimer** et **Rouvrir en édition**.
- 6 sections numérotées, chacune éditable par un crayon qui ramène au bloc concerné :
  1. **01. Cortège révélé** — nombre de plantes cochées, strates, sources (marcheurs / saisie manuelle).
  2. **02. Les 4 pôles** — barres d'intensité (Azote, Humidité, Compaction, pH) avec niveau 1→5 et libellé.
  3. **03. Concordance sol ↔ flore** — ICG /16 arrondi, jauge, et les 8 lignes de concordance.
  4. **04. Lecture dominante** — phrase de synthèse auto (narratePoleScores) + conclusion rédigée.
  5. **05. Notes de terrain**.
  6. **06. Sources** — mention CNPF 2018 (Flore forestière française) + iNaturalist.
- `printOnly` + `printSection` (`p1` / `p2`) pour la pagination A4, comme AnalyzeSummary.
- `TabIdentify` bascule en mode `summary` / `edit` selon `completed_at`.

## 2. Atlas des bio-indicatrices — 24 vignettes par page

Nouveau composant `FloraAtlasPrintPlates.tsx` :

- Grille A4 **4 colonnes × 6 lignes = 24 vignettes/page**, pagination automatique (`Math.ceil(n/24)`).
- Chaque vignette : photo carrée (via `SpeciesThumb` / cache espèces, repli pictogramme strate), **nom français en gras**, *nom latin en italique*, et une ligne de 4 micro-pastilles colorées (N · H · C · pH) reprenant les valeurs écologiques CNPF.
- Bandeau de tête de page : « Atlas du cortège · n espèces bio-indicatrices », filet fin, pied de page paginé.
- Traitement d'impression soigné : fond crème, filets sépia, pas d'ombres (rendu papier), `break-inside: avoid` sur chaque vignette.
- Légende des pastilles imprimée en pied de la dernière page + source CNPF 2018.

## 3. Impression : étape seule et cahier complet

- Nouveau `IdentifyPrintLayout.tsx` : page 1 (cortège + pôles), page 2 (concordance + narration + notes), puis les pages d'atlas.
- `PrintChoiceDialog` : ajout du choix `identify` et extension du cahier complet en **Portrait + J'observe + J'analyse + J'identifie**, avec une nouvelle miniature aquarelle (feuille + loupe) et libellés adaptés selon l'étape d'origine.
- `CombinedPrintLayout` : nouvelle page de garde « Étape 3 · J'identifie la flore en place » (halo végétal, citation en italique), puis les pages de synthèse et l'atlas ; le compteur `insertedPageCount` intègre les pages d'atlas.
- Branchement dans `TabIdentify` de `usePrintCombined` + `PrintPreparationOverlay` (progression, reprises, garantie « aucune photo manquante ») déjà en place dans les autres étapes — les photos d'espèces entrent dans le préchargement.

## Détails techniques

- Fichiers créés : `src/components/propriete/identify/IdentifySummary.tsx`, `src/components/propriete/identify/print/FloraAtlasPrintPlates.tsx`, `src/components/propriete/print/IdentifyPrintLayout.tsx`.
- Fichiers modifiés : `TabIdentify.tsx` (mode summary/edit, dialogue et portails d'impression), `PrintChoiceDialog.tsx` (choix `identify`), `CombinedPrintLayout.tsx` (page de garde + slot étape 3), CSS d'impression (`.identify-print-page`, `.flora-atlas-grid`).
- Source des vignettes : `state.observed_plants` croisé avec le KB `plantIndicatorKb` (nom latin, nom FR, valeurs N/H/C/pH), photos via le cache espèces existant.
- Aucun changement de schéma : `propriete_flora_diagnostics.completed_at` sert déjà de verrou.
