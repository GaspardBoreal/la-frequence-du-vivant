

# Fix: Images HEIF non affichees dans le navigateur

## Diagnostic

Les 4 dernieres photos uploadees par Laurence Karki sont au format **HEIF** (`.heif`). Ce format n'est **pas supporte par Chrome, Firefox ni Edge** — seul Safari le gere nativement. Les images apparaissent dans la base de donnees avec les bonnes metadonnees (`is_public: true`, bon `marche_id`), mais le navigateur ne peut pas les afficher.

Ses premieres photos (`.jpeg`, `.jpg`) s'affichent correctement.

## Correctif propose

### Approche : Conversion cote client au moment de l'upload

Convertir automatiquement les fichiers HEIF/HEIC en JPEG **avant** l'upload vers Supabase Storage. Utiliser un `<canvas>` pour la conversion (fonctionne si le navigateur supporte le decodage, sinon utiliser la librairie `heic2any`).

### Fichier : `src/hooks/useMarcheurContributions.ts`

1. Installer la dependance `heic2any` (conversion HEIF → JPEG en JS)
2. Modifier la fonction `uploadFile` pour detecter les extensions `.heif` et `.heic`
3. Convertir en JPEG via `heic2any` avant d'uploader
4. Changer l'extension du fichier stocke en `.jpeg`

### Code simplifie

```typescript
import heic2any from 'heic2any';

async function uploadFile(userId: string, file: File, folder: string): Promise<string> {
  let processedFile = file;
  
  // Convert HEIF/HEIC to JPEG
  if (file.name.match(/\.(heif|heic)$/i) || file.type === 'image/heif' || file.type === 'image/heic') {
    const blob = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.85 });
    const jpegBlob = Array.isArray(blob) ? blob[0] : blob;
    processedFile = new File([jpegBlob], file.name.replace(/\.(heif|heic)$/i, '.jpeg'), { type: 'image/jpeg' });
  }
  
  const ext = processedFile.name.split('.').pop() || 'bin';
  // ... rest of upload logic
}
```

### Bug mineur secondaire

Ligne 163 de `ExplorationMarcheurPage.tsx` : `lire: stats?.textes` devrait etre `lire: stats?.totalTextes` pour la coherence avec les autres badges.

## Fichiers impactes

| Fichier | Action |
|---|---|
| `package.json` | Ajouter `heic2any` |
| `src/hooks/useMarcheurContributions.ts` | Convertir HEIF → JPEG dans `uploadFile` |
| `src/components/community/ExplorationMarcheurPage.tsx` | Fix badge `lire` |

## Limitation

Les 4 fichiers HEIF deja uploades resteront non-affichables. Options :
- Les re-uploader manuellement en JPEG
- Ou ajouter un script de migration qui les convertit (plus complexe)

