# Bouton « Préparer upload iNat » — Onglet Contributions du marcheur

## Objectif

Permettre à un curateur (ambassadeur/sentinelle/admin) de générer en 1 clic, depuis l'onglet **Contributions** d'un marcheur, un **ZIP prêt pour iNaturalist** contenant toutes ses photos non encore identifiées, avec un CSV de métadonnées exploitable par l'import web iNat.

## Emplacement UI

Dans `MarcheursTab.tsx > ContributionsSubTab` (ligne 474), bandeau du haut, à droite du toggle « Mes photos » :

```text
[🌿 9 espèces identifiées · 5 avec photo perso]   [Mes photos (5)]   [⬇ Préparer upload iNat]
```

- Visible uniquement si l'utilisateur a un rôle de curation (`useCanCurateMarcheurs` / `useCrmRole` admin).
- Désactivé si aucune photo « à identifier » n'est trouvée.
- Style : bouton `glass` ou `outline` discret, icône `Upload` (lucide).

## Comportement

Au clic, un **Drawer** s'ouvre avec :

1. **Récapitulatif scan** — pour le marcheur courant, sur le périmètre de l'exploration :
   - Total photos perso (marcheur_medias + marcheur_observations.media_url)
   - Photos déjà liées à une espèce identifiée (à exclure)
   - Photos « à identifier » (candidates pour iNat)
   - Répartition GPS : ✅ avec EXIF / ⚠️ héritera des coords de la marche / 🔴 sans GPS et marche sans coords

2. **Liste paginée des candidates** — vignette + date + statut GPS + marche d'origine. L'utilisateur peut décocher individuellement.

3. **Options d'export** :
   - Tag iNat à injecter dans `description` : `observateur:{slug-marcheur}` (pré-rempli depuis `slugGenerator`)
   - Date par défaut : EXIF si présent, sinon date de la marche
   - GPS fallback : coordonnées de la marche (toggle ON/OFF)

4. **Bouton « Générer le ZIP »** :
   - Télécharge `inat-upload-{slug-marcheur}-{date}.zip` contenant :
     - `photos/IMG_001.jpg`, `IMG_002.jpg`…
     - `observations.csv` avec colonnes attendues par l'import iNat :
       `image,observed_on,latitude,longitude,positional_accuracy,description,tag_list`
     - `README.txt` court : « Glissez `observations.csv` + dossier `photos/` dans iNaturalist > Upload »

## Détails techniques

### Nouveau hook : `src/hooks/useMarcheurUnidentifiedPhotos.ts`
- Input : `crewId | resolvedUserId, aliases[], explorationMarcheIds[]`
- Source des photos :
  - `marcheur_medias` (type_media = 'photo', filtré sur user_id + alias matching NFD comme dans `useMarcheurAttributedSpecies`)
  - `marcheur_observations` (media_url) si non lié à une espèce identifiée
- Exclusion : tout media déjà attaché à une `species_scientific_name` non null/non vide ET présent dans le pool d'espèces du marcheur (réutiliser le résultat de `useMarcheurAttributedSpecies`)
- Enrichissement client : extraction EXIF GPS/date via `src/utils/mediaMetadata.ts` (`extractMediaMetadata`) déjà existant, en lazy (au moment de l'ouverture du drawer)
- Récupération coords marche : `marche_events.lat/lng` déjà chargés via `explorationMarcheIds`

### Nouveau composant : `src/components/community/exploration/InatUploadPrepDrawer.tsx`
- Sheet shadcn (mobile-friendly)
- Liste virtualisée si > 50 photos
- Génération ZIP côté client avec **JSZip** (déjà utilisé par `generate-pack-vivant` côté edge — vérifier présence frontend, sinon ajouter)
- Téléchargement des images via `fetch` + `blob()` (les URLs Supabase Storage sont publiques)
- Génération CSV avec échappement standard

### Modifications minimales
- `MarcheursTab.tsx` : ajouter le bouton + état d'ouverture du drawer dans `ContributionsSubTab`
- Pas de changement back/RPC/edge function : 100% frontend, lecture seule

## Sécurité / RLS

- Aucune RPC nouvelle. Le hook lit `marcheur_medias` / `marcheur_observations` via les policies existantes (les curateurs y ont déjà accès).
- Le tag `observateur:{slug}` réinjecté permettra au `snapshot-attribution-backfill-trigger` existant de ré-attribuer automatiquement les obs iNat au marcheur lors du prochain sync.

## Hors-scope (phase 2, déjà mentionnée par l'utilisateur)

- Panel « Réattribution rapide » post-import iNat
- Tool global `Outils → Photos GPS`
- Édition manuelle des coordonnées GPS dans le drawer (pour cette V1, fallback = coords de la marche uniquement)

## Mémoire à enregistrer après build

- `mem://features/community/inat-upload-prep-logic` — flow, sélection des candidates, format CSV, convention `observateur:{slug}`
