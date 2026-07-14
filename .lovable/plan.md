## Problème

Sur `/m/:slug`, les photos "marcheurs" sont floues alors qu'elles sont nettes dans Mon Espace → Biodiversité → Taxons observés.

**Cause racine** : `PublicEventSpeciesGrid` construit une Map de photos terrain à partir du RPC public (`PublicSpecies.photo_url`), qui ne contient qu'**une seule URL par espèce**, souvent en résolution vignette (issue de `species_thumb_cache` ou d'un snapshot iNat en `square`). L'app Marcheurs, elle, appelle `useExplorationFieldPhotos(explorationId)` qui lit **directement** `marcheur_observations.photo_url` (résolution originale du storage) et upgrade les URLs iNat de `square` → `medium`.

## Correctif (frontend uniquement, factorisation stricte)

Réutiliser exactement le même hook que l'app Marcheurs sur la page publique, puisque `PublicEvent.exploration_id` est déjà disponible.

### 1. `src/components/public-event/PublicEventSpeciesGrid.tsx`
- Ajouter prop `explorationId?: string | null`.
- Supprimer la construction et le passage de `fieldPhotosOverride` (photos terrain basse résolution).
- Passer `explorationId` directement à `<SpeciesPhotoModeProvider explorationId={…}>` → le provider utilisera `useExplorationFieldPhotos`, exactement comme dans Mon Espace, avec les URLs pleine résolution du storage marcheur + upgrade `square→medium` pour iNat.
- Conserver `buildPublicFieldPhotosMap` en fallback uniquement si `explorationId` est absent (rare, backward-compat).
- Recalculer `photoModeCounts.marcheur` à partir de la Map réelle du provider (via `useSpeciesPhotoMode`) au lieu du flag `has_walker_observation` du RPC. Extraire un petit sous-composant interne `<Grid>` pour pouvoir consommer le contexte.

### 2. `src/components/public-event/adaptPublicSpecies.ts`
- Dans `adaptPublicSpeciesToBiodiversity`, upgrader l'URL iNat de fallback (`photo_url`) en remplaçant `/square.` par `/medium.` (même règle que `useExplorationFieldPhotos`) pour que la vignette iNat soit également nette quand aucune photo marcheur n'existe.

### 3. `src/pages/PublicEventPage.tsx`
- Passer `explorationId={event.exploration_id}` à `<PublicEventSpeciesGrid>`.

## Détail technique

- **RLS** : `marcheur_observations`, `exploration_marches`, `exploration_marcheurs`, `biodiversity_snapshots` sont déjà lus par le hook depuis Mon Espace côté user connecté. Vérifier rapidement que ces tables ont bien une policy `SELECT` publique/anon pour un événement publié ; sinon, le hook ne trouvera rien côté public et il faudra soit ajouter des policies dédiées `exploration.is_public`, soit créer un RPC public équivalent. **À valider avant l'implémentation** — si RLS bloque, on tombe sur le plan B : nouveau RPC `get_public_event_field_photos(_event_id)` renvoyant la même forme `MarcheurSpeciesPhoto[]` par espèce, appelé via un `fieldPhotosOverride` toujours branché.

## Résultat attendu

Grille publique = grille Mon Espace : mêmes composants, mêmes URLs, même netteté, toggle Marcheurs/iNat avec compteurs exacts.
