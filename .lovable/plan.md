## Diagnostic

D'après le session replay et les logs :

1. Tu cliques sur « Visible par les marcheurs » (toggle public ON) ✅
2. Tu sélectionnes le fichier `Arbre entrée 1 - 09 05 2026.HEIC` ✅
3. La ligne suivante du replay est immédiatement `File selection cleared` — **aucune mutation n'est lancée, aucun toast, aucun appel réseau**.

### Cause racine

Dans `src/components/community/MarcheDetailModal.tsx` (ligne 478-489), le handler filtre les fichiers ainsi :

```ts
const photos = files.filter(f => f.type.startsWith('image/'));
const videos = files.filter(f => f.type.startsWith('video/'));
```

Or, sur **Windows + Chrome/Edge**, un fichier `.HEIC` arrive avec `file.type === ""` (le navigateur ne connaît pas le MIME HEIC). Résultat : il est exclu des deux buckets, **silencieusement droppé**, et `inputRef.current.value = ''` reset l'input. Aucune erreur, rien ne part.

C'est exactement le pattern que la mémoire `mem://technical/uploads/heic-conversion-strategy` recommande d'éviter (« fail-fast policy » : jamais ignorer un HEIC).

La conversion HEIC existe déjà et fonctionne (`useMarcheurContributions` appelle `convertHeicToJpeg`). Le problème est **uniquement le filtrage en amont** qui n'a jamais traité le cas MIME-vide.

Pourquoi cela « fonctionnait avant » : soit tu uploadais des JPG, soit depuis un autre device (Safari iOS renvoie `image/heic`, qui matche `image/*`).

## Plan de correctif (robuste)

### 1. Détection multi-critères dans `MarcheDetailModal.tsx`

Remplacer le filtre naïf par une fonction `classifyFile(file)` qui décide `'photo' | 'video' | 'unknown'` à partir de :
- le MIME (`image/*`, `video/*`)
- l'extension (`.heic`, `.heif`, `.jpg`, `.png`, `.webp`, `.mp4`, `.mov`, `.avi`, `.mkv`)
- en réutilisant `isHeic()` déjà exporté par `src/utils/heicConverter.ts` (qui gère MIME, extension ET magic bytes)

Tout fichier HEIC/HEIF est classé `photo` (la conversion JPEG arrive plus tard dans `useMarcheurContributions`).

### 2. Fail-fast visible

Si après classification certains fichiers restent `unknown`, afficher un `toast.error` listant leurs noms (« Format non supporté : … »). Plus de drop silencieux.

### 3. Feedback de prise en compte

Ajouter un `toast.info('Préparation de N photo(s)…')` dès qu'au moins un fichier est accepté, pour que l'utilisateur ait un retour immédiat même pendant la conversion HEIC (qui peut prendre quelques secondes sur gros fichiers).

### 4. Élargir l'`accept` HTML

Actuellement `accept="image/*,video/*,.heic,.heif,.HEIC,.HEIF"`. Ajouter `image/heic,image/heif` pour que Safari/Chrome récents pré-filtrent correctement, et `.mov,.mp4` explicites pour iOS.

### 5. Appliquer le même fix au mode `compact` et aux autres `FileUploadZone` consommateurs

Audit rapide des call-sites de `FileUploadZone` (grep `onFilesSelected`) pour s'assurer qu'aucun autre n'utilise un filtre `f.type.startsWith(...)` fragile. Centraliser la classification dans un util `src/utils/fileClassifier.ts` pour réutilisation.

### Détails techniques

- Nouveau fichier : `src/utils/fileClassifier.ts` exposant `classifyMediaFile(file): 'photo' | 'video' | 'unknown'`.
- Édition : `src/components/community/MarcheDetailModal.tsx` (lignes 473-490).
- Édition : autres consommateurs de `FileUploadZone` filtrant par MIME (à identifier en phase d'implémentation).
- Aucune migration DB, aucune edge function touchée.
- Aucun changement visuel.

### Validation

1. Réessayer l'upload du même `.HEIC` sur DEVIAT C 0867 → un toast « Préparation de 1 photo… » puis conversion + upload visible.
2. Vérifier les logs console : `🔄 [HEIC] Conversion …` puis `✅ [HEIC] heic-to OK`.
3. Tester avec un mix JPG + HEIC + MP4 dans le même drop.
4. Tester un fichier `.txt` → toast d'erreur explicite, pas de drop silencieux.
