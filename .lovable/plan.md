

## Diagnostic — Extraction GPS qui échoue sur mobile

### Problème identifié

Le code actuel dans `PhotoGpsDropTool.tsx` (ligne 240-243) utilise `Promise.all` pour appeler simultanément `exifr.gps(file)` et `exifr.parse(file, ['DateTimeOriginal'])`. Les deux méthodes lisent le même `File` blob en parallèle, ce qui peut provoquer des erreurs de lecture sur mobile (le fichier stream est consommé par la première lecture).

De plus, la vérification GPS (ligne 245) utilise `!gps?.latitude || !gps?.longitude` — un check "falsy" qui échouerait si une coordonnée vaut exactement `0`.

Enfin, sur **iOS Safari**, `exifr.gps()` peut échouer silencieusement sur les fichiers HEIC (format natif iPhone) car le parser léger n'inclut pas toujours le support HEIC complet. Il faut utiliser `exifr.parse()` avec les tags GPS explicites comme fallback.

### Corrections prévues

**Fichier** : `src/components/community/exploration/PhotoGpsDropTool.tsx`

1. **Séquentialiser les appels EXIF** — Ne plus utiliser `Promise.all`. D'abord `exifr.parse()` complet, puis extraire GPS et date du même résultat.

2. **Utiliser `exifr.parse()` au lieu de `exifr.gps()`** — `parse()` est plus robuste, supporte HEIC, et retourne toutes les métadonnées d'un coup (GPS inclus via `latitude`/`longitude` sur l'objet retourné).

3. **Fix du check falsy** — Remplacer `!gps?.latitude || !gps?.longitude` par `gps?.latitude == null || gps?.longitude == null`.

4. **Ajouter des logs de debug** — `console.log` sur le résultat d'extraction pour faciliter le diagnostic futur.

5. **Ajouter `capture="environment"` sur l'input file mobile** — Pour proposer directement la caméra sur smartphone en plus de la galerie.

### Détail technique du fix

```typescript
// AVANT (problématique)
const [gps, exifData] = await Promise.all([
  exifr.gps(file),
  exifr.parse(file, ['DateTimeOriginal']),
]);
if (!gps?.latitude || !gps?.longitude) { ... }

// APRÈS (robuste)
const exifData = await exifr.parse(file, {
  gps: true,
  pick: ['DateTimeOriginal', 'GPSLatitude', 'GPSLongitude', 'latitude', 'longitude']
});
console.log('[PhotoGPS] EXIF extrait:', exifData);
const lat = exifData?.latitude ?? exifData?.GPSLatitude;
const lng = exifData?.longitude ?? exifData?.GPSLongitude;
if (lat == null || lng == null) { toast.warning(...); return; }
```

### Fichiers impactés

| Fichier | Action |
|---------|--------|
| `PhotoGpsDropTool.tsx` | Refactorer `handleFileChange` — un seul appel `exifr.parse()`, fix check null, logs debug |

