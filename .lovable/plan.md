## Contexte

Quand on clique sur un marqueur émeraude dans la carte du drawer "Empreinte GPS iNaturalist" (Synthèse → Simulateur → vue carte espèce), le popup affiche uniquement : `1 observation`, date, nom de l'observateur, lien iNat. **Aucune photo**, alors que la photo du marcheur est précisément l'élément le plus parlant pour identifier visuellement l'observation sur le terrain.

## Cause

Dans `src/components/community/EventBiodiversityTab.tsx` (lignes 316-355), l'objet `attribution` construit depuis `marcheur_observations` ne propage pas `photo_url`, alors que ce champ est déjà sélectionné dans la requête (ligne 175). Côté snapshots iNat (lignes 280-313), les attributions transportent déjà un champ photo (selon le shape du snapshot), mais `SpeciesGpsDrawer` ne l'utilise pas.

Dans `src/components/community/synthese/indices/SpeciesGpsDrawer.tsx` (lignes 245-272), le `<Popup>` n'affiche `sample = c.attributions[0]` que pour ses métadonnées texte — la photo n'est jamais lue.

## Plan

### 1. Propager la photo dans les attributions
**Fichier :** `src/components/community/EventBiodiversityTab.tsx`
- Ajouter `photoUrl: o.photo_url || undefined` (et conserver `inaturalist_observation_id` déjà présent) dans l'objet `attribution` construit pour chaque ligne `marcheur_observations`.
- Pour les attributions issues des snapshots iNat, normaliser un `photoUrl` à partir du champ existant du snapshot (`photoUrl`, `imageUrl`, `photo`, etc.) afin que les deux sources soient homogènes.

### 2. Étendre le type `AttributionLike`
**Fichier :** `src/utils/speciesIndividualCount.ts`
- Ajouter `photoUrl?: string | null` au type pour typer proprement.

### 3. Repenser le popup pour montrer la/les photo(s) du cluster
**Fichier :** `src/components/community/synthese/indices/SpeciesGpsDrawer.tsx`
Refondre le contenu du `<Popup>` (lignes 245-272) en une mini-fiche soignée :

```text
┌──────────────────────────────────┐
│ [Photo 1] [Photo 2] [Photo 3]    │  ← carrousel horizontal
│  ─────────────────────────────   │
│  N observation(s)                │
│  📅 14 mai 2026                  │
│  👤 laurencekarki                │
│  🔗 Voir sur iNaturalist ↗       │
└──────────────────────────────────┘
```

Détails :
- Si le cluster contient plusieurs observations, lister TOUTES les photos disponibles dans une bande horizontale scrollable (≈ 88×88 px chacune, coins arrondis, click → ouvre l'URL iNat de l'attribution correspondante dans un nouvel onglet).
- Si une seule photo : la montrer en plus grand (≈ 200×140 px).
- Conserver date la plus récente du cluster, l'observateur (ou "X observateurs" si plusieurs), et un lien iNat (le premier disponible).
- Élargir le popup (`min-w-[260px]`, `max-w-[320px]`) et adoucir typo + espacements pour rester cohérent avec la charte glassmorphism émeraude.
- Ajouter un fallback discret si aucune photo n'est disponible (icône 📷 grisée + libellé "Pas de photo").

### 4. Vérification visuelle
- Cluster mono-obs avec photo (Pêcher, Orchidée pyramidale Laurence) → grande vignette + métadonnées.
- Cluster multi-obs (les 3 orchidées proches) → 3 vignettes alignées.
- Cluster sans photo (rare, fallback iNat sans média) → libellé fallback, pas de cassure visuelle.

## Hors-périmètre
- Pas de modification de la base ni des Edge Functions (la donnée `photo_url` est déjà collectée par le backfill iNat).
- Pas de changement de la logique de clustering / des compteurs.
- Pas de modification de la timeline en bas du drawer (qui montre déjà la chronologie).
