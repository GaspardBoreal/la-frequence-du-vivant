## Diagnostic

En mode **Paysage** sur un événement précis (POITIERS Maison Sous Blossac), le pool est famélique parce que le picker ignore les deux sources visibles dans l'app marcheurs :

1. **Convivialité (8 photos)** — stockées dans `exploration_convivialite_photos` (scopées par `exploration_id`). Le picker ne les interroge pas du tout.
2. **Marche → Voir (3 photos)** — stockées dans `marche_photos` (scopées par `marche_id`). Déjà interrogées, mais mélangées à peu de choses.
3. **Photos marcheurs** — `fetchWalkerPhotos` filtre `is_public = true` + `marche_event_id = eventId`. Or beaucoup d'obs sont rattachées via `marche_id`, pas `marche_event_id`, et `is_public` élimine la majorité du corpus. Résultat : pool quasi vide → générateur retombe sur des macros d'espèces.

## Évolution proposée (fichier unique : `src/components/wallpaper-studio/renderer/photoPicker.ts`)

### 1. Nouvelle source convivialité
- Ajouter `fetchConvivialitePhotos(explorationId)` qui lit `exploration_convivialite_photos` (filtre `is_hidden = false`, tri `position, created_at`, limite 300).
- Résoudre `explorationId` depuis `eventId` via le cache déjà en place (`resolveMarcheIds` fait déjà le lookup — on ajoute `resolveExplorationId`).

### 2. Élargir la source marcheur_medias
- Étendre la clause de scoping : `.or('marche_event_id.eq.<eventId>,marche_id.in.(<marcheIds>)')` pour rattraper les obs liées via `marche_id`.
- Supprimer le filtre `is_public = true` quand on est scopé à un événement (RLS reste garant, et sur événement les photos partagées à l'exploration doivent apparaître). Conserver `is_public = true` uniquement en mode "toute la Fréquence".
- Ambiance : conserver `inAmbiance` (déjà tolérant si pas d'EXIF).

### 3. Rééquilibrage des pools pour Paysage/Mosaïque marcheurs
- `landscape` → ordre : **officiel → convivialité → marcheur_medias → espèces** (espèces en dernier recours pour éviter les macros).
- `walkers` → ordre : **convivialité → marcheur_medias → officiel → espèces**.
- `territory` → inchangé (officiel prime).
- `species` → inchangé.

### 4. Instrumentation
- Étendre le log `[wallpaper] pickPhotos` avec `convivialitePool` pour vérifier immédiatement l'effet.

## Résultat attendu
Sur POITIERS Blossac en Paysage : pool ≈ 3 (marche_photos) + 8 (convivialité) + N (marcheur_medias par marche_id) = ~15+ paysages authentiques, plus les cycles de rotation existants deviennent réellement variés.
