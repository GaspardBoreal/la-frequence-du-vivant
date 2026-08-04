# Rendre lisible le registre des prélèvements à l'impression

## Constat (vérifié dans le code)

Le tableau « 07. Registre des prélèvements » est le même composant à l'écran et à l'impression (`SamplesRegisterTable`). À l'écran il dispose d'une largeur minimale de 680 px et d'un défilement horizontal ; à l'impression, la règle CSS dédiée annule cette largeur minimale et impose `table-layout: fixed`. Les 7 colonnes sont alors réparties **à parts égales** dans la largeur A4, alors que leurs contenus n'ont pas du tout le même poids.

S'ajoute `word-break: break-word`, qui autorise la coupe **au milieu des mots** : d'où les « GÉOLO / CALISÉ », « indi / ce 40.0 », « TEST NON / PRÉCISÉ » visibles sur l'impression, et des lignes deux fois trop hautes.

## Ce qu'on corrige

1. **Une largeur juste par colonne** au lieu de 7 colonnes identiques : Prélèvement et Lieu resserrés, Structure / Texture / pH compactes, Vie du sol plus large (c'est la colonne la plus bavarde), État étroit et aligné à droite.
2. **Plus aucune coupure au milieu d'un mot** : les mots restent entiers, les mentions courtes (« Géolocalisé », coordonnées, « 7,5 », « Complet », « À compléter », « x / y ») ne se coupent plus jamais ; seules les phrases longues (indices de vie, liste de repères) passent à la ligne normalement.
3. **Une densité éditoriale propre** : hauteur de ligne resserrée, libellés microscopiques légèrement réduits et interlettrage adouci pour qu'ils tiennent sur une ligne, jauges (structure, texture, pH, vie) réduites pour ne plus élargir leur colonne.
4. **Tenue en page** : l'en-tête du tableau se répète en haut de chaque page si le registre déborde, la ligne de synthèse reste solidaire, aucune ligne coupée entre deux pages.
5. Correction appliquée **une seule fois**, donc valable pour les deux sorties : « Analyse seul » et « Cahier complet » (mêmes classes CSS).

## Détails techniques

- `src/index.css`, bloc `@media print` `.samples-register` (~l. 748-773) :
  - remplacer la répartition implicite par des largeurs explicites `th:nth-child(n)` / `td:nth-child(n)` (indicatif : 15 % / 13 % / 13 % / 13 % / 11 % / 24 % / 11 %) en conservant `table-layout: fixed` ;
  - remplacer `word-break: break-word` par `overflow-wrap: break-word; word-break: normal; hyphens: none` ;
  - ajouter `white-space: nowrap` sur les micro-libellés/pastilles courtes (`.samples-register .tabular-nums`, pastilles d'état, mention « Géolocalisé ») ;
  - réduire `letter-spacing` des libellés `uppercase` du tableau et fixer `font-size: 6.6pt` pour les lignes secondaires ;
  - contraindre `.register-ph-gauge`, `.register-gauge-cran` et la jauge de vie à des largeurs en mm ;
  - `thead { display: table-header-group }` déjà présent : ajouter `tfoot tr { break-inside: avoid }`.
- `src/components/propriete/analyze/SamplesRegisterTable.tsx` : ajouter un `<colgroup>` (mêmes proportions) pour que l'écran et l'impression partagent la même grammaire de colonnes, et une classe utilitaire sur les cellules « ne pas couper » (aucun changement de contenu ni de logique).

Aucune modification de données, de requêtes ni de la vue écran (largeur minimale et défilement conservés).
