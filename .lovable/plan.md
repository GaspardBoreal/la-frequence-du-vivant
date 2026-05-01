## Constat — Diagnostic rigoureux

### Ce qui existe déjà
- Dépendance `heic2any@0.0.4` installée (très ancienne, 6 ans, bugs connus iOS Safari).
- `src/utils/photoUtils.ts` → `convertHeicToJpeg()` avec timeout 30s + fallback silencieux.
- `src/utils/imageOptimizer.ts` → appelle bien `convertHeicToJpeg` AVANT compression. ✅
- `src/hooks/useMarcheurContributions.ts` → conversion HEIC inline dans `uploadFile()`. ✅
- `src/hooks/useConvivialitePhotos.ts` → utilise `ImageOptimizer`, donc converti. ✅
- `src/components/admin/MediaUploadSection.tsx` + `PhotoCard.tsx` + `ContributionItem.tsx` → références HEIC.

### Trous identifiés (problèmes réels)

1. **Bibliothèque obsolète et fragile** : `heic2any@0.0.4` est connue pour :
   - Crasher sur Safari iOS avec gros HEIC (Live Photos, mode rafale, >5 Mo).
   - Échouer silencieusement → le fichier `.heic` est uploadé tel quel → **invisible dans le navigateur** (Chrome/Firefox/Edge ne lisent pas HEIC).
   - Pas de support HEIC multi-images (séquences iPhone).

2. **Input `accept="image/*"` ambigu sur iOS** : sur iPhone, `image/*` propose la caméra qui sort du JPEG, mais l'app Photos partage en HEIC natif. Il faut explicitement `accept="image/*,.heic,.heif"` pour que Safari laisse passer ces fichiers via "Parcourir".

3. **Aucune indication utilisateur** : si la conversion prend 15-25s sur un vieux iPhone, l'UI affiche juste "Envoi en cours" sans contexte → le marcheur ferme l'app.

4. **Fallback dangereux** : aujourd'hui, si la conversion échoue, on **uploade quand même le `.heic`**. Résultat : la photo est en base, mais aucun marcheur Android/desktop ne la verra (image cassée). Pire pour le mur de Convivialité public.

5. **Pas de validation côté contenu** : on se fie au MIME que iOS renseigne mal (parfois `application/octet-stream` pour HEIC partagés via WhatsApp/Drive). La détection actuelle par extension uniquement rate ces cas.

6. **Conversion serveur absente** : aucun edge function de secours si le client échoue. Pour des photos critiques (mur de convivialité, contributions de marcheurs), c'est un point de défaillance unique côté navigateur.

7. **Logique dupliquée** : `useMarcheurContributions.ts` réimplémente la conversion HEIC au lieu d'utiliser `convertHeicToJpeg`. Risque de divergence.

---

## Plan d'action — 3 niveaux de robustesse

### Niveau 1 — Fiabiliser le client (priorité haute)

**1.1 Remplacer `heic2any` par `heic-to`** (maintenu, plus performant, fonctionne sur Safari iOS)
- Installation de `heic-to` (compatible WASM, ~3x plus rapide, gère les séquences).
- Garder `heic2any` en fallback secondaire (au cas où `heic-to` échoue sur très vieux navigateur).

**1.2 Centraliser et durcir `convertHeicToJpeg`** dans `photoUtils.ts` :
- Détection robuste : MIME + extension + magic bytes (lire les 12 premiers octets, signature `ftypheic`/`ftypmif1`/`ftypheix`/`ftyphevc`).
- Try `heic-to` → fallback `heic2any` → fallback canvas (createImageBitmap + Safari natif iOS qui sait lire HEIC).
- Si Safari iOS, court-circuit : le navigateur lit nativement → re-encoder en JPEG via canvas (rapide, pas de WASM).
- Timeout adaptatif : 15s par Mo, plafonné à 60s.

**1.3 Refuser l'upload final si conversion ÉCHOUÉE** (changement de politique)
- Plutôt qu'uploader un `.heic` cassé, lever une erreur claire :
  *"Cette photo iPhone n'a pas pu être convertie. Astuce : dans Réglages iPhone → Appareil photo → Formats → 'Le plus compatible'."*
- Pour le mur de convivialité (contenu public), c'est non-négociable.

**1.4 Élargir `accept` sur tous les inputs photos**
- Remplacer `accept="image/*"` par `accept="image/*,.heic,.heif,.HEIC,.HEIF"` dans :
  - `ConvivialiteUploadFAB.tsx`
  - `PhotoGpsDropTool.tsx`
  - `PhotoCaptureFloat.tsx` (×2)
  - `MarcheDetailModal.tsx`
  - `MediaUploadSection.tsx`
  - `CoverEditor.tsx`
  - `FileUploadZone.tsx` (via prop appelante)

