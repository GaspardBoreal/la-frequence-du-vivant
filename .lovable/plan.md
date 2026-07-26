## Objectif

Reproduire pour **4 · A — Test du boudin** l'expérience vidéo déjà en place sur **3 · A — Test de la bêche** (étagère dépliable, miniatures YouTube, lightbox, marquage « vue »).

## Ce qui existe aujourd'hui

- `structureTests.ts` : le test `beche` porte 3 vidéos avec `label`, `url` et `angle` (le « regard » de chaque source).
- `StructureProtocolCard.tsx` affiche `<TestVideoShelf storageKey={'structure-'+id} …/>`.
- Côté texture : `textureTests.ts` a `videos: []` (vides) et `TextureProtocolCard.tsx` n'affiche que de simples pastilles-liens `<a>` — pas l'étagère.

## Modifications

1. **`src/components/propriete/analyze/textureTests.ts`**
   - Étendre le type `videos` avec `angle?: string` (comme structure).
   - Renseigner les 3 vidéos sur le test `boudin` :
     - Le Jardin Potager Du Bonheur — `https://youtu.be/rT8PNkjz638` — angle : le regard jardinier, le geste au potager.
     - Les Artisans du Végétal — `https://youtu.be/k_pBT9uRrnE` — angle : le regard professionnel, lecture des classes de texture.
     - Potager Durable (Nicolas) — `https://youtu.be/yT2zU3gtmPs` — angle : le regard pédagogique, interpréter le résultat.
   - Le test `sedimentation` reste sans vidéo.

2. **`src/components/propriete/analyze/TextureProtocolCard.tsx`**
   - Remplacer le bloc de pastilles `<a>` par `<TestVideoShelf storageKey={`texture-${test.id}`} videos={videos} title="Voir le geste" />`.
   - Supprimer l'import `Play` devenu inutile, ajouter l'import de `TestVideoShelf`.

Aucun changement de logique métier, de base de données ni d'impression : uniquement présentation.
