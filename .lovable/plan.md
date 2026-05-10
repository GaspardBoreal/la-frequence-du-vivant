## Diagnostic (data réelle de l'exploration)

Sur l'exploration `20dd3be8…`, Laurence Karki a **5 observations** dans `marcheur_observations` (issues du backfill iNaturalist) :
- Flavoparmelia caperata, Helichrysum, Lotus corniculatus, Pisaura mirabilis, Sphaeroderma rubidum.

L'espèce que tu viens d'ouvrir (la **Consoude / Symphytum officinale** dans la capture) **n'est dans aucune de ses observations** → c'est pour ça qu'on ne voit que la référence iNat. Aucune photo marcheur n'existe pour cette espèce dans la base.

**Et pour les 5 espèces où Laurence a une photo**, second souci : son `photo_url` pointe vers `inaturalist-open-data.s3.amazonaws.com/photos/…` (URL iNat, héritée du backfill). Notre dédup actuelle (`if slides.some(s => s.url === url) return;`) supprime alors la slide "Référence" puisqu'on push d'abord la marcheur — résultat : on voit la photo, mais elle est étiquetée "Photo · Laurence" sans qu'on sache que c'est aussi la photo iNat. Visuellement on ne perçoit pas la "comparaison".

## Plan

### 1. Élargir les sources "Photos terrain" (hook `useSpeciesMarcheurPhotos`)

Aujourd'hui : uniquement `marcheur_observations` filtré sur `exploration_marcheurs` (3 marcheurs éditoriaux max).

À ajouter, fusionnés en un seul résultat trié par date desc :
- **a. Snapshots iNat de l'événement** (`event_biodiversity_snapshots` ou équivalent) : toute observation citoyenne dans le périmètre, avec photo + nom de l'observateur iNat → badge **"Observation citoyenne · {observer}"** (teinte cyan, distincte du marcheur éditorial vert et de la référence taxon bleue).
- **b. Médias `medias`** liés aux marches de l'exploration dont l'EXIF / tag pointe vers cette espèce (cas des photos uploadées par les marcheurs dans Convivialité avec un tag espèce).

### 2. Corriger la déduplication (composant `SpeciesPhotoCarousel`)

Au lieu de **supprimer** un doublon d'URL, **fusionner** les métadonnées :
- une slide unique avec **deux badges empilés** : `Référence · iNaturalist` + `Photo · Laurence Karki`
- footer date + marche + lien Source iNat conservé
- Évite la perception "je ne vois qu'une photo, où est l'autre ?"

### 3. État vide explicite (UX)

Si aucune photo "terrain" trouvée pour l'espèce :
- afficher sous le hero une **bandelette** discrète :
  > *"Pas encore de photo prise par un marcheur sur cette espèce. Sois le premier à la documenter lors de ta prochaine marche."*
- avec un CTA secondaire vers `/marches-du-vivant/contribuer` (si rôle marcheur).

### 4. Toggle segmenté plus pédagogique

Renommer le toggle :
- "Référence taxon" (bleu, photo officielle de l'espèce)
- "Sur le terrain ({n})" (vert/cyan, photos prises dans le périmètre de l'exploration)

Et ajouter un compteur précis par source dans les pastilles.

### 5. QA / vérification

Tester sur 3 cas :
1. **Symphytum officinale** (aucune photo terrain) → état vide affiché.
2. **Lotus corniculatus** (photo Laurence avec URL iNat) → slide unique avec **double badge** Référence + Marcheur.
3. Une espèce avec photo `medias` (storage Supabase) **et** photo Laurence iNat → 2 slides distinctes, toggle visible.

## Fichiers concernés

- `src/hooks/useSpeciesMarcheurPhotos.ts` — étendre aux snapshots iNat + médias liés.
- `src/components/biodiversity/SpeciesGalleryDetailModal.tsx` — fusion par URL au lieu de dédup, état vide.
- `src/components/biodiversity/species-modal/SpeciesPhotoCarousel.tsx` — double badge, libellés du toggle, bandelette vide.
- `mem://features/community/species-card-carousel-and-chat-logic.md` — documenter la fusion multi-sources.

## Hors scope

- Vue split-screen côte-à-côte référence/terrain (proposable plus tard).
- Vote "ressemble / ne ressemble pas" sur la concordance.
- Upload direct de photo depuis la fiche espèce.
