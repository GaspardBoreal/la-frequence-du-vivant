## Analyse

### Bug #2 (grave) — Espèces d'autres marches quand un événement est choisi
`marche_events` **n'a pas** de colonne `marche_id`. Or `photoPicker.ts` fait :
```ts
supabase.from('marche_events').select('marche_id').eq('id', eventId)
```
→ `marcheId` est toujours `null` → le filtre `.eq('marche_id', …)` n'est **jamais appliqué** ni sur `biodiversity_snapshots` ni sur `marche_photos`. Résultat : la banque puise dans **toutes les marches** de la base. C'est exactement ce que voit l'utilisateur sur POITIERS Blossac.

Le lien réel est : `marche_events.exploration_id` → `exploration_marches.exploration_id` → `exploration_marches.marche_id[]` (une exploration peut regrouper plusieurs marches). Les IDs de `biodiversity_snapshots.marche_id` pointent bien vers `marches.id`.

### Bug #1 — Aucun papillon en "Faune ailée"
Deux facteurs cumulés :
1. Le pool d'espèces est limité à `limit(60)` snapshots (les 60 plus récents). Les lépidoptères sont rares (~150 lignes sur 47 000). Statistiquement, ils tombent hors du top-60.
2. Quand on rate le filtre événement (bug #2), le pool est global mais les 60 dernières lignes sont souvent des oiseaux/insectes non-lépido. Une fois le bug #2 corrigé, le pool par événement sera encore plus petit → il faut fetcher **plus large** quand un règne est demandé.
3. La détection par `family` fonctionne (Lycaenidae/Libellulidae présents), mais la regex fallback FR est trop pauvre (rate azuré, vulcain, belle-dame, citron, machaon, paon-du-jour, tircis…).

## Corrections proposées — `src/components/wallpaper-studio/renderer/photoPicker.ts`

### 1. Résolution correcte marche(s) d'un événement
Nouvelle helper `async function resolveMarcheIds(eventId): Promise<string[]>` :
- Récupère `exploration_id` sur `marche_events`.
- Query `exploration_marches` filtré sur cet `exploration_id` → renvoie tous les `marche_id` associés (fallback vide → tableau vide).
- Cache in-memory par `eventId` pour éviter les allers-retours.

`fetchOfficialPhotos`, `fetchSpeciesPhotos` : remplacer `.eq('marche_id', mid)` par `.in('marche_id', ids)` (si `ids.length > 0`). Si `ids.length === 0`, **ne rien retourner** (plutôt que tout retourner) — c'est la garantie stricte "seul cet événement".

### 2. Pool plus large quand un règne est demandé
`fetchSpeciesPhotos` : passer `limit(60)` → `limit(kingdom === 'all' ? 60 : 250)` et, tant que `photos.length < 60`, continuer à parcourir. Ceci multiplie les chances de faire remonter des Lépidoptères/Odonates rares.

### 3. Enrichir la détection "Faune ailée" (fallback FR)
Étendre la regex `/papillon|lepidopt|odonat|libellul|abeille|bourdon|syrphe|hymenopt/i` à :
`/papillon|lepidopt|azur[ée]|vulcain|belle[- ]?dame|citron|machaon|paon[- ]?du[- ]?jour|tircis|myrtil|piéride|nacré|robert[- ]?le[- ]?diable|petit[- ]?nacré|amaryllis|demi[- ]?deuil|flambé|odonat|libellul|agrion|æschne|calopteryx|abeille|bourdon|syrphe|hymenopt/i`

Ajouter aussi la reconnaissance par **ordre** (`elem.taxonOrder`/`order`) : si `order === 'lepidoptera' | 'odonata'` → true.

### 4. Log de diagnostic
Ajouter dans le `console.debug('[wallpaper] species pool', …)` : `marcheIds.length` et un compte `familyLepidoptera` / `familyOdonata` pour rendre les régressions futures traçables.

## Hors périmètre
Pas de modification du canvas ni de l'UI Studio ; correctifs strictement dans `photoPicker.ts`.