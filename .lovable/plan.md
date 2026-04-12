

## Analyse et plan d'amélioration : extraction GPS au moment de l'upload

### Constat

Le code d'upload des photos marcheurs (`useUploadMedias` dans `useMarcheurContributions.ts`) **ne fait aucune extraction EXIF/GPS**. Il stocke uniquement `url_fichier`, `titre`, `taille_octets`. La table `marcheur_medias` **n'a pas de colonne metadata**.

Le check GPS actuel (`usePhotoGpsCheck`) tente d'extraire les coordonnées **a posteriori** via `exifr.gps(url)` sur l'URL Supabase Storage. Ce fonctionnement est fragile car :
- Les range requests CORS peuvent échouer selon la config du bucket
- Supabase Storage peut compresser/transformer les images et supprimer l'EXIF
- Chaque consultation re-télécharge partiellement toutes les photos

### Solution proposée

Extraire le GPS **au moment de l'upload**, depuis le `File` blob local (100% fiable, pas de CORS), et stocker le résultat en base.

### Modifications

**1. Migration SQL : ajouter colonne `metadata` JSONB sur `marcheur_medias`**

```sql
ALTER TABLE public.marcheur_medias 
ADD COLUMN metadata jsonb DEFAULT NULL;
```

Structure stockée : `{ "gps": { "latitude": 43.61, "longitude": 3.87 }, "date_taken": "2025-08-10T14:30:00" }`

**2. Modifier `useUploadMedias` dans `useMarcheurContributions.ts`**

Avant l'upload de chaque fichier, extraire le GPS via `exifr.gps(file)` (fonctionne sur un `File`/`Blob` local — rapide, pas de réseau). Stocker le résultat dans la colonne `metadata` lors de l'INSERT.

```typescript
// Avant l'upload
const gps = await exifr.gps(file).catch(() => null);
const dateTaken = await exifr.parse(file, ['DateTimeOriginal']).catch(() => null);

// Dans l'INSERT
metadata: {
  ...(gps ? { gps: { latitude: gps.latitude, longitude: gps.longitude } } : {}),
  ...(dateTaken?.DateTimeOriginal ? { date_taken: dateTaken.DateTimeOriginal } : {}),
}
```

**3. Modifier `usePhotoGpsCheck` pour utiliser les données stockées en priorité**

- Si `metadata.gps` existe en base → l'utiliser directement (pas de fetch EXIF)
- Sinon → fallback sur `exifr.gps(url)` comme actuellement
- Cela rend le check quasi instantané pour les nouvelles photos

**4. Auto-rafraîchissement après upload**

Dans le `onSuccess` de `useUploadMedias`, invalider aussi la query key du GPS check pour que les distances sous les photos se mettent à jour automatiquement sans clic supplémentaire sur le bouton 🎯.

### Fichiers modifiés

| Fichier | Action |
|---------|--------|
| Migration SQL | Ajouter colonne `metadata jsonb` sur `marcheur_medias` |
| `src/hooks/useMarcheurContributions.ts` | Extraire EXIF GPS/date du `File` blob avant insert |
| `src/hooks/usePhotoGpsCheck.ts` | Priorité aux données stockées, fallback exifr si absent |
| `src/components/community/MarcheDetailModal.tsx` | Re-trigger GPS check automatiquement après upload (invalidation query) |

### Performance

- `exifr.gps(file)` sur un blob local : ~5-20ms par photo (lecture partielle en mémoire)
- Aucun impact sur le temps d'upload perçu
- Le check GPS en mode Fiche devient instantané pour les photos avec metadata stockée

