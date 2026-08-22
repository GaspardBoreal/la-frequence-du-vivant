# Upload d'images dans Admin → Onboarding

Remplacer les deux champs texte « Image (URL) » (type de jardin, exemple) par un composant d'upload avec aperçu, la saisie d'URL restant possible en repli.

## Comportement

- Bouton « Téléverser une image » + zone d'aperçu (miniature de l'image courante, bouton « Retirer »).
- Sous l'aperçu, un champ repliable « ou coller une URL » qui écrit directement dans `image_url`.
- Refus immédiat des fichiers > 5 Mo et des formats non image (message d'erreur toast).
- Compression navigateur avant envoi : largeur/hauteur max 1600 px, qualité 0,8, sortie WebP (repli JPEG si le navigateur ne sait pas encoder le WebP). HEIC iPhone converti au passage via la cascade existante.
- Pendant le téléversement : bouton désactivé + indicateur de progression.
- À la fin, c'est **l'URL publique complète** renvoyée par le stockage qui est écrite dans `image_url` (jamais un chemin de stockage brut), pour que l'app publique affiche bien la photo.

## Chemins de stockage

Bucket `onboarding-gallery` (déjà existant et public) :

```text
types/<slug-du-type>-<timestamp>.<ext>
exemples/<slug-du-type-parent>/<timestamp>.<ext>
```

Pour un nouveau type pas encore enregistré, le slug est calculé à la volée depuis le titre saisi ; s'il n'y a pas encore de titre, on retombe sur `sans-titre`. Pour un exemple, le slug du type parent est retrouvé via `type_id`.

## Détails techniques

- Nouveau composant `src/components/onboarding/ImageUploadField.tsx` : props `value`, `onChange(url)`, `pathPrefix`, `fileBaseName`. Il encapsule input fichier caché, aperçu, upload et champ URL de repli.
- Nouvel utilitaire `src/lib/onboarding/uploadGalleryImage.ts` : compression (réutilise `convertHeicToJpeg` et un redimensionnement canvas analogue à `src/lib/iot/thumbnail.ts`), `supabase.storage.from('onboarding-gallery').upload(path, blob, { upsert: true, contentType })`, puis `getPublicUrl(path)` pour retourner l'URL absolue.
- `src/pages/AdminOnboarding.tsx` : les deux blocs `Label` + `Input` (image de couverture du type, photo de l'exemple) sont remplacés par `<ImageUploadField />`, alimentant les mêmes clés `image_url` des brouillons. Aucune autre logique d'enregistrement modifiée.
- Aucune migration SQL : bucket et politiques déjà en place.
