# Impression « Le sol, point par point » : reproduire la mise en page écran

## Constat

À l'écran le registre tient sur 7 colonnes bien réparties, une ligne par mention. À l'impression, la colonne ÉTAT est la coupable : le sceau des 4 strates y est autorisé à passer à la ligne (`flex-wrap`) et la pastille « À compléter » y garde sa taille écran. La colonne réclame donc plus de place qu'elle n'en a, ce qui écrase toutes les autres et fait passer « Limoneux », « Test du boudin », les indices et les libellés sur 2 à 4 lignes.

Règles concernées : bloc `@media print` `.samples-register` de `src/index.css` (~l. 750-818).

## Ce qu'on corrige

1. **Colonne ÉTAT compacte et sur une seule ligne** : les 4 pictos du sceau restent alignés côte à côte, sans retour à la ligne, à taille réduite (≈ 60 % de l'écran, cercles resserrés).
2. **Pastille d'état miniature** : « À compléter » / « Complet » en très petit corps, insécable, alignée à droite sous les pictos.
3. **Largeurs rééquilibrées** : ÉTAT passe de 12 % à ~10 % ; la place libérée va à Lieu et Vie du sol, les colonnes les plus bavardes.
4. **Retour des mentions insécables** : « Limoneux », « Grumeleuse », « 7,5 », « Basique », coordonnées, « n / 7 » ne se coupent plus ; seules les phrases longues (indices de vie, repères) passent à la ligne.
5. **Densité** : interligne resserré et libellés secondaires légèrement réduits pour retrouver la hauteur de ligne de l'écran.

Aucun changement de contenu, de données, ni de la vue écran. Correction unique, donc valable pour « Analyse seul » et « Cahier complet ».

## Détails techniques

- `src/index.css`, `@media print` :
  - `.samples-register .samples-register-seal { flex-wrap: nowrap; gap: 0 }` et enfants `transform: scale(0.55)` avec marges négatives ajustées ; largeur max en mm pour garantir la tenue dans la colonne.
  - nouvelle règle sur la pastille d'état (bouton/`span` « À compléter » / « Complet ») : `font-size: 5.6pt`, `padding` réduit, `white-space: nowrap`.
  - largeurs : 16 / 18 / 11 / 11 / 9 / 25 / 10 %.
  - remplacer le `white-space: normal !important` global (l. 792-795) par un ciblage : `normal` sur `td`/`th`, mais `nowrap` conservé sur `.print-nowrap`, `.tabular-nums` et `.register-coords`.
  - `line-height: 1.15` sur le tableau, libellés secondaires à `6.2pt`.
- `src/components/propriete/analyze/SamplesRegisterTable.tsx` : ajouter au besoin une classe `register-state-pill` sur la pastille d'état pour l'accrocher côté CSS (aucun changement de logique).
