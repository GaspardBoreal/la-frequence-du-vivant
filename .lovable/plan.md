# Galerie « Portrait du Site » — en amont de J'observe

Une galerie curatée par le propriétaire/paysagiste, alimentée par les photos des marches liées à la propriété, qui devient la **carte de visite visuelle** du site avant tout diagnostic.

## Emplacement & entrée

Nouvel onglet **Portrait** en position 0 du `ProprieteEspace` (avant J'observe → J'analyse → J'identifie). Icône `Images` + pastille compteur « n/12 ».

Sur l'onglet **J'observe**, en tête du carnet : bandeau discret « 🖼️ Portrait du site — 7 photos choisies » cliquant vers l'onglet Portrait. Si vide : CTA « Composez le portrait de votre site » avec micro-preview.

## Sélection — « Table lumineuse »

Metaphore d'une table lumineuse de photographe : les photos candidates (issues de `marche_photos` + `convivialite` + `marcheur_medias` des events liés) apparaissent en mosaïque contact-sheet sépia légère. Un clic les fait basculer en couleur pleine + coche ambre, un second désélectionne.

- **Source** : RPC `get_propriete_gallery_candidates(propriete_id)` — agrège toutes les photos géolocalisées dans le rayon des events liés, dédupliquées, avec auteur/date/GPS.
- **Filtres discrets en haut** : par marche, par saison, par auteur, « avec GPS uniquement ».
- **Cap** : **12 photos max** (nombre d'or narratif — assez pour raconter, trop peu pour diluer). Compteur circulaire progressif « 7 / 12 » qui se remplit en ambre.
- **Ordre** : drag-and-drop pour réordonner (dnd-kit, comme les autres flows photos). L'ordre pilote l'affichage et l'impression.
- **Crédit** : chaque photo garde l'attribution marcheur (badge discret en overlay hover).
- **Droits** : seul le propriétaire de la propriété + admin peuvent curater. Les autres visiteurs voient le portrait en lecture seule.

## Modes d'affichage — 3 registres au choix

Toggle en haut de l'onglet Portrait (`Mosaïque` · `Récit` · `Constellation`), état persisté.

1. **Mosaïque `Bento**` — grille asymétrique 12 tuiles (1 large hero + 3 moyennes + 8 petites), ratios variés, coins doucement arrondis. Hover → légende (auteur · date · lieu). Clic → lightbox plein écran avec navigation clavier.
2. **Récit `Cinemagraph**` — défilement vertical plein largeur, une photo par écran, parallax léger, légende typographique serif qui apparaît au scroll (fade + translate). Fond crème, marges généreuses. Ambiance carnet d'auteur.
3. **Constellation `Carte**` — les 12 photos posées sur la carte de la propriété à leurs coordonnées GPS, reliées par un trait fin (ordre de sélection = fil narratif). Clic vignette → carte zoome + panneau photo. Convertit le portrait en **balade visuelle géolocalisée**.

## Impression — Cahier photo A4

Bouton `Imprimer le portrait` génère une mise en page dédiée (règles `@media print`, comme le carnet J'observe) :

- **Page 1** : couverture — nom propriété en serif large, « Portrait du site » en filet, sous-titre « n photographies · n contributeurs · n marches », date d'édition, `SiteSignature` (déjà créée) en filigrane bas de page.
- **Pages intérieures** : 1 photo pleine page OU planche contact 4-up selon densité (auto : ≤6 photos = pleine page, >6 = mixte hero + planches).
- Chaque photo légendée : `Auteur · Date · Localisation` en petit caps.
- **Dernière page** : mini-carte de constellation + crédits marcheurs listés.
- Isolation impression via classe `portrait-printing` sur `<body>` (même pattern que `observe-printing`).

## Détails techniques

- RPC `SECURITY DEFINER` `get_propriete_gallery_candidates` + table `propriete_gallery_photos` (propriete_id, source_table, source_id, order_index, curated_by, created_at) avec unique(propriete_id, source_table, source_id).
- Hook `usePropertyGallery(proprieteId)` + `useUpdatePropertyGallery` (invalide `portrait` + bandeau J'observe).
- Composants nouveaux : `TabPortrait.tsx`, `GalleryLightTable.tsx` (sélection), `GalleryBento.tsx`, `GalleryStory.tsx`, `GalleryConstellation.tsx`, `PortraitPrintLayout.tsx`, `PortraitTeaser.tsx` (bandeau J'observe).
- Réutilise `SafeMapContainer`/`RichMap` primitives pour la constellation, `SpeciesThumb` pattern pour fallback vignette.
- Ordonnancement drag-and-drop : dnd-kit (déjà utilisé dans `convivialite-photo-reordering-logic` et `marcheur-observations-reordering-logic`).

## Livrable UX à valider avant build

Confirmer :

1. **Cap à 12**
2. 2 pour la v1 (ex. Bento + Constellation)
3. **Curation ouverte aux paysagistes liés** au CRM en plus du propriétaire