**1.5 UX — feedback de conversion**
- Dans `ImageOptimizer.optimizeImages`, exposer un callback `onProgress(file, stage)` avec stages `detecting | converting-heic | compressing | uploading`.
- Dans `ConvivialiteUploadFAB` et `useMarcheurContributions`, afficher un sous-titre dynamique : *"Conversion photo iPhone (3/8)…"*.

**1.6 Dédupliquer le code**
- `useMarcheurContributions.uploadFile()` → utiliser `ImageOptimizer` (qui gère déjà HEIC + compression) au lieu de réimplémenter.

### Niveau 2 — Filet de sécurité serveur (priorité moyenne)

**2.1 Edge function `convert-heic`** (Supabase)
- Si le client retourne une erreur de conversion, possibilité d'uploader le HEIC original dans un bucket temporaire `heic-pending`.
- Edge function déclenchée (webhook storage) qui convertit avec `sharp` (supporte HEIC via `libheif`) et déplace le JPEG résultant dans le bucket final, puis met à jour la ligne en base.
- Statut `pending_conversion` sur la photo tant que non-convertie (UI affiche un placeholder).

> Cette partie nécessitera une migration DB (ajout colonne `conversion_status`) et un nouveau bucket. À traiter en phase 2 si Niveau 1 ne suffit pas en production.

### Niveau 3 — Documentation marcheur (priorité basse)

**3.1 Bandeau d'aide contextuel** dans le FAB d'upload :
- Petite note discrète : *"Photos iPhone (HEIC) acceptées — conversion automatique."*
- Dans la doc/aide marcheur, expliquer comment forcer JPEG sur iPhone (Réglages → Appareil photo → Formats).

---

## Ordre d'implémentation proposé

1. **Étape A** (essentielle, sans backend) :
   - Installer `heic-to`.
   - Réécrire `convertHeicToJpeg` (détection magic bytes + cascade de stratégies + Safari natif).
   - Élargir tous les `accept=`.
   - Politique "fail-fast" si conversion impossible (toast explicite).
   - Refactor `useMarcheurContributions` pour réutiliser `ImageOptimizer`.
   - UX progress par fichier.

2. **Étape B** (optionnelle, après retour terrain) : edge function de conversion serveur si certains iPhone très anciens posent encore problème.

## Détails techniques

### Détection magic bytes
```ts
async function isHeicByMagicBytes(file: File): Promise<boolean> {
  const buf = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  // Bytes 4-7 = "ftyp", bytes 8-11 = brand
  const ftyp = String.fromCharCode(...buf.slice(4, 8));
  const brand = String.fromCharCode(...buf.slice(8, 12));
  return ftyp === 'ftyp' && /^(heic|heix|hevc|mif1|msf1|heim|heis|hevm|hevs)/.test(brand);
}
```

### Cascade de conversion
```ts
async function convertHeicToJpeg(file: File): Promise<File> {
  if (!await isHeic(file)) return file;
  // 1) heic-to (rapide, WASM moderne)
  try { return await convertWithHeicTo(file); } catch {}
  // 2) Safari iOS natif via canvas
  if (isSafariIOS()) {
    try { return await convertViaCanvas(file); } catch {}
  }
  // 3) heic2any (fallback historique)
  try { return await convertWithHeic2Any(file); } catch {}
  throw new Error('HEIC_CONVERSION_FAILED');
}
```

### Politique fail-fast
- `ImageOptimizer.optimizeImage` propage l'erreur `HEIC_CONVERSION_FAILED`.
- Les hooks d'upload (`useUploadConvivialitePhotos`, `useMarcheurContributions`) attrapent et affichent un toast explicite, sans uploader de fichier `.heic` cassé.

## Fichiers impactés (Étape A)

```text
package.json                                                  (+heic-to)
src/utils/photoUtils.ts                                       (réécriture conversion)
src/utils/imageOptimizer.ts                                   (callback progress + fail-fast)
src/hooks/useMarcheurContributions.ts                         (utilise ImageOptimizer)
src/hooks/useConvivialitePhotos.ts                            (callback progress)
src/components/community/exploration/convivialite/ConvivialiteUploadFAB.tsx  (accept + progress UI)
src/components/community/exploration/PhotoGpsDropTool.tsx     (accept)
src/components/admin/mobile/PhotoCaptureFloat.tsx             (accept)
src/components/community/MarcheDetailModal.tsx                (accept)
src/components/admin/MediaUploadSection.tsx                   (accept)
src/components/admin/CoverEditor.tsx                          (accept)
```

Aucune migration DB nécessaire pour l'Étape A.
