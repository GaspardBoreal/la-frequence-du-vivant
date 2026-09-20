# Mode Atelier : un écran calme pendant qu'on déforme un ouvrage

Aujourd'hui, dès qu'on modifie la forme d'un ouvrage, tout reste à l'écran en même temps : le sélecteur de fond de plan (Géo / Sat / Relief / Cadastre), la barre de transformation qui se replie sur deux lignes juste en dessous, la fiche de l'ouvrage à droite, la barre d'outils du bas, les boutons de zoom et la pastille « IA de Jardin ». Résultat : la forme qu'on manipule occupe à peine un tiers de l'écran et les commandes se marchent dessus.

La proposition : pendant la transformation, l'écran entre dans un **mode Atelier** — un seul geste à la fois, tout le reste s'efface ou se range.

## Ce que voit l'utilisateur

```text
┌──────────────────────────────────────────────────────────┐
│                                              ( fiche ▸ )  │  ← fiche repliée en onglet
│                                                           │
│                   ◻ la forme, au centre                   │
│                   poignées + cote vivante                 │
│                                                           │
│                                                           │
│   ╭──────────────────────────────────────────────────╮    │
│   │ 🥬 Potager   74 → 5 m²  ×0,06      ⟲   ⌫   ✓     │    │  ← plot unique, en bas
│   ╰──────────────────────────────────────────────────╯    │
│      Coter · Lisser · Aide (repliés sous « ⋯ »)           │
└──────────────────────────────────────────────────────────┘
```

**1. L'écran se met en retrait.** À l'entrée en transformation : le fond de plan s'assombrit légèrement autour de l'ouvrage travaillé, le sélecteur de fond de plan, la barre du bas et la pastille « IA de Jardin » s'estompent (opacité réduite, non cliquables) puis reviennent à la sortie. Un liseré doré discret borde l'écran pour signaler « vous êtes en train de modifier ».

**2. Une seule barre, en bas, jamais deux lignes.** La barre de transformation quitte le haut de l'écran (où elle heurtait le sélecteur de fond) et devient un **plot unique en bas**, centré, à hauteur de pouce sur tablette :
- à gauche : la pastille de l'ouvrage + son nom ;
- au centre : la mesure vivante `74 m² → 5 m² ×0,06`, en chiffres alignés, le nouveau chiffre mis en avant ;
- à droite : trois actions seulement — **Annuler le geste**, **Abandonner**, **Valider** (Valider en plein, les deux autres en contour).
Les options secondaires (Coter, Lisser, aide-mémoire des gestes) passent dans un bouton « ⋯ » qui déplie un rang au-dessus du plot. Rien ne se replie plus sur deux lignes : au-delà d'une certaine largeur, ce sont les libellés qui disparaissent au profit des icônes, avec info-bulle.

**3. La fiche de droite se range en onglet.** Pendant la transformation, le panneau de l'ouvrage glisse hors champ et ne laisse qu'un onglet vertical « Potager ▸ » collé au bord droit. Un clic le fait revenir par-dessus, sans quitter le geste. La moitié droite du plan redevient utilisable — on voit enfin où l'on pose la forme.

**4. L'aide-mémoire des gestes, une fois puis à la demande.** « glissez la forme · poignées = échelle · pastille dorée = rotation » n'occupe plus la barre en permanence : il apparaît en filigrane au centre du plan pendant trois secondes à l'entrée, puis se rappelle sous « ⋯ › Comment faire ». Les raccourcis (Échap, Entrée, ⌘Z) y sont écrits noir sur blanc.

**5. Les cotes sur le plan, pas dans la barre.** Quand « Coter » est actif, largeur × profondeur, périmètre et nombre de sommets s'affichent au bord de la forme sur le plan, à côté de la cote de chaque côté — plus dans la barre du bas, qui reste courte.

**6. Sortie propre.** Valider ou Abandonner rend l'écran à son état normal : chrome rallumé, fiche redéployée, liseré éteint, avec une courte respiration plutôt qu'un basculement sec.

Même traitement pour la transformation d'un **emplacement** (zone), qui souffre exactement du même empilement.

## Direction artistique

Papier chaud et encre forêt, comme le reste de l'Atelier. Le plot du bas est une seule pièce arrondie, filet fin, ombre portée basse et large — un objet posé sur la carte, pas une barre d'outils. Le liseré doré et l'assombrissement du fond font le travail d'un rideau de théâtre : la scène, c'est la forme.

## Détails techniques

- `ObjetTransformBar.tsx` et `ZoneTransformBar.tsx` : passage de `absolute inset-x-0 top-0 … MAP_CHROME_TOP_PADDING` à un plot bas (`bottom-4`, `z-[760]`, au-dessus du panneau à `z-[700]`), sans `flex-wrap` ; segmentation en trois zones (identité / mesure / actions) ; repli des secondaires dans un `Popover` « ⋯ ».
- `PaletteStudio.tsx` : un booléen dérivé `transforming = !!objetTransform.objet || zoneTransform.active` qui (a) applique une classe d'atténuation aux chromes de fond (sélecteur de fond de plan, dock bas `z-[500]`, FAB IA), (b) replie le panneau de droite (`top-[4.5rem] … z-[700]`) en onglet via une translation, (c) ajoute le voile et le liseré.
- Voile : calque non interactif au-dessus des tuiles et sous les couches d'édition, pour ne jamais intercepter les poignées de `ObjetTransformLayer`.
- L'aide-mémoire devient un composant `TransformHint` autonome (affichage temporisé + rappel depuis « ⋯ »).
- Bloc de cotes (`api.dimensions`) déplacé de la barre vers l'étiquette de plan déjà rendue par `ObjetTransformLayer` quand `showDims` est actif.
- Aucun changement de logique de géométrie, de sauvegarde, de base de données ni de droits : uniquement présentation et disposition.
