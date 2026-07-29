## Constat (vérifié dans le code)

L'impression de l'étape 5 (`PalettePrintLayout.tsx`) ne produit que **2 pages** issues de `PaletteSummary` : la règle du site + les palettes par emplacement (p. 1), puis les refus, la mise en œuvre et les sources (p. 2).

Il manque donc, aussi bien dans la fiche seule que dans le cahier complet (`CombinedPrintLayout.tsx`, qui appelle exactement les mêmes deux sections) :

- le **schéma** des emplacements et des ouvrages (aucune carte n'est rendue) ;
- tout ce qui est **saisi dans l'Atelier** : les ouvrages (`propriete_objets` — type, nom, métré, quantité, coût, note de chantier, rattachement à un emplacement), les calques et le bilan d'impact (`computeBalance`) ;
- les **conseils par ouvrage** (mise en œuvre, calendrier, entretien An 0/1/3, espèces & compagnonnage, vigilances, sources) rendus à l'écran par `OuvrageRecoCard` mais absents de l'impression.

## Ce que je construis

**A. Le plan gravé — une planche pleine page**

Nouveau composant `PalettePlanSchema.tsx`, sur le modèle éprouvé de `SoilSamplesPlan` (projection SVG locale, pas de tuiles carto donc pas d'aléa d'impression) :

- parcelles cadastrales en trait fin pointillé ;
- emplacements (zones) en aplat teinté à leur couleur, lettrés A, B, C… ;
- ouvrages dessinés selon leur géométrie (polygone / ligne / point), à la couleur de leur outil, numérotés 1…n ;
- échelle graphique, flèche du nord, cartouche « propriété · commune · date de scellement » ;
- **légende en deux colonnes** en pied de planche : emplacements (surface, ambiance) et ouvrages (type, métré).

**B. La table de l'Atelier — une page**

- bandeau bilan : surface désimperméabilisée, rétention d'eau, surface nourricière, couverture, linéaire, coût conventionnel vs sol vivant, entretien annuel comparé (repris de `computeBalance`) ;
- tableau des ouvrages : n° · type · nom · emplacement de rattachement · métré · quantité · coût · note de chantier, groupé par famille (eau, nourricier, circulation…).

**C. Les fiches conseils — une planche par famille**

Nouveau `OuvragePrintSheet.tsx` (variante imprimable de `OuvrageRecoCard`, sans accordéon ni bouton) : pour chaque **type d'ouvrage présent** sur le site — mise en œuvre numérotée, calendrier, entretien An 0 / An 1 / An 3 en trois colonnes, espèces & compagnonnage avec pastille sur celles déjà retenues dans la palette de l'emplacement, cartouche vigilances en ocre, sources. Deux fiches par page A4, jamais coupées (`print-avoid-break`).

**D. Pagination et direction artistique**

`PalettePrintLayout` passe de 2 pages fixes à une pagination calculée :

```text
1. Couverture  « ÉTAPE 5 · La palette végétale »  (même grammaire que l'étape 2 :
                halo concentrique, citation en italique, cachet daté)
2. La règle du site + palettes par emplacement       (existant, conservé)
3. Le plan gravé — emplacements & ouvrages           (nouveau)
4. La table de l'Atelier — métrés, coûts, bilan      (nouveau)
5..n Fiches conseils par type d'ouvrage              (nouveau, 2 / page)
n+1 Ce que l'on écarte · Mise en œuvre · Sources     (existant, conservé)
```

Pieds de page « x / N » recalculés. Les mêmes blocs sont injectés dans `CombinedPrintLayout` pour que le **cahier complet** hérite exactement du même contenu, avec sa numérotation continue.

## Détails techniques

- `PalettePlanSchema.tsx` réutilise la projection métrique locale de `SoilSamplesPlan` (mètres → px, marge 18 %, pas d'échelle « joli »), étendue aux LineString et Point.
- Les ouvrages viennent de `useProprieteObjets`, les métrés de `measureFor` / `fmtMeasure`, les conseils de `useOuvrageRecoKb().resolve(outil_key)` — aucune nouvelle requête, aucune migration.
- Le rendu d'impression étant hors-écran, tous les blocs à fond crème portent explicitement `text-[hsl(var(--ds-forest-deep))]` (l'app est verrouillée en sombre) et `print-exact` pour les aplats.
- Vérification finale dans le navigateur sur la propriété Jardin Monde Deviat, en aperçu d'impression, pour les deux parcours : « Palette seule » et « Cahier complet ».

## Fichiers concernés

- `src/components/propriete/print/PalettePlanSchema.tsx` — nouveau (planche du plan)
- `src/components/propriete/print/AtelierTablePrint.tsx` — nouveau (bilan + table des ouvrages)
- `src/components/propriete/print/OuvragePrintSheet.tsx` — nouveau (fiches conseils)
- `src/components/propriete/print/PalettePrintLayout.tsx` — couverture + pagination dynamique
- `src/components/propriete/print/CombinedPrintLayout.tsx` — mêmes blocs dans le cahier complet
- `src/components/propriete/tabs/TabPalette.tsx` — passage des ouvrages / parcelles aux maquettes
- `src/index.css` — quelques classes d'impression (planche, table, fiches)

Aucune migration de base nécessaire.
