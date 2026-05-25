# Upload direct dans « Pratique éditoriale »

## Contexte

Aujourd'hui dans Apprendre → L'Œil → Nouvelle pratique éditoriale (`MainCuration.tsx`), le champ Médias ne propose qu'un seul chemin : « Parcourir toutes les marches & le mur Convivialité » (`MediaPickerSheet`). Pas d'import direct depuis appareil, ce qui bloque les rédacteurs qui veulent illustrer un geste avec une photo qu'ils viennent juste de prendre.

## Analyse UX/UI

Deux entrées coexistent désormais, avec une hiérarchie claire :

1. **Action principale (la plus rapide pour l'usage mobile)** — « Importer depuis l'appareil » : bouton plein largeur avec icône caméra/upload. Sur mobile, ouvre directement l'app photo ou la galerie (`capture="environment"`). Sur desktop, ouvre le sélecteur de fichiers. Multi-fichiers.
2. **Action secondaire (réutilisation)** — « Choisir dans la bibliothèque de l'événement » : remplace l'unique CTA actuel, intitulé plus explicite.

Les deux entrées s'affichent côte à côte (ou empilées en mobile <480px) au-dessus de la grille de vignettes existante, pour respecter la sobriété informationnelle déjà en place.

Pendant l'upload :
- Barre de progression compacte (réutilise les stages exposés par `useUploadConvivialitePhotos` : `optimizing` / `uploading`).
- Toast erreur explicite pour HEIC (déjà géré par le hook).
- Les nouvelles photos sont **immédiatement ajoutées à la sélection de la pratique** (préfixe `conv:<uuid>`) ET au mur Convivialité de l'exploration — un seul stockage canonique, pas de doublon de bucket.

Pourquoi réutiliser le mur Convivialité plutôt que créer un bucket dédié :
- Le `MediaPickerSheet`, `buildMediaIndex` et la résolution de vignette fonctionnent déjà avec les clés `conv:<uuid>`.
- Pas de migration, pas de nouvelle RLS, pas de duplication d'infra d'upload (ImageOptimizer, HEIC, EXIF, optimisation 1.5MB/1920px sont déjà branchés).
- Effet de bord positif : la photo devient réutilisable pour d'autres pratiques et enrichit le mur. Si l'on souhaite plus tard isoler ces uploads « éditoriaux », un flag `source='pratique'` pourra être ajouté sans casser l'existant.

Accessibilité : input file natif (compatible lecteurs d'écran + capture caméra iOS/Android), `aria-label` explicite, focus restauré après upload.

## Changements

### `src/components/community/insights/curation/MainCuration.tsx`

- Ajouter un `<input type="file" accept="image/*" multiple>` masqué, déclenché par un nouveau bouton « Importer depuis l'appareil ».
- Brancher `useUploadConvivialitePhotos(explorationId, userId)` (le user vient déjà du contexte auth utilisé ailleurs dans le fichier).
- Après upload réussi : pour chaque photo insérée, push `conv:<id>` dans `editor.mediaKeys` et invalider `['convivialite-photos', explorationId]` + `['exploration-all-media', explorationId]` pour que la vignette apparaisse instantanément dans la grille.
- Refondre le bloc Médias :
  - Header inchangé (label + compteur).
  - Sous le header : 2 boutons (Importer / Bibliothèque) au lieu de l'unique zone dashed actuelle.
  - Si `mediaKeys.length === 0`, garder un visuel d'incitation léger sous les boutons.
  - Conserver la grille 4 colonnes existante.
- Indicateur de progression compact (texte + spinner) tant que la mutation est `pending`.
- Renommer le CTA secondaire en « Choisir dans la bibliothèque » (plus clair que « Choisir des médias » / « Modifier la sélection »).

### Aucune migration SQL

Le bucket `exploration-convivialite` et la table `exploration_convivialite_photos` existent déjà avec les bonnes RLS (un user authentifié peut insérer ses propres photos dans une exploration). Rien à toucher côté DB.

### Aucun nouveau hook

`useUploadConvivialitePhotos` est suffisant. Si plus tard on veut distinguer les uploads « pratique » du mur, on ajoutera une colonne optionnelle.

## Hors scope

- Pas de drag-and-drop de fichiers (peut être ajouté en V2, peu utilisé sur mobile).
- Pas de recadrage in-app (l'optimizer s'occupe déjà du redimensionnement).
- Pas de réorganisation des vignettes dans le dialog (le DnD existe déjà sur le mur Convivialité lui-même).

## Validation

1. Sur mobile, ouvrir le dialog → « Importer » → choisir caméra → la photo apparaît dans la grille et la pratique se sauvegarde avec la photo.
2. Sur desktop, sélectionner 3 fichiers d'un coup → les 3 vignettes apparaissent.
3. Vérifier que la photo importée apparaît aussi sur le mur Convivialité de l'exploration.
4. Tester un HEIC iPhone → toast explicite si conversion impossible.
