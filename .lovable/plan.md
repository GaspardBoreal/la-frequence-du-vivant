## Objectif

Créer une page d'introduction pleine page pour **Étape 1 · J'observe**, du même niveau de soin que celle déjà en place pour Étape 2 (« J'analyse le sol »), insérée **après le Portrait du site** et **avant les contenus de l'étape 1**.

## Ce qui existe aujourd'hui

Dans `CombinedPrintLayout.tsx`, un composant interne `Divider` produit la page d'intercalaire (bandeau ÉTAPE, titre serif italique, filet doré, citation, pied « Propriété · Fréquence du Vivant »), stylé par les classes `.combined-print-divider*` de `src/index.css`. Il n'est utilisé qu'une fois, juste avant les pages de l'étape 2. Les pages de l'étape 1 démarrent donc directement après la page « Propriété », sans intercalaire.

## Travaux

1. **Intercalaire Étape 1**
   - Insérer un `Divider` en tête du bloc `observeSlot`, avant la première page `ObserveSummary` :
     - eyebrow : `Étape 1`
     - titre : `J’observe`
     - citation : « Avant de comprendre, il faut regarder longtemps. »
     - pied : `{propriété} · Fréquence du Vivant`
   - Conserver strictement la même typographie, le même filet doré et le même halo de fond que l'intercalaire Étape 2 (aucune classe nouvelle sur la structure de base) pour garder l'unité du cahier.

2. **Pagination**
   - Le compteur `insertedPageCount` passe de 2 → 3 (J'observe seul) et de 6 → 7 (Portrait + J'observe + J'analyse) afin que le sommaire visuel et les numéros de page du colophon restent justes.
   - Vérifier que `print-break` reste porté par la première page d'observation pour que l'intercalaire occupe bien une page A4 pleine.

3. **Raffinement visuel des deux intercalaires (variantes de halo)**
   - Ajouter une variante de fond discrète par étape dans `src/index.css` (`.combined-print-divider--observe` / `--analyze`) : dégradé crème identique, mais motif de halo différencié — cernes concentriques (regard, étape 1) vs onde de terre (étape 2). Aucune couleur nouvelle, uniquement les tokens crème/or/forêt déjà utilisés.
   - Garantir l'impression pleine largeur 210 mm sans bord blanc, comme la page Étape 2.

4. **Vérification**
   - Impression « Portrait + J'observe » : pages = couverture, sommaire, Propriété, **intercalaire Étape 1**, observations (2 pages), colophon.
   - Impression « Cahier complet » : intercalaire Étape 1 → observations → intercalaire Étape 2 → analyse (3 pages).
   - Contrôle des sauts de page et des numéros dans l'aperçu d'impression.

## Détails techniques

- Fichiers touchés : `src/components/propriete/print/CombinedPrintLayout.tsx` (ajout du Divider + `insertedPageCount`), `src/index.css` (variantes de halo `.combined-print-divider--*`).
- Aucune modification de données, de hooks ni de la logique de verrouillage des étapes.

## Point à confirmer

La citation proposée pour l'étape 1 est « Avant de comprendre, il faut regarder longtemps. » — dites-moi si vous préférez une autre formule (ou une phrase issue du document de la méthode D.S.), je l'intègre telle quelle.
