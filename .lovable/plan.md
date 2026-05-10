
# Métadonnées photos : extraction & stockage robustes

## Objectif

Garantir que **chaque photo uploadée**, quel que soit le point d'entrée (marcheur, admin, drag GPS, curation manuelle), voit ses métadonnées EXIF extraites une seule fois et stockées de façon **uniforme, validée et atomique** dans la colonne `metadata` (jsonb) de la table cible.

## État actuel (audit)

| Flow | Fichier | GPS extrait ? | Stocké en base ? |
|---|---|---|---|
| Marcheur upload (`marcheur_medias`) | `useMarcheurContributions.ts` | Oui (`exifr.gps` + `DateTimeOriginal`) | Oui dans `metadata` |
| Admin upload simple (`marche_photos`) — `savePhotos` | `supabaseMarcheOperations.ts` | Non | `metadata: null` |
| Admin upload détaillé (`marche_photos`) — `savePhoto` | `supabasePhotoOperations.ts` | Dépend de l'appelant (souvent vide) | Oui si fourni |
| Curation manuelle d'espèce | `ManualSpeciesModal.tsx` | Oui mais usage local uniquement | Non persisté |
| Drop GPS sur carte | `PhotoGpsDropTool.tsx` | Oui (point manuel) | Oui (`gps`, pas `date_taken`) |
| Vidéos / Audio | `useMarcheurContributions`, `supabaseMarcheOperations` | Non | `metadata: null` |

**Problèmes** : extraction dupliquée (3 endroits différents), schémas hétérogènes, `marche_photos` admin n'extrait jamais, fallback `usePhotoGpsCheck` re-télécharge le fichier depuis le storage à chaque visite (coûteux + sujet aux échecs CORS).

## Architecture cible

```text
                ┌──────────────────────────────┐
   File ───────▶│ extractMediaMetadata(file)   │── retourne MediaMetadata
                │  (src/utils/mediaMetadata.ts)│   normalisée + validée
                └──────────────┬───────────────┘
                               │
                ┌──────────────▼───────────────┐
                │ uploadPhotoWithMetadata()    │── 1) upload Storage
                │  (atomic helper)             │   2) insert DB (avec metadata)
                │                              │   3) si insert KO → rollback Storage
                └──────────────────────────────┘
                               │
        ┌──────────────────────┼──────────────────────┐
        ▼                      ▼                      ▼
  marcheur_medias        marche_photos          (futur) marche_videos
```

### Schéma normalisé `MediaMetadata` (jsonb)

```ts
{
  schema_version: 1,
  gps: { latitude: number, longitude: number, altitude?: number, accuracy?: number } | null,
  date_taken: string | null,        // ISO 8601 UTC
  dimensions: { width: number, height: number } | null,
  orientation: number | null,       // 1..8 EXIF
  camera: { make?: string, model?: string, lens?: string } | null,
  exposure: { iso?: number, aperture?: number, shutter?: string, focal_mm?: number } | null,
  file: { original_name: string, size_bytes: number, mime: string, was_heic_converted: boolean },
  extracted_at: string,             // ISO timestamp d'extraction
  extraction_status: 'ok' | 'partial' | 'failed',
  extraction_warnings?: string[]    // ex: 'no_gps', 'no_date', 'exif_parse_error'
}
```

Toutes les clés inutiles sont **omises** (pas de `null` partout) pour garder le jsonb compact, sauf les 3 champs critiques (`gps`, `date_taken`, `dimensions`) qui restent à `null` explicite pour distinguer "absent" de "non extrait".

## Étapes d'implémentation

### 1. Module unifié d'extraction
**Nouveau fichier** : `src/utils/mediaMetadata.ts`
- `extractMediaMetadata(file: File): Promise<MediaMetadata>`
- Utilise `exifr.parse(file, { gps: true, tiff: true, exif: true, ifd0: true })` en un seul appel (plus rapide qu'aujourd'hui où on parse 2 fois).
- Validation GPS : rejette `lat/lng` hors bornes ou `0,0` exact (souvent valeur sentinelle bidon).
- Normalise `DateTimeOriginal` en ISO UTC (gère Date, string, fuseau).
- Sur fichiers HEIC/HEIF : extrait l'EXIF du fichier **original** (avant conversion JPEG, sinon les données sont perdues).
- Retourne toujours un objet (jamais null) avec `extraction_status` adéquat.

### 2. Helper d'upload atomique
**Nouveau fichier** : `src/utils/uploadWithMetadata.ts`
- `uploadPhotoWithMetadata({ file, bucket, folder, table, row })`:
  1. Extraction EXIF (sur le `File` local, AVANT toute conversion HEIC).
  2. Conversion HEIC → JPEG si nécessaire.
  3. Upload vers Storage.
  4. Insert DB avec `metadata` injecté.
  5. **Si l'insert DB échoue → suppression du fichier Storage** (rollback) pour éviter les orphelins.
  6. Retour typé du row inséré.
