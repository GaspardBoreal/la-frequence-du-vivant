# Colonne ÉTAT à l'impression : pictos plus petits et en couleur

Objectif : dans le PDF « Le sol, point par point », la colonne ÉTAT doit reprendre l'aspect de l'écran — pastilles de strates colorées (vert, brun, bleu, corail) — mais nettement plus petites qu'aujourd'hui.

## Ce qui change

1. **Couleur restaurée**
   Le sceau des strates est actuellement rendu en monochrome brun à l'impression (mode « mono » activé quand la table est en version imprimable). On désactive ce mode : les strates s'impriment avec leurs couleurs d'origine, exactement comme à l'écran, les strates non testées restant grisées.

2. **Pictos encore plus petits**
   Nouvelle taille de sceau dédiée à l'impression (icônes ~11 px au lieu de 18 px, écart réduit), au lieu de compter uniquement sur une mise à l'échelle CSS. Résultat : des pastilles nettes, sans flou de scale, sur une seule ligne.

3. **Pastille d'état**
   « À compléter » / « Complet » conserve sa couleur ambre / vert et passe en taille micro cohérente avec les pictos.

4. **Impression fidèle des aplats**
   Forçage du rendu des couleurs de fond dans cette colonne pour que les cercles teintés ne soient pas vidés par le navigateur.

## Détails techniques

- `src/components/propriete/analyze/sample/StrataSeal.tsx` : ajout d'une taille `print` dans `DIM` (icon 11, gap 2).
- `src/components/propriete/analyze/SamplesRegisterTable.tsx` : `mono={printOnly}` → couleur conservée ; `size` passe à `print` en version imprimable.
- `src/index.css` (bloc `@media print`) : suppression du `transform: scale(...)` devenu inutile sur `.samples-register-seal`, ajustement des tailles de `.register-state-pill`, `print-color-adjust: exact` sur la colonne ÉTAT.
