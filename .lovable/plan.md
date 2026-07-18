# Bug — aucun oiseau/papillon quand on choisit « Faune ailée »

## Diagnostic (vérifié sur la base)

En inspectant `biodiversity_snapshots.species_data`, chaque espèce a la forme :

```
{ scientificName, commonName, iconicTaxon: "Aves", family: "Columbidae",
  photoData: { url: "...square.jpg" }, photos: ["...square.jpg", ...] }
```

Le picker actuel (`src/components/wallpaper-studio/renderer/photoPicker.ts`) lit :

```ts
const url = s.photoUrl || s.photo_url; // ⇒ toujours undefined
```

Ces champs n'existent pas dans les snapshots. **Résultat : le pool « espèces filtrées par règne » est toujours vide**, donc :

- pour la catégorie **Empreinte territoire** (celle choisie sur la capture), le règne ne peut pas être appliqué — seuls les pools `marche_photos` et `marcheur_medias` remontent, qui ne sont pas taggués par espèce → aucun oiseau/papillon garanti ;
- même en catégorie **Espèce vedette**, le filtre Faune ailée renvoie 0 photo et déclenche le fallback « tout le vivant » → l'utilisateur voit à nouveau de la flore.

Deuxième point : le matcher `winged` pour les insectes n'utilise que le `commonName` avec une regex `papillon|lepidopt|odonat|hymenopt`. Les données ont un champ `family` fiable (`Nymphalidae`, `Pieridae`, `Libellulidae`, `Apidae`…) qui n'est jamais consulté.

## Correctifs (frontend uniquement, `photoPicker.ts`)

1. **Extraction URL robuste** dans `fetchSpeciesPhotos` :
   ```
   url = s.photoData?.url || s.photos?.[0] || s.photoUrl || s.photo_url
   ```
   + normalisation `square/small → medium` déjà en place.

2. **Matcher `winged` élargi** — utiliser aussi `family` :
   - oiseaux : `iconicTaxon === 'aves'`
   - papillons : `family` ∈ liste Lepidoptera (Nymphalidae, Pieridae, Papilionidae, Lycaenidae, Hesperiidae, Sphingidae, Saturniidae, Erebidae, Noctuidae, Geometridae…)
   - libellules : Odonata (Libellulidae, Aeshnidae, Coenagrionidae, Calopterygidae…)
   - abeilles/guêpes emblématiques : Apidae, Vespidae, Syrphidae (survol floral)
   - garde la regex `commonName` en filet de sécurité.

3. **Priorité des pools quand `kingdom !== 'all'`** :
   Toutes catégories confondues, mettre `fetchSpeciesPhotos(kingdom)` **en tête** du merge, et ne compléter avec `walker`/`official` que si le pool espèces < `count`. Aujourd'hui pour Territoire/Paysage/Mosaïque, les photos génériques sont ajoutées avant et saturent le mélange.

4. **Fallback plus honnête** : si après filtrage < 3 photos du règne demandé sont trouvées :
   - garder les quelques photos du règne trouvées ;
   - compléter avec le pool général **mais** afficher un toast discret dans `WallpaperStudio.tsx` : « Peu d'observations de faune ailée pour cette sélection — mosaïque enrichie avec des scènes du territoire. » (au lieu du silence actuel).

5. **Log de diagnostic** (console.debug) : nombre de photos par pool et par règne, pour faciliter le support futur.

## Détails techniques

- Aucun changement de schéma DB, aucune migration.
- Aucune modification du renderer canvas ni de l'UI wizard — seuls `photoPicker.ts` (logique) et `WallpaperStudio.tsx` (toast de fallback) sont touchés.
- Les 4 variantes (Editorial/Organic/Diptyque/Constellation) profitent automatiquement du pool corrigé.

## Vérification après build

- Sélection **Empreinte territoire + Faune ailée + Nuit** → au moins 3 vignettes d'oiseaux/papillons visibles dans les 4 propositions.
- Sélection **Espèce vedette + Champignons** → mycètes uniquement (bonus, même correctif d'extraction URL).
- Sélection **Flore** → inchangée.