- Logs structurés : `[upload]` `extracted_keys=…` `gps_present=…` `db_status=…`.

### 3. Migration des call sites

Remplacer l'extraction et l'insert par `uploadPhotoWithMetadata` dans :
- `src/hooks/useMarcheurContributions.ts` (`useUploadMedias`) — supprime le bloc EXIF inline.
- `src/utils/supabaseMarcheOperations.ts` (`savePhotos`) — corrige le `metadata: null`.
- `src/utils/supabasePhotoOperations.ts` (`savePhoto`) — branche le helper, retire `validateMetadata` redondant.
- `src/components/community/exploration/PhotoGpsDropTool.tsx` — fusionne le GPS manuel dans le metadata schema (ajoute un flag `gps.source: 'manual'`).
- `src/components/community/insights/curation/ManualSpeciesModal.tsx` — persiste enfin l'EXIF lu.

### 4. Backfill (optionnel mais recommandé)
**Edge function** `backfill-media-metadata` (one-shot, déclenché manuellement) :
- Sélectionne les rows `marche_photos` / `marcheur_medias` où `metadata IS NULL` ou `metadata->>'schema_version' IS NULL`.
- Télécharge le fichier depuis Storage, extrait l'EXIF côté serveur (`exifr` ou via Deno équivalent), met à jour la row.
- Pagination + checkpoint pour reprendre en cas d'arrêt. Limite 500 rows / run.

### 5. Migration DB (légère)
Aucune restructuration de colonne (déjà jsonb). Ajout d'un **index GIN partiel** pour accélérer les futures requêtes GPS / date :
```sql
CREATE INDEX IF NOT EXISTS idx_marcheur_medias_metadata_gps
  ON public.marcheur_medias USING gin ((metadata->'gps'));
CREATE INDEX IF NOT EXISTS idx_marche_photos_metadata_gps
  ON public.marche_photos USING gin ((metadata->'gps'));
```

### 6. Mise à jour côté lecteurs
- `usePhotoGpsCheck` : élargit `storedGps` pour reconnaître aussi `metadata.gps.latitude/longitude` (déjà le cas) et **ne déclenche le fallback `exifr.gps(url)` que si `extraction_status !== 'ok'`** (économie réseau majeure).
- `MediaMetadataPanel` : déjà compatible, rien à changer.
- `MediaLightbox` types (`gps`, `date_taken`, `width`/`height`) : alignés sur le nouveau schéma.

### 7. Tests & validation
- Test manuel iPhone HEIC : vérifier que GPS + date sont bien persistés (pas perdus pendant la conversion).
- Test photo sans GPS : `extraction_status: 'partial'`, `extraction_warnings: ['no_gps']`.
- Test rollback : forcer une erreur DB → vérifier que le fichier Storage est supprimé.
- Test admin upload (formulaire de marche) : `metadata` non null après création.
- Vérifier dans la DB :
  ```sql
  select count(*) filter (where metadata->'gps' is not null) as with_gps,
         count(*) as total
  from marcheur_medias where created_at > now() - interval '1 day';
  ```

## Détails techniques importants

- **Robustesse extraction HEIC** : l'extraction DOIT précéder la conversion. `exifr` lit nativement les HEIC sur navigateur moderne ; sinon retourner `extraction_status: 'partial'` plutôt que de planter l'upload.
- **Atomicité** : pas de transaction Postgres possible entre Storage + DB, donc on implémente un rollback applicatif (delete Storage si insert DB KO).
- **Idempotence** : si l'utilisateur réessaie après crash réseau, le helper détecte un `metadata.file.original_name + size_bytes + user_id` existant et propose la dédup (option : skipper l'upload).
- **PII / vie privée** : le GPS d'une photo est sensible. Il est déjà respecté par RLS (visible seulement selon `is_public`). On n'expose pas le GPS en clair dans les pages publiques sauf si la photo est `is_public = true`. Aucun changement nécessaire sur ce point, mais à confirmer.
- **Pas de modif** des colonnes existantes (rétro-compatible).

## Livrables

- `src/utils/mediaMetadata.ts` (nouveau)
- `src/utils/uploadWithMetadata.ts` (nouveau)
- 4 fichiers refactorés (hooks + utils admin)
- 1 migration SQL (2 index GIN)
- 1 edge function backfill (optionnelle, à déclencher quand vous le souhaiterez)
- 1 entrée mémoire `mem://technical/uploads/media-metadata-pipeline-logic`

## Hors scope

- Vidéos et audio (gardés sans métadonnées pour cette itération — peut être fait dans un second temps via `ffprobe` côté Edge).
- Re-géolocalisation automatique des photos sans GPS (déjà gérée par `PhotoGpsDropTool` côté UI).
