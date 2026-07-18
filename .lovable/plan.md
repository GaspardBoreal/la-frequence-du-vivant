# Variété illimitée — chaque clic sur « Générer 4 propositions » doit puiser dans un pool renouvelé

## Diagnostic

Aujourd'hui, `pickPhotosDetailed` :
- récupère toujours les **20 snapshots les plus récents** (`order snapshot_date desc limit 20`) → mêmes espèces à chaque appel ;
- récupère les **150 dernières photos marcheurs** (`order created_at desc`) → mêmes clichés en tête ;
- ne mélange qu'à la **fin**, donc les mêmes ~80 photos ressortent et le shuffle final ne fait tourner que sur une petite tête.

Résultat : deux clics consécutifs proposent quasi-systématiquement les mêmes espèces vedettes et le même bandeau photo marcheur.

## Correctifs (frontend uniquement)

### 1. Élargir & randomiser les pools sources — `photoPicker.ts`

- **Espèces** : passer la limite snapshot de `20 → 60` et fusionner *tous* les snapshots retenus dans un pool d'espèces uniques (par `scientificName`), en gardant potentiellement plusieurs URLs par espèce (`photos[]` complet, pas seulement `photos[0]`). Cela multiplie le pool par ~5.
- **Photos marcheurs** : passer `150 → 400`, et ajouter un **offset aléatoire** (`range(offset, offset+400)`) pour puiser au-delà des dernières.
- **Photos officielles** : passer `80 → 300`.
- Ajouter un paramètre optionnel `excludeUrls: Set<string>` que `pickPhotosDetailed` filtrera avant le merge.

### 2. Rotation entre appels — mémoire côté `WallpaperStudio.tsx`

- Nouveau `useRef<Set<string>>(seenUrls)` qui accumule les URLs des 4 dernières générations.
- À chaque `handleGenerate`, passer `excludeUrls: seenUrls.current` à `pickPhotosDetailed`.
- Après génération, ajouter les URLs retenues au Set.
- Quand le Set couvre > 80 % du pool disponible (détecté par un shortfall répété), le **réinitialiser** avec un toast discret : « Tu as parcouru toutes les vues disponibles — on repart pour un nouveau cycle. »

### 3. Vraie randomisation, pas juste un shuffle final

- Dans `pickPhotosDetailed`, mélanger **chaque pool** (`speciesPool`, `walkerPool`, `officialPool`) **avant** le merge, puis piocher en round-robin (1 photo espèce, 1 marcheur, 1 officiel, 1 espèce…) plutôt qu'en concaténation. Cela garantit une composition différente même sans exclusion.
- Ajouter un `seed` optionnel (timestamp + index de génération) passé à un shuffle déterministe (mulberry32) pour que chaque variante d'un même clic reste distincte mais reproductible en debug.

### 4. Diversité des espèces dans une même mosaïque

- Quand plusieurs photos d'une même espèce existent, n'autoriser qu'**une seule occurrence par espèce et par proposition** (déjà partiellement fait via `seen` sur `scientificName`, à durcir : `seen` doit être par-proposition, pas cumulé pour toute la session).
- Pour la variante **Constellation** (qui affiche 8-9 vignettes), forcer une diversité `family` différente si possible.

### 5. UI — mini-indicateur

- Sous le bouton « Générer 4 propositions », afficher discrètement `Cycle 3 · 47 vues déjà vues` pour que l'utilisateur perçoive la fraîcheur du contenu à chaque clic.
- Ajouter un petit bouton « ↻ Repartir de zéro » qui vide le `seenUrls` immédiatement.

## Détails techniques

- Aucune migration DB nécessaire.
- Aucun changement de schéma des snapshots.
- Modifications : `src/components/wallpaper-studio/renderer/photoPicker.ts`, `src/components/wallpaper-studio/WallpaperStudio.tsx`.
- Perf : les nouvelles limites (`60 snapshots × ~50 espèces = 3000` avant dédup, `400 marcheurs`, `300 officielles`) restent sous les seuils de PostgREST et l'API renvoie le tout en < 500 ms côté marche unique.

## Vérification

- Cliquer 5 fois de suite « Générer 4 propositions » avec le même règne → chaque cycle propose au moins 12 photos nouvelles (0 doublon entre cycles consécutifs).
- Après ~10 cycles sur une petite marche : toast « nouveau cycle » et le pool redémarre proprement.
- Cliquer avec « Faune ailée » → les 4 variantes montrent 4 combinaisons différentes d'oiseaux/papillons.
