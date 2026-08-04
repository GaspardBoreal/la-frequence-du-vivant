# Classer les preuves de terrain dans l'ordre voulu

## Constat

Les « Preuves de terrain » (photos/vidéos attachées à un prélèvement × test de sol) sont stockées dans `propriete_test_medias`. La colonne `order_index` existe déjà mais n'est jamais utilisée : à l'upload elle reçoit une valeur dérivée de l'horodatage, et toutes les lectures trient par `created_at`. Aucun écran ne permet de réordonner.

À l'inverse, le carnet photo des ouvrages possède déjà un réordonnancement complet (glisser-déposer + RPC atomique `reorder_propriete_objet_photos`). On reprend exactement ce modèle, sans rien changer d'autre.

## Ce qu'on met en place

1. **Un ordre unique, décidé par l'utilisateur**, appliqué partout où ces preuves apparaissent :
   - le tiroir de saisie « Preuves de terrain » (celui de la capture),
   - la bande de preuves de la Fiche carotte (prélèvement),
   - le registre des preuves (vue filtrable),
   - la visionneuse plein écran (navigation ← / → dans le même ordre),
   - les planches imprimées des preuves de terrain (rapport combiné et impressions du sol).

2. **Le geste de classement** : dans le tiroir de saisie, chaque vignette devient déplaçable par glisser-déposer (poignée visible au survol, retour visuel pendant le déplacement, ordre sauvegardé automatiquement à la dépose). Sur mobile, deux petites flèches « avancer / reculer » sur la vignette assurent le même résultat au doigt. L'ordre est numéroté sur la vignette (1, 2, 3…) pour lever toute ambiguïté avec l'impression.

3. **Portée du classement** : l'ordre est propre à chaque couple prélèvement × test — c'est l'unité de saisie et l'unité d'impression. Les listes transverses (registre, planches) respectent cet ordre à l'intérieur de chaque groupe, l'ordre entre groupes restant celui des tests puis des prélèvements.

4. **Lecture seule** : quand l'utilisateur n'a pas les droits de curation, les vignettes ne sont pas déplaçables mais l'ordre choisi est bien respecté.

## Détails techniques

- **Migration** : RPC `public.reorder_propriete_test_medias(_propriete_id uuid, _sample_id text, _test_id text, _ids uuid[])`, `SECURITY DEFINER`, contrôle d'accès via `can_curate_propriete_parcelles(_propriete_id)`, mise à jour de `order_index` par `unnest`/`generate_subscripts`. `GRANT EXECUTE ... TO authenticated, service_role`. Normalisation en une passe des `order_index` existants (rang par groupe, tri `created_at`) pour partir d'un état propre.
- `src/hooks/propriete/usePropertyTestMedias.ts` :
  - lecture triée `order_index` puis `created_at`,
  - upload : `order_index = max(order_index du groupe) + 1` au lieu de la valeur horodatée actuelle,
  - nouvelle mutation `reorder({ sampleId, testId, ids })` avec mise à jour optimiste du cache (même schéma que `useObjetPhotos.reorder`).
- `src/components/propriete/analyze/media/TestMediaDrawer.tsx` : grille des vignettes passée sous `@dnd-kit` (déjà utilisé dans le projet), poignée + flèches mobiles + badge d'index ; désactivé si `readOnly`.
- `src/components/propriete/analyze/media/TestMediaRegistry.tsx` : remplacer le tri `created_at` décroissant par le tri `order_index` (à date/filtre égal), la visionneuse héritant de la liste filtrée.
- `src/components/propriete/analyze/sample/SampleCoreDrawer.tsx` : `mediasFor()` renvoie les médias déjà triés par `order_index`.
- `src/components/propriete/analyze/print/TestMediaPrintPlates.tsx` : dans `buildTestMediaPlates`, le tri secondaire par date est remplacé par `order_index` (le regroupement par test puis prélèvement est conservé). `CombinedPrintLayout` en hérite sans modification.
- Aucun autre module touché : le carnet photo des ouvrages et les photos de chantier gardent leur logique actuelle, déjà ordonnée.

## Hors périmètre

Réordonnancement des photos d'ouvrage / de chantier (déjà en place), et toute modification des écrans de diagnostic.
