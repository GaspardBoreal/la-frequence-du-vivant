
Objectif: éliminer l’erreur “Format HEIC non supporté” pour les photos Android Ultra HDR (4284x5712) sans bloquer l’upload.

Constat technique (après analyse du code):
1) Il reste une voie bloquante: `src/utils/photoUtils.ts` (`convertHeicToJpeg`) jette encore une erreur fatale si la conversion échoue.
2) Cette voie est utilisée dans les parcours mobile/admin (`PhotoCaptureFloat`, `MediaUploadSection`) via `processPhoto`.
3) Les HEIC Ultra HDR font souvent échouer `heic2any` (cas connu Android/Chrome, libheif), surtout sur gros fichiers.
4) Dans la contribution marcheur, le fallback existe déjà dans `useMarcheurContributions.ts`, mais pas dans toute la chaîne.

Do I know what the issue is? Oui: la conversion HEIC est encore “hard-fail” dans une partie du code, et les HEIC Ultra HDR dépassent souvent ce que `heic2any` gère de façon fiable sur Android.

Plan de correctif (court terme + robuste):
1) Unifier la stratégie HEIC en “never-block upload”
   - Dans `photoUtils.ts`, remplacer le `throw` de `convertHeicToJpeg` par un fallback (retourner le fichier original + flag d’échec de conversion).
   - `processPhoto` doit continuer même si conversion KO.

2) Ajouter une conversion “best effort” spécifique Android Ultra HDR
   - Ordre de tentative:
     a) conversion légère (native decode/canvas si dispo),
     b) `heic2any` avec timeout court,
     c) fallback immédiat fichier original (sans erreur bloquante).
   - Plus aucun chemin ne doit lancer “Impossible de convertir le fichier HEIC” pour l’utilisateur final.

3) Rendre la détection HEIC plus robuste
   - Détection par extension ET MIME “contient heic/heif” (pas uniquement égalité stricte).
   - Couvrir les MIME atypiques Android (ex: `image/heic-sequence`, type vide + extension).

4) Adapter le feedback UX
   - Si conversion réussie: upload normal JPEG.
   - Si conversion échoue: toast non bloquant du type
     “Photo HEIC Ultra HDR conservée telle quelle. Affichage limité selon navigateur.”
   - Ne plus afficher de message d’erreur fatal “format non supporté” tant que l’upload brut peut passer.

5) Fiabiliser l’affichage post-upload
   - Sur rendu image: gérer `onError` pour `.heic/.heif` avec fallback visuel (badge HEIC + bouton ouvrir/télécharger).
   - Évite l’impression de “photo perdue” si navigateur non compatible.

Fichiers à modifier:
- `src/utils/photoUtils.ts` (suppression hard-fail, fallback unifié)
- `src/hooks/useMarcheurContributions.ts` (détection HEIC renforcée + messages UX)
- `src/components/admin/mobile/PhotoCaptureFloat.tsx` (gestion message non bloquant)
- `src/components/community/MarcheDetailModal.tsx` (filtrage photo plus tolérant)
- `src/components/community/contributions/ContributionItem.tsx` (fallback d’affichage HEIC)

Validation attendue (Android Laurence):
1) Upload d’une photo HEIC Ultra HDR: plus d’erreur bloquante.
2) Fin de “Upload en cours…” infini.
3) Insertion DB créée systématiquement.
4) Sur Chrome Android: image affichée si convertible, sinon fallback HEIC visible + action ouvrir/télécharger.
5) Sur Safari iOS: affichage natif HEIC validé.
