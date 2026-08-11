# La fiche capteur s'ouvre — et le capteur se montre en situation

Deux chantiers : réparer l'ouverture de la fiche depuis la vignette du plan, puis donner
à chaque capteur son petit reportage photo (plusieurs vues, une photo de couverture).

## 1. Pourquoi « Ouvrir la fiche capteur » ne fait rien

Vérifié dans le code : l'Atelier du jardin s'affiche en plein écran au niveau `z-[3000]`,
alors que le panneau latéral (composant Sheet, utilisé par la fiche capteur) sort au
niveau `z-[1100]`. Le clic fonctionne, l'état s'ouvre bien, mais la fiche est peinte
**derrière** l'Atelier : rien n'apparaît à l'écran.

Correction : la fiche capteur ouverte depuis le plan s'affiche au-dessus de l'Atelier
(niveau dédié, au-dessus de `3000`), sans toucher son apparence ailleurs. La même
vérification est faite sur la fiche consultation de la Clinique, ouverte depuis le même
plan, pour éviter de laisser le défaut jumeau en place.

## 2. Le capteur en situation — un petit reportage par sonde

### Ce qu'on voit

- **Dans la fiche capteur** : une bande « En situation » sous l'en-tête. Vignettes
  carrées en file, bouton « Ajouter des photos » (sélection multiple, appareil photo sur
  mobile). Clic sur une vignette → visionneuse plein écran avec flèches, légende et date.
- **Photo de couverture** : la première photo sert de couverture ; on peut la changer
  (étoile sur la vignette). Réordonnancement par glisser-déposer, légende éditable,
  suppression avec confirmation.
- **Sur le plan** : la vignette de couverture apparaît en médaillon rond en tête de la
  bulle du capteur — la sonde n'est plus une pastille abstraite, on reconnaît le piquet
  dans le potager. Un liseré fin reprend la couleur de santé.
- **Sur la carte des capteurs** (section « Capteurs et sondes ») : miniature de couverture
  sur la carte du capteur, avec le compteur « 3 photos ».
- Si aucune photo : invitation discrète « Montrer cette sonde en situation ».

### Ce qui est enregistré

Pour chaque photo : le capteur concerné, le fichier, une légende libre, la date de prise
de vue (lue dans le fichier quand elle existe), les coordonnées GPS de la photo si
présentes, l'ordre d'affichage et l'auteur du dépôt. Accès aligné sur la propriété :
visible par les personnes rattachées, ajout et suppression réservés aux gestionnaires.

## Détails techniques

- **z-index** : classe de niveau explicite sur le `SheetContent` de `SensorDrawer`
  (et `ConsultationDrawer`) quand ouvert depuis l'Atelier — prop `overlayLevel`, valeur
  `z-[3200]` sur l'overlay et le contenu.
- **Base** : table `public.iot_capteur_photos` (`capteur_id` → `iot_capteurs`,
  `propriete_id`, `storage_path`, `url`, `caption`, `taken_at`, `lat`, `lng`,
  `display_order`, `created_by`, timestamps). GRANT `authenticated` + `service_role`,
  RLS lecture via `can_access_propriete(propriete_id)`, écriture gestionnaires ;
  RPC `reorder_iot_capteur_photos` en SECURITY DEFINER sur le modèle de
  `reorder_propriete_test_medias`.
- **Stockage** : bucket privé existant réutilisé si possible (`propriete-tests` sert déjà
  aux preuves de terrain) sous le préfixe `iot/<capteur_id>/` ; sinon création d'un
  bucket dédié `propriete-iot`.
- **Upload** : passage par `uploadWithMetadata` / `extractMediaMetadata` (EXIF date +
  GPS, conversion HEIC, rollback storage si l'insert échoue) comme les autres flux photo.
- **Front** : hook `useCapteurPhotos(capteurId)` dans `src/hooks/iot/useIot.ts`
  (liste, upload multiple avec progression, légende, couverture, réordonnancement,
  suppression) ; composants `src/components/propriete/iot/SensorPhotoStrip.tsx` et
  `SensorPhotoViewer.tsx` (calqué sur `TestMediaViewer`) ; médaillon de couverture dans
  `IotLayer.tsx` (popup) et dans les cartes de `SensorsSection.tsx`.
