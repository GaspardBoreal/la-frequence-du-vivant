# Rendre « Écologie face à votre sol » immédiatement lisible

Aujourd'hui, chaque axe affiche cinq barres presque identiques, un mot de verdict discret en haut à droite, et une légende en bas de bloc. On ne voit pas d'un coup d'œil ce qui est conforme et ce qui ne l'est pas, ni ce qu'il faut en faire.

## Ce que l'on construit

### 1. Un verdict global en tête de bloc
Une bande de synthèse avant les quatre axes : un mot fort (« Ce sol lui convient », « À nuancer », « Terrain contraire ») + une phrase concrète, calculée à partir des écarts des 4 axes. Trois pastilles compteurs : accords / nuances / écarts.

### 2. Chaque axe devient une ligne-verdict lisible
Pour chaque facteur (Eau, Texture, Nutrition, pH) :
- Pastille de verdict à gauche, couleur + icône (coche = accord, demi-cercle = nuance, croix = écart), même grammaire visuelle que la concordance sol/flore existante.
- Une règle à 5 crans où l'on distingue enfin les deux voix :
  - **plage verte pleine** = optimum de l'espèce,
  - **trait doré ancré** = votre sol, avec sa valeur repérée,
  - **zone d'écart hachurée** entre les deux quand ils ne coïncident pas, avec l'étiquette « 2 crans d'écart ».
- Sous la règle, une phrase didactique par axe, écrite en clair : « Votre sol est plus sec que ce que cette plante recherche : arrosage les deux premiers étés. » Une phrase par axe et par sens d'écart.

### 3. Rendre l'écart actionnable (le côté inspirant)
Quand un axe est en écart, une micro-suggestion de correction issue du vocabulaire jardin déjà utilisé dans l'app : paillage / apport organique / amendement / choix d'emplacement plus frais. Quand tout est en accord, une phrase de confiance plutôt qu'un vide.

### 4. Axe non documenté
Traité explicitement : cran grisé, pastille pointillée « Non évalué », et invitation « Complétez l'Étape 2 J'analyse le sol » — jamais un faux accord.

### 5. Légende repositionnée
La légende passe juste sous le titre (avant les axes), sous forme de deux repères visuels compacts : la barre = l'espèce, le trait doré = votre sol.

## Détails techniques

- Fichier principal : `src/components/propriete/palette/recommandee/SpeciesFicheDrawer.tsx`.
- La logique de lecture (verdict par axe, phrases, suggestions) est extraite dans un module dédié `src/lib/paletteEcologyReading.ts`, pour rester testable et réutilisable par l'impression et la carte espèce.
- Réutilisation de la grammaire de verdict existante (`VerdictChip`, tokens `--ds-verdict-oui/partiel/non/na` de `ConcordanceParts.tsx`) pour l'homogénéité avec « J'identifie ».
- Couleurs uniquement via tokens sémantiques (`--ds-forest`, `--ds-gold`, `--ds-verdict-*`, `--ds-cream`), aucune couleur codée en dur.
- Micro-animations Motion : apparition en cascade des axes, largeur de la plage et position du trait doré animées.
- Aucun changement de calcul : les crans restent issus de `toCran` sur `sp.species.optima` et `profile`.
