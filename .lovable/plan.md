# Plan — Aligner l'affichage des espèces sur /m/:slug avec « Mon Espace → Taxons observés »

## Diagnostic

Aujourd'hui, sur `/m/:slug` (page publique d'un événement), la grille des espèces est **rendue de façon ad-hoc dans `src/pages/PublicEventPage.tsx` (lignes 454-487)** :

- balise `<img src={sp.photo_url}>` brute, sans cascade « photo terrain marcheur → iNaturalist »,
- pas d'état de chargement, pas de gestion d'erreur d'image,
- pas de badge source (📸 marcheur / iNat),
- pas de toggle « Photos marcheurs ↔ iNat »,
- pas de fiche espèce cliquable.

Dans Mon Espace → Biodiversité → **Taxons observés**, la même grille utilise déjà un composant **partagé, haute qualité** :
`SpeciesExplorer` → `SpeciesGalleryCard` (photo terrain prioritaire, fallback iNat, overlay dégradé, badge source, ouverture drawer), piloté par le contexte `SpeciesPhotoModeContext` (toggle marcheur/iNat).

Le problème est donc **exclusivement de la duplication de code** : on a réécrit à la main, en moins bien, ce que fournit déjà `SpeciesGalleryCard`.

## Objectif

Sur `/m/:slug`, réutiliser **strictement** les composants Mon Espace pour la section « Espèces observées » :
1. cartes `SpeciesGalleryCard` (aspect-carré, cascade photo, overlay, badge source, chargement / erreur),
2. toggle « Photos marcheurs ↔ iNaturalist » visible aussi pour les visiteurs publics,
3. clic → ouverture de la fiche espèce (drawer déjà utilisé dans Mon Espace).

Aucune régression sur la mise en page globale de la page publique (hero, autres onglets, footer inchangés).

## Étapes

### 1. Adapter les données publiques au format attendu par `SpeciesGalleryCard`

`SpeciesGalleryCard` attend un objet espèce type Mon Espace (`scientificName`, `kingdom`, `observationCount`, etc.), alors que `usePublicEventBiodiversity` renvoie `{ scientific_name, common_name, photo_url, observations_count, has_walker_observation }` (voir `src/hooks/usePublicEvent.ts`).

→ Créer un petit **adapter pur** (`src/components/public-event/adaptPublicSpecies.ts`) qui convertit le format public vers le format attendu par `SpeciesGalleryCard`, en préservant `photo_url` comme photo terrain candidate quand `has_walker_observation` est vrai. Zéro logique métier ajoutée, juste un mapping de champs.

### 2. Nouveau composant `PublicEventSpeciesGrid`

Fichier : `src/components/public-event/PublicEventSpeciesGrid.tsx`

- Reçoit `species: PublicEventBiodiversitySpecies[]` en prop.
- Enveloppe le rendu dans `<SpeciesPhotoModeProvider>` (contexte du toggle) pour que la page publique soit **autonome** vis-à-vis de Mon Espace.
- Affiche en en-tête le composant toggle existant (`SpeciesPhotoModeToggle` ou équivalent utilisé dans Mon Espace) — même look, même libellés.
- Rend la grille `grid-cols-2 sm:grid-cols-3 lg:grid-cols-4` et map chaque item vers `<SpeciesGalleryCard species={adapted} onClick={openDrawer} />`.
- Gère l'état `selectedSpecies` local et monte `SpeciesDetailDrawer` (le même que Mon Espace) en mode lecture publique.

### 3. Remplacement dans `PublicEventPage.tsx`

- Retirer les lignes 454-487 (grille inline + import `Leaf` si plus utilisé).
- Insérer `<PublicEventSpeciesGrid species={biodiversity.species} />` à la même place.
- Conserver le titre de section, le compteur d'espèces et le lien « voir plus » existants.

### 4. Vérifications avant / après

- Vérifier que `SpeciesPhotoModeContext`, `useSpeciesPhoto`, `SpeciesGalleryCard` et `SpeciesDetailDrawer` **n'ont aucune dépendance à `useAuth`** (sinon les envelopper d'un fallback lecture-seule). Si une dépendance auth existe, court-circuiter proprement côté visiteur anonyme (mode « lecture publique »).
- Vérifier que les photos terrain marcheurs restent accessibles sans session (RLS des buckets `marcheur_media`). Si non : soit exposer via URL publique déjà générée côté RPC, soit ne montrer que iNat pour les visiteurs non connectés.
- Test manuel sur `/m/laboratoire-a-ciel-ouvert-biodiversite-sols-vivants-2026-07-07` : grille identique visuellement à Mon Espace, toggle fonctionnel, drawer ouvrable.

## Détails techniques

- **Fichiers créés** :
  - `src/components/public-event/PublicEventSpeciesGrid.tsx` (composant orchestrateur)
  - `src/components/public-event/adaptPublicSpecies.ts` (adapter de type)
- **Fichiers modifiés** :
  - `src/pages/PublicEventPage.tsx` (retire ~35 lignes ad-hoc, ajoute 1 import + 1 balise)
- **Fichiers réutilisés tels quels (aucune modification)** :
  - `src/components/biodiversity/SpeciesGalleryCard.tsx`
  - `src/contexts/SpeciesPhotoModeContext.tsx` + toggle associé
  - `src/hooks/useSpeciesPhoto.ts`
  - `SpeciesDetailDrawer` (celui utilisé par `SpeciesExplorer`)
- **Pas de changement** : `usePublicEventBiodiversity`, RPC Supabase, RLS, edge functions, autres onglets de la page publique, header/footer.

## Résultat attendu

Le visiteur public d'un événement voit **exactement** la même qualité de vignettes que le marcheur connecté dans son espace :

- photo terrain marcheur affichée en priorité quand elle existe,
- sinon photo de référence iNaturalist,
- badge source discret,
- overlay dégradé au survol,
- toggle « Photos marcheurs ↔ iNaturalist »,
- clic → fiche espèce détaillée.

Et surtout : **une seule source de vérité** pour ce composant, mainenu à un seul endroit (`SpeciesGalleryCard`).
