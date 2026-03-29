

# Fix: Upload HEIC echoue sur Android — fallback au lieu de bloquer

## Probleme

Quand Laurence uploade une photo depuis Android, si le fichier est detecte comme HEIC/HEIF (par extension ou MIME type), `heic2any` tente de le convertir en JPEG. Sur Android Chrome, cette librairie WebAssembly echoue souvent (memoire, timeout, incompatibilite). Le `catch` actuel **bloque completement l'upload** en lançant une erreur fatale.

## Solution

Au lieu de bloquer l'upload quand la conversion HEIC echoue, **uploader le fichier original tel quel** en fallback. Le fichier sera stocke et visible au minimum sur Safari et les navigateurs recents. Un toast d'avertissement informera que la conversion n'a pas pu etre faite.

De plus, sur Android, les photos prises par l'appareil sont generalement en JPEG meme si le MIME type signale parfois `image/heic` a tort. Donc uploader le fichier brut fonctionnera dans la majorite des cas.

## Changement

**Fichier : `src/hooks/useMarcheurContributions.ts`** (lignes 76-79)

Remplacer le `throw` dans le catch par un fallback silencieux :

```typescript
// Avant
} catch (err) {
  console.error('❌ Conversion HEIC échouée:', err);
  throw new Error('Format HEIC non supporté...');
}

// Après
} catch (err) {
  console.warn('⚠️ Conversion HEIC échouée, upload du fichier original:', err);
  // Fallback: on uploade le fichier original sans conversion
}
```

Le `processedFile` reste le fichier original, et l'upload continue normalement.

## Fichier impacte

| Fichier | Action |
|---|---|
| `src/hooks/useMarcheurContributions.ts` | Remplacer le throw par un fallback (upload du fichier brut) |

