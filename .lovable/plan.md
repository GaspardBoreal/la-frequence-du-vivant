## Idée directrice — « Le carnet photo de l'ouvrage »

Chaque objet de l'Atelier (Mare, Massif, Potager, Pas japonais…) reçoit son propre **carnet photo daté** : une pellicule horizontale dans son éditeur, un badge compteur sur la carte, et une visionneuse plein écran avec la loupe de terrain déjà en place. Chaque photo porte sa date de prise de vue (EXIF) **et** sa date d'upload, ce qui permet de rejouer l'évolution du jardin par saison ou par année.

### 1. Base de données (nouvelle table + bucket privé)

Table `public.propriete_objet_photos` :
- `id`, `propriete_id`, `objet_id` (FK `propriete_objets`, ON DELETE CASCADE)
- `storage_path`, `mime`, `size_bytes`, `width`, `height`
- `caption`, `order_index`
- `taken_at` (EXIF, peut être nul), **`uploaded_at` (défaut now())**, `season` calculé en lecture depuis `coalesce(taken_at, uploaded_at)`
- `lat` / `lng` (si EXIF GPS), `uploaded_by`, `created_at`
- GRANT authenticated/service_role, RLS alignée sur `can_access_propriete` (lecture) et sur les curateurs de la propriété (écriture), + RPC `SECURITY DEFINER` `reorder_propriete_objet_photos(_objet_id, _ids uuid[])` pour l'ordonnancement atomique.
- Bucket Storage privé `propriete-ouvrages`, URLs signées 1 h en lot (même schéma que `propriete-tests`).

### 2. Upload — pipeline déjà éprouvé, rien de neuf à inventer

Réutilisation de `preparePhotoForUpload` + `insertWithStorageRollback` (EXIF avant conversion HEIC, rollback Storage si l'insert échoue). Limite 25 Mo/photo, multi-fichiers avec barre de progression « 3/7 ».

### 3. Interfaces

**a. Pellicule dans l'éditeur d'objet** (`ObjectInspector`)
Un bloc « Carnet photo » sous les champs existants : rangée de vignettes carrées 56 px scrollable, une tuile « + » en pointillés (clic ou glisser-déposer de fichiers), poignées de réordonnancement par drag (dnd-kit, déjà utilisé ailleurs), croix de suppression au survol avec confirmation. Sous chaque vignette, la date courte (« 12 avr. »).

**b. Badge sur la carte** (`ObjectsLayer`)
Petite pastille 📷 n dans le coin du glyphe/polygone quand l'ouvrage a des photos — le plan devient lisible d'un coup d'œil.

**c. Visionneuse plein écran** (nouveau `OuvragePhotoViewer`)
Portal plein écran, fond forêt profonde : image centrée + **loupe de terrain existante** (`useImageZoomPan` + `ZoomBar`, molette 1×→8×, glisser, double-clic, raccourcis + − 0 Échap), flèches Précédent/Suivant (clavier ← →), bande de vignettes en bas, cartouche discret en haut à droite : nom de l'ouvrage, date de prise de vue, date d'ajout, saison, légende éditable en place.

**d. Filtre temporel**
Une barre de filtre au-dessus de la pellicule et dans la visionneuse : `Tout · Printemps · Été · Automne · Hiver` + sélecteur d'année, alimentée par `coalesce(taken_at, uploaded_at)`. En option (même composant), un mode « Chronologie » qui aligne les photos par saison pour comparer le même ouvrage d'une année sur l'autre.

**e. Registre & impression**
`OuvragesRegister` affiche la pellicule (max 4 vignettes + « +n ») par ouvrage ; `OuvragePrintSheet` intègre jusqu'à 4 photos en planche datée dans le carnet PDF de l'étape 5.

### Détails techniques

- Nouveau hook `useObjetPhotos(proprieteId)` : une requête par propriété, signature des URLs en lot, regroupement par `objet_id`, invalidation React Query partagée avec `usePropertyObjets`.
- Nouveau `src/components/propriete/palette/studio/photos/` : `ObjetPhotoStrip.tsx`, `OuvragePhotoViewer.tsx`, `PhotoSeasonFilter.tsx`.
- Aucun changement de comportement pour les ouvrages sans photo (la section reste repliée sur la tuile « + »).

### Étapes de mise en œuvre

1. Migration DB + bucket privé + RPC de réordonnancement.
2. Hook `useObjetPhotos` (lecture, upload, suppression, réordonnancement, légende).
3. `ObjetPhotoStrip` intégrée dans `ObjectInspector` (upload, DnD, suppression).
4. `OuvragePhotoViewer` avec loupe, navigation, cartouche daté.
5. Filtre saison/année + badge 📷 sur la carte.
6. Registre et planche photo dans l'impression de l'étape 5.
