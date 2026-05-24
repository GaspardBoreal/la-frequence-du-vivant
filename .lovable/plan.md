## Objectif

Enrichir le drawer « Préparer upload iNat » d'un mode **plein écran** dédié au repositionnement GPS des photos, avec carte interactive (réutilisée de l'onglet Carte) et liste des candidats.

## Layout

**Drawer compact (actuel)** : inchangé, on ajoute juste un bouton `⛶ Plein écran` dans le header.

**Mode plein écran** (Dialog plein viewport) :

```text
┌──────────────────────────────────────────────────────────────┐
│ [75 GPS EXIF] [6 GPS marche] [0 Sans GPS]   …actions   [X]   │
├────────────────────────────────────┬─────────────────────────┤
│                                    │  Liste photos candidates│
│         <RichMap>                  │  ┌────┐ IMG_1234.jpg    │
│   • markers couleur par source     │  │ 🖼 │ 📍 EXIF • 21/05 │
│   • clic → popup vignette          │  └────┘ [⛶][✎ déplacer] │
│   • drag (curators)                │  …                      │
│   • route marche en fond           │                         │
└────────────────────────────────────┴─────────────────────────┘
```

## Comportements de repositionnement (curators uniquement)

Les 3 modes combinés, avec barre d'aide contextuelle :

1. **Drag du marker** sur la carte → relâche → modal de confirmation → save.
2. **Sélection photo dans la liste** → curseur "+" sur la carte → clic = pose.
3. **Snap aux waypoints/points existants** : lors d'un drag, si on s'approche (< 25 m) d'un waypoint de la marche, aimantation visuelle.

Marqueurs colorés :
- 🟢 EXIF (`metadata.gps.source = 'exif'`)
- 🟡 GPS marche (fallback coords de la marche)
- 🔴 Sans GPS (rendus dans une zone "à placer" hors carte, draggables vers la carte)
- 🔵 Manuel (`source = 'manual'`) : indique un repositionnement déjà effectué

Popup au clic : nom marche + date + vignette photo + bouton « Ouvrir en grand » (lightbox) + bouton « Déplacer » (active mode drag).

## Données — sauvegarde GPS (les deux)

### 1) Override dans `marcheur_medias.metadata` (JSONB)

```json
{
  "gps": { "latitude": 45.12, "longitude": 0.7, "source": "manual" },
  "gps_original": { "latitude": 45.10, "longitude": 0.6, "source": "exif" },
  "gps_repositioned_at": "2026-05-24T…",
  "gps_repositioned_by": "<user_id>"
}
```

`gps_original` n'est écrit qu'au premier override (préserve l'EXIF d'origine).

### 2) Table d'audit `marcheur_media_gps_audit`

```text
id, media_id, previous_lat, previous_lon, previous_source,
new_lat, new_lon, new_source, repositioned_by, repositioned_at, note
```

RLS : INSERT par curators (`has_role` ambassadeur/sentinelle/admin), SELECT par curators + propriétaire du media.

### Pour `marcheur_observations` (source 'observation')

Même pattern : on ajoute `gps_override` (point geojson ou 2 colonnes lat/lon) + audit row.

## Permissions

Repositionnement réservé aux curators (`ambassadeur` / `sentinelle` / `admin`) via `has_role`. Le drawer compact reste lecture seule.

Vérifications :
- **Front** : hook `useIsCurator` (existant via `useCurationMarcheurs`) → expose `canRepositionGps`. Boutons "Déplacer" cachés sinon.
- **Back** : RPC SECURITY DEFINER `reposition_marcheur_media_gps(media_id, lat, lon, note)` qui vérifie le rôle, met à jour `metadata`, insère l'audit row. Idem `reposition_marcheur_observation_gps`.

## Carte réutilisée

`<RichMap>` (`src/components/maps/RichMap.tsx`) avec :
- `controls: { zoom: true, style: true, geolocate: true, cadastre: true }`
- `marcheRoute` : trace de la marche sélectionnée (si une seule marche) ou de toutes les marches de l'exploration (vue d'ensemble)
- `bounds` : auto-fit sur tous les candidats GPS
- `children` : nos markers custom (avec `draggable` selon `canRepositionGps`) + popups

Filtre rapide en haut de carte : `[Toutes marches ▾]` pour switcher entre vue exploration et focus marche.

## Indicateurs (bandeau haut)

Trois pastilles cliquables (filtrent la liste + carte) :

- **N GPS EXIF** — `metadata.gps.source ∈ {exif, manual}`
- **N GPS marche** — pas de gps EXIF, mais marche a des coords
- **N Sans GPS** — ni EXIF ni coord marche

Calcul dérivé du hook existant `useMarcheurUnidentifiedPhotos` (déjà enrichi du `gps` + on joint coords de marche).

## Fichiers à créer / modifier

**Nouveaux :**
- `src/components/community/exploration/InatUploadFullscreen.tsx` — Dialog plein écran, layout 2-colonnes
- `src/components/community/exploration/InatGpsMap.tsx` — wrapper `<RichMap>` + markers draggables + popups
- `src/components/community/exploration/InatPhotoList.tsx` — liste droite (vignettes, badges source, bouton déplacer)
- `src/hooks/useRepositionMediaGps.ts` — mutation TanStack appelant les 2 RPC
- `src/hooks/useIsExplorationCurator.ts` — petit hook qui combine `useAuth` + `has_role`

**Modifiés :**
- `src/components/community/exploration/InatUploadPrepDrawer.tsx` — ajout bouton "Plein écran" header, monte `<InatUploadFullscreen>`
- `src/hooks/useMarcheurUnidentifiedPhotos.ts` — joindre coords de marche (lat/lon des `marche_events`) pour fallback "GPS marche", exposer un champ `gpsCategory: 'exif' | 'marche' | 'none'`

## Migration DB

1. `CREATE TABLE marcheur_media_gps_audit (...)` + RLS
2. `RPC reposition_marcheur_media_gps(_media_id uuid, _lat numeric, _lon numeric, _note text)` — SECURITY DEFINER, vérifie has_role curator
3. `RPC reposition_marcheur_observation_gps(_obs_id uuid, _lat numeric, _lon numeric, _note text)` — idem (ajoute `latitude/longitude` columns sur `marcheur_observations` si absentes, ou utilise un champ JSONB existant)

## Hors scope (pour plus tard)

- Repositionnement multi-photos en lot
- Réécriture EXIF du fichier source dans Storage (on garde l'override DB uniquement)
- Visualisation de l'historique d'audit dans l'UI (la table sera là, l'UI viendra plus tard)
