## Problème

Dans « 2 · Carte des révélations », les pastilles de filtre (Flore · 250, Faune · 173, Champignons · 5) et le compteur de droite (459 obs.) comptent des **points d'observation**, alors que le bandeau du haut « Empreinte biodiversité mesurée ici » compte des **espèces distinctes** (230 · 104 Flore · 100 Faune · 3 Champignons · 23 Autres).

Vérifié dans le code : `RevealMapBlock.tsx` fait `for (const w of filtered) counts[...]++` sur les waypoints, et affiche `filtered.length`. Le bandeau du haut passe lui par `usePropertySpeciesCount`, qui déduplique par nom scientifique normalisé (NFD, minuscules) et normalise le règne via `normalizeKingdom`.

## Correction

Dans `src/components/propriete/identify/blocks/RevealMapBlock.tsx` uniquement :

1. Remplacer le calcul `stats` par une déduplication par nom scientifique normalisé, avec **exactement la même normalisation** que `usePropertySpeciesCount` (NFD + suppression des diacritiques + lower + trim) et le même `normalizeKingdom` de `@/lib/kingdomLabels` (au lieu du `kingdomFrom` local ad hoc). Règle identique : un règne identifié l'emporte sur « autres » si la même espèce apparaît sous deux règnes.
2. Les pastilles affichent le nombre d'espèces distinctes du règne, calculé **avant** le filtre de règne mais **après** le filtre « bio-indicatrices », pour que les chiffres restent stables quand on change de règne (comportement actuel).
3. Le compteur de droite devient le nombre total d'espèces distinctes visibles, libellé « espèces » au lieu de « obs. ». Le nombre d'observations reste indiqué en second, plus discret (ex. `128 espèces · 459 obs.`), pour ne pas perdre l'information.
4. Ajouter la pastille « Autres » (règne `others`) pour aligner la nomenclature sur les 4 règnes du bandeau du haut.
5. Les couleurs des marqueurs sur la carte sont mappées sur les clés `normalizeKingdom` pour rester cohérentes.

## Note

Les chiffres de la carte resteront inférieurs à ceux du bandeau du haut : la carte n'affiche que les observations **géolocalisées**, alors que le bandeau compte toutes les espèces de la propriété. La méthode de comptage sera identique, mais le périmètre reste celui des points cartographiés. Aucun changement de données ni de RPC.
