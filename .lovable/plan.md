## Ce dont on dispose déjà (vérifié dans le code)

- **Plantings du scénario** (`propriete_ouvrage_scenarios.plantings`) : chaque espèce posée porte `lat/lng`, `strate`, `spreadM`, `origin` (`place` / `proposee` / `libre`), `photoUrl`, `functions`, `commonNameFr`.
- **Référentiel strates** (`src/lib/plantSpread.ts`) : hauteur adulte, envergure, couleur et glyphe par strate → assez pour reconstruire un volume 3D crédible sans nouvelle donnée.
- **Horloge de croissance** An 0 / An 3 / An 10 déjà présente dans le Scénographe.
- **Carnet photo de l'ouvrage** (`useObjetPhotos`, saisons + millésimes dans `photos/seasons.ts`) : photos réelles du lieu, datées, saisonnées.
- **Emprise dessinée** de l'ouvrage (polygone) + fond satellite.

Rien de tout cela n'est aujourd'hui exploité autrement qu'en vue de dessus.

## Proposition : « La Chambre du Vivant »

Un bouton unique dans le Scénographe et dans la fiche scénario ouvre une surface plein écran, sombre et cinématographique, qui rejoue le scénario en **quatre immersions** commutables par une molette latérale, toutes alimentées par les mêmes données.

### Immersion 1 — La Coupe Vivante (2.5D, signature)
Coupe transversale animée de l'ouvrage : le trait de coupe est déplaçable sur un mini-plan, et les plantes traversées se dressent en silhouettes SVG stylisées (hauteur/envergure réelles par strate, photo de l'espèce en médaillon). Un curseur temporel An 0 → An 10 fait **pousser** les silhouettes de façon continue (interpolation, pas de saut). En dessous, la strate racinaire et le sol vivant se densifient avec le temps. Lecture immédiate : ombres portées, concurrences, vides.

### Immersion 2 — Le Dôme (vue à hauteur d'homme, 360°)
Panorama généré : on se place au centre de l'emprise, la caméra tourne lentement à 360°. Chaque planting devient une carte-billboard (sa photo détourée, échelle = envergure, distance = position GPS réelle), avec parallaxe multi-plans. Le fond est la photo réelle du carnet correspondant à la saison choisie, floutée et étirée. Curseurs : **saison** (printemps/été/automne/hiver, palette et feuillage qui basculent) et **année**. Effet vidéo : lumière volumétrique, particules de pollen, léger grain.

### Immersion 3 — Avant / Après morphing photo
Prend une photo réelle du carnet de l'ouvrage et fait apparaître par-dessus, en fondu chorégraphié, le scénario planté : masque progressif, pousses qui montent depuis le sol, halo doré sur chaque espèce nouvelle. Poignée de comparaison glissante « Aujourd'hui ↔ Dans 10 ans ». C'est l'image que le client montrera à sa famille.

### Immersion 4 — Le Film du scénario (export vidéo)
Une séquence de 25–35 s enchaînant automatiquement : survol du plan → zoom sur l'emprise → coupe vivante qui pousse → dôme 360° → avant/après → carte de synthèse (nb d'espèces, dont en place / proposées, recouvrement, strates, fonctions écologiques). Musique optionnelle, titrage au nom du scénario. Export MP4 via un rendu Remotion côté outil, plus partage d'un lien.

### Le fil rouge : le « Souffle »
Toutes les immersions partagent une même grammaire de mouvement (respiration lente 6 s, easing organique, palette encre-forêt + or) et un bandeau bas commun : **Année**, **Saison**, **Origine des espèces** (en place / proposées, avec un filtre qui fait littéralement apparaître ou se retirer les plantes de la scène).

## Détails techniques

- Nouveau dossier `src/components/propriete/scenographe/immersion/` : `ImmersionOverlay.tsx` (coquille plein écran + molette), `CoupeVivante.tsx`, `DomePanorama.tsx`, `AvantApres.tsx`, `FilmSequence.tsx`.
- `src/lib/immersion/growthModel.ts` : modèle de croissance continu (hauteur/envergure interpolées par strate entre An 0 et An 10, courbe logistique) + tri par profondeur.
- `src/lib/immersion/silhouettes.ts` : générateur SVG paramétrique de silhouettes par strate (couvre-sol → arbre), déterministe par nom d'espèce pour que chaque plante garde son allure.
- Rendu : SVG + Framer Motion pour la coupe, CSS 3D transforms + parallaxe pour le dôme (pas de Three.js, on reste léger et fluide), canvas pour les particules.
- Photos espèces : réutilisation de `photoUrl` des plantings et du cache vignettes existant ; fallback glyphe de strate.
- Photos du lieu : `useObjetPhotos` + `seasons.ts` déjà en place.
- Vidéo : projet Remotion dédié rendu à la demande, MP4 téléchargeable.
- Accessibilité : respect de `prefers-reduced-motion` (immersions figées, curseurs conservés).
- Aucune modification du modèle de données ni des scénarios existants.

## Ordre de construction proposé

1. Coquille `ImmersionOverlay` + modèle de croissance + bandeau commun.
2. Coupe Vivante (la plus démonstrative).
3. Avant / Après morphing photo.
4. Dôme 360° saisonnier.
5. Film exportable.

Les étapes 1–2 suffisent déjà à produire l'effet « wahou » ; les suivantes s'empilent sans refonte.
