# Photos de sondes : affichage immédiat

## Le constat

Les photos stockées sont les originaux d'appareil photo : 4032 × 3024 px, entre 2,4 et 5,7 Mo pièce (vérifié en base sur les 12 photos existantes). La liste de gauche les affiche dans une pastille de 36 px et la bulle de carte dans un bandeau de 112 px de haut : le navigateur télécharge donc jusqu'à 5 Mo pour dessiner une vignette. Quatre sondes visibles = plus de 15 Mo à charger avant que la carte ne soit lisible.

## Ce qui change pour l'utilisateur

- Les pastilles de la liste et le médaillon de la bulle apparaissent quasi instantanément (quelques dizaines de ko au lieu de plusieurs Mo).
- La bande photo de la fiche capteur se remplit d'un coup, sans images qui « tombent » une par une.
- En plein écran, la vignette s'affiche immédiatement puis la photo pleine définition la remplace en fondu : plus jamais de cadre vide.
- Rien n'est perdu : l'original reste stocké tel quel, avec ses EXIF, sa géolocalisation et sa qualité d'impression.

## Comment

1. **Vignettes générées à l'envoi.** À chaque photo ajoutée, une miniature WebP (côté long 480 px, qualité ~0,72, ≈ 40 ko) est fabriquée dans le navigateur et déposée à côté de l'original, sous le même préfixe, suffixée `-thumb.webp`. L'original est envoyé inchangé.
2. **Nouvelle colonne `thumb_path`** sur `iot_capteur_photos` (nullable). Les lectures signent la vignette quand elle existe, l'original sinon — aucune régression pour les photos non encore traitées.
3. **Rattrapage des 12 photos existantes** : une fonction edge `iot-photos-thumbnails` parcourt les lignes sans `thumb_path`, réduit l'image et renseigne la colonne. Lancée une fois depuis l'admin IoT (bouton discret « Générer les vignettes »), idempotente, relançable.
4. **Moins d'allers-retours de signature** : les URL signées passent à 4 h et sont mises en cache par React Query (`staleTime` aligné), au lieu d'être resignées à chaque montage de la carte.
5. **Chargement paresseux et dimensions explicites** : `loading="lazy"`, `decoding="async"`, `width`/`height` sur les vignettes pour éviter le reflow ; la couverture de la sonde sélectionnée est préchargée en priorité.

## Détails techniques

- `src/utils/imageOptimizer.ts` (déjà présent) sert de base à un utilitaire `makeThumbnail(file, 480)` via canvas ; fallback silencieux sur l'original si le canvas échoue (HEIC exotique).
- `src/hooks/iot/useCapteurPhotos.ts` : `signAll` signe `thumb_path ?? storage_path` et expose `thumbUrl` + `url` ; `useCapteurCovers` ne demande que les vignettes ; l'upload dépose la miniature après l'original et écrit `thumb_path` dans le même insert (rollback storage inchangé).
- `src/components/iot/SensorsMapTab.tsx`, `src/components/propriete/iot/SensorPhotoStrip.tsx`, `IotLayer.tsx` : consomment `thumbUrl`.
- `src/components/propriete/iot/SensorPhotoViewer.tsx` : affiche `thumbUrl` en fond flouté puis `url` en `onLoad`.
- Migration : `alter table public.iot_capteur_photos add column thumb_path text;` (aucune modification de RLS ni de grants nécessaire, colonne sur table existante).
- Suppression d'une photo : retirer aussi `thumb_path` du bucket.

## Hors périmètre

Transformation d'image côté Supabase (option payante) et re-compression des originaux : on garde les fichiers sources intacts.
