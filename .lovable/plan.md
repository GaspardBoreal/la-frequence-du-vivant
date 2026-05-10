## Diagnostic : pourquoi pas de GPS sur ta photo iPhone

### Ce qui s'est passé

Le fichier est arrivé à 5,18 Mo — c'est bien une vraie photo, mais **sans EXIF GPS**. Notre pipeline d'extraction fonctionne (il a bien lu la taille, la date d'ajout, le type…), il n'y a tout simplement **rien à lire dans le fichier reçu**.

La cause est connue et n'a rien à voir avec ton compte ni avec notre code : **iOS supprime systématiquement les coordonnées GPS quand on choisit une photo depuis "Photothèque" via un `<input type="file">` web** (Safari, Chrome iOS, PWA, peu importe). C'est une protection de confidentialité Apple introduite avec iOS 14 et durcie depuis. La photo originale dans Photos contient bien le GPS, mais Safari le strippe avant de remettre le fichier au site.

### Comment vérifier en 30 secondes

1. Ouvre la photo dans l'app Photos iOS → bouton "i" (info) en bas → tu dois voir une **carte** et des coordonnées. Si oui, le GPS est bien dans l'original.
2. Réglages iOS → Confidentialité et sécurité → Service de localisation → **Appareil photo** doit être sur "Lors de l'utilisation" et "Position précise" activée.

### 3 solutions, par ordre de robustesse

#### A. Côté utilisateur (immédiat, sans code)
Dans iOS, ouvre la photo → Partager → **"Enregistrer dans Fichiers"** (pas "Enregistrer l'image") → puis dans notre uploader, choisis "Parcourir" → Fichiers → la photo. Là, iOS ne strippe rien : on récupère le GPS.

#### B. Côté code — ajouter capture caméra directe (impact faible)
Ajouter un bouton "Prendre une photo" qui utilise `<input type="file" accept="image/*" capture="environment">`. Quand on capture **en direct depuis l'app web**, iOS conserve les EXIF (dont GPS si Localisation > Appareil photo est ON). Ça ne résout pas les imports depuis la photothèque, mais c'est le chemin le plus fiable pour les marcheurs sur le terrain.

#### C. Côté code — fallback géoloc navigateur (filet de sécurité)
Si après extraction EXIF on a `extraction_status !== 'ok'` ou `gps === null`, proposer un dialog : "Pas de GPS dans cette photo — utiliser ta position actuelle ?" → `navigator.geolocation.getCurrentPosition()` → on enregistre avec `gps.source: 'device_geolocation'` (nouveau, à ajouter au schéma à côté de `'exif'` / `'manual'`). Marqué clairement comme "position de l'appareil au moment de l'upload, pas forcément de la prise de vue".

### Ce que je propose comme plan d'action

1. **Documenter la cause** dans l'UI : quand on affiche "Aucune donnée GPS dans cette photo", ajouter une note discrète "💡 iOS supprime souvent le GPS lors du choix depuis Photos. [Astuce]" qui ouvre une mini-aide expliquant la solution A.
2. **Ajouter le bouton capture caméra** (solution B) à côté du bouton upload existant dans `FileUploadZone`, visible surtout sur mobile.
3. **Ajouter le fallback géoloc** (solution C) déclenché à la fin de l'upload si aucun GPS n'a été extrait, avec consentement explicite.
4. **Étendre le schéma `MediaGps.source`** à `'exif' | 'manual' | 'device_geolocation'` pour tracer la provenance.

### Détails techniques

- Aucune migration SQL nécessaire : `metadata` est déjà `jsonb`, on enrichit juste les valeurs possibles de `source`.
- `FileUploadZone.tsx` : ajout d'un second `<input>` avec attribut `capture` et bouton "📷 Photo".
- `useMarcheurContributions.ts` : après `preparePhotoForUpload`, si `metadata.gps === null`, push dans une queue "à géolocaliser" qui propose le dialog après l'upload (l'upload n'est pas bloquant).
- Mémoire à créer : `mem://technical/uploads/ios-gps-stripping-known-issue` documentant la cause et les 3 contournements pour éviter qu'on re-debugge ça dans 6 mois.

Aucun changement BDD requis. Tout reste rétrocompatible.