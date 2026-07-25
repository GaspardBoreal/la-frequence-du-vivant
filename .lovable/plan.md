## Problème

À l'impression du carnet « J'observe », la section **06** commence trop bas en page 8 et se retrouve isolée / coupée. Les sections **07** et **08** finissent également mal réparties.

Cause : la grille synthèse rend les blocs 01→07 en flux continu (grille 2 colonnes) puis le bloc 08 pleine largeur. Aucun saut de page n'est forcé, l'imprimeur casse donc où il peut.

## Correctif

Dans `src/components/propriete/observe/ObserveSummary.tsx` :

1. Découper `first7` en deux groupes de rendu :
   - **Groupe A** : blocs **01 → 05** (rendus dans la grille actuelle).
   - **Groupe B** : blocs **06 → 07** dans une nouvelle grille précédée d'un saut de page à l'impression (`className="print-break-before"` + wrapper `md:col-span-2`).
2. Placer le **bloc 08** (Analyse sensorielle) immédiatement après le Groupe B, dans le même conteneur, sans saut supplémentaire, afin que 06 + 07 + 08 partagent la nouvelle page.
3. Réutiliser la classe existante `print-break` déjà utilisée par `CombinedPrintLayout` (elle applique `page-break-before: always` / `break-before: page`). Si absente en global, ajouter une petite règle utilitaire dans `src/index.css` sous `@media print` :

   ```css
   .print-break-before { break-before: page; page-break-before: always; }
   ```
4. Ajouter `break-inside: avoid` sur chacun des blocs 06/07/08 pour éviter toute nouvelle coupure interne.

## Résultat attendu

- Page N : blocs 01 → 05 + signature du site.
- Page N+1 (nouvelle page) : blocs 06 + 07 côte à côte, puis bloc 08 « L'Âme du Lieu » pleine largeur, tous groupés proprement.
- Aucun impact écran : le saut de page n'agit qu'en impression.

## Fichiers touchés

- `src/components/propriete/observe/ObserveSummary.tsx` (découpage rendu + classes)
- `src/index.css` (règle print utilitaire si non existante)
