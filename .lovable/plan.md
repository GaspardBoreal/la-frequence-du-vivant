## Objectif

Dans « J'analyse » → Imprimer → **Cahier complet**, ajouter après la page du tableau de synthèse « Le sol, point par point » (section `p3` de `AnalyzeSummary`) une ou plusieurs planches A4 de photos de terrain, groupées par test, 12 vignettes maximum par page, date en petit sous chaque vignette.

## Ce qui est en place (vérifié)

- Les médias sont en base dans `propriete_test_medias` et lus par `usePropertyTestMedias(proprieteId)` qui renvoie déjà une **URL signée 1 h** par média (`url`) — directement utilisable dans le rendu d'impression.
- Le catalogue `soilTestCatalog.ts` fournit l'ordre canonique des 9 tests (bêche, stabilité, boudin, sédimentation, bandelette, pHmètre, bêche vivante, vinaigre, sachet) et une couleur d'accent par bloc.
- `CombinedPrintLayout` insère les pages d'étapes via `insertBeforeColophon` + `insertedPageCount` (pagination totale). La page `p3` (registre + « Le sol, point par point ») est la dernière page « J'analyse ».

## Réalisation

**1. Nouveau composant `src/components/propriete/analyze/print/TestMediaPrintPlates.tsx`**
- Entrée : la liste des médias + le nom de la propriété.
- Filtre : uniquement les **photos** (les vidéos n'ont pas d'image imprimable ; elles seront comptées dans une mention « + 2 vidéos » sous le titre du test concerné).
- Tri : par test dans l'ordre du catalogue, puis par emplacement (A→E), puis par date de prise de vue/upload.
- Pagination : découpage en pages de **12 vignettes** (grille 4 × 3 en A4 portrait). Un test ne partage jamais une page avec un autre test : chaque test démarre une nouvelle planche ; s'il a plus de 12 photos, il continue sur une planche « (suite) ».
- Chaque planche : filet de couleur du bloc, sur-titre « Preuves de terrain », titre du test, compteur (« 7 photos · 3 emplacements »).
- Chaque vignette : image en `object-fit: cover` dans un cadre carré bordé façon papier, pastille de l'emplacement (A, B…) en coin, et sous la photo, en petit : **date (jj/mm/aaaa)** + emplacement, puis la légende si elle existe (une ligne, tronquée).

**2. Styles d'impression** dans `src/index.css` (bloc `@media print` existant) : classe `.combined-print-plate` alignée sur `.portrait-print-page` (format A4, marges, `break-after: page`), grille vignettes, typographie des légendes, `print-color-adjust: exact` pour les accents.

**3. Branchement**
- `TabAnalyze.tsx` : appeler `usePropertyTestMedias(proprieteId)` et passer `testMedias` à `CombinedPrintLayout`.
- `CombinedPrintLayout.tsx` : rendre les planches juste après la section `printSection="p3"`, et ajouter leur nombre à `insertedPageCount` pour que la numérotation « x / y » reste juste.
- Le cas « J'analyse seul » (`AnalyzePrintLayout`) reste inchangé, conformément à la demande.

## Détails techniques

- Les URL signées sont générées au chargement de l'onglet ; si l'impression a lieu plus d'une heure après, elles expirent. Le composant d'impression déclenchera donc un `refetch` du hook à l'ouverture de la boîte d'impression pour garantir des URL fraîches.
- Attente du décodage des images avant l'appel `window.print()` (`img.decode()` / `complete`), sinon Chrome imprime des cadres vides.
- Aucune modification du schéma de base ni des règles d'accès.
