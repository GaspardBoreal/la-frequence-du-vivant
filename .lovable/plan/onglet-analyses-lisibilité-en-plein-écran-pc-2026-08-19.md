# Onglet Analyses — lisibilité en plein écran PC

## Le problème constaté

En plein écran (copie 3), deux sondes s'affichent côte à côte, et chaque sonde contient déjà un triptyque de 3 colonnes d'espèces. Résultat : 6 colonnes d'espèces sur la largeur de l'écran, soit environ 150 px par vignette. Les noms sont coupés (« P… », « Alli… »), les justifications tronquées, les badges passent à la ligne. En tablette et en mobile, une seule sonde par ligne : tout est lisible.

La cause n'est donc pas le design des vignettes mais l'empilement de deux grilles imbriquées.

## Ce que je propose

1. **Une sonde par ligne, toujours.** Supprimer la mise en deux colonnes des cartes de sonde au niveau « Simple ». Chaque sonde occupe la pleine largeur, comme en tablette. C'est le geste qui rend tout le reste lisible.

2. **Largeur de lecture bornée.** Sur très grand écran, limiter la largeur du contenu des analyses (environ 1400 px, centré) pour éviter des lignes de texte interminables.

3. **Vignette d'espèce robuste.** Dans la vignette : nom sur deux lignes maximum au lieu d'une troncature sèche, nom latin sur une ligne, justification sur deux lignes, note d'adéquation toujours visible en haut à droite. La largeur minimale d'une colonne du triptyque est garantie : en dessous, le triptyque passe à deux colonnes puis une seule, plutôt que d'écraser les vignettes.

4. **Repère visuel de sonde.** Comme les cartes deviennent pleine largeur, en-tête de carte légèrement renforcé (nom de sonde + verdict) pour que le scroll reste lisible d'une sonde à l'autre.

Aucun changement de données, de calcul de palette, ni de contenu : uniquement la mise en page.

## Détails techniques

- `src/components/iot/analyses/AnalysesTab.tsx` : niveau « simple », remplacer `grid gap-4 xl:grid-cols-2` par une pile `space-y-4` ; envelopper le contenu de l'onglet dans un conteneur `mx-auto w-full max-w-[1400px]`.
- `src/components/iot/analyses/SpeciesTriptych.tsx` : grille responsive basée sur une largeur minimale de colonne (`sm:grid-cols-2 xl:grid-cols-3`) au lieu de `lg:grid-cols-3` seul.
- `src/components/iot/analyses/SpeciesTile.tsx` : `line-clamp-2` sur le nom vernaculaire (au lieu de `truncate`), `truncate` conservé sur le latin, badges en `flex-wrap` avec `shrink-0` sur la note.
- Vérification visuelle après coup en 1920 px, 1280 px, 834 px et 390 px.
