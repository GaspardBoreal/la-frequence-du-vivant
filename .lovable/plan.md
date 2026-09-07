# Section CodeCarbon : faire entrer les images du terrain

La section est belle mais abstraite : rien n'y montre ce que la plateforme produit réellement. On y ajoute trois moments visuels, dans le même habit « serre de nuit », sans toucher aux calculs.

## 1. Bandeau d'ouverture « La matière que l'on mesure »

Juste sous le titre CodeCarbon, une bande de photos réelles du projet (photos de marcheurs déjà présentes dans le projet), en mosaïque décalée qui défile lentement au scroll, assombrie et teintée forêt pour rester lisible sur le fond sombre.

Par-dessus, trois compteurs animés alimentés par les vrais chiffres publics du site (photos collectées, espèces suivies, marches organisées) et une phrase : « Chaque chiffre de cette page porte sur ces images-là. »

Au survol (ou au tapotement sur mobile), une vignette reprend sa couleur d'origine et affiche son contexte.

## 2. Cartouche « Cas Marches du Vivant » dans le simulateur 1

Dans le premier simulateur, une petite fenêtre carrée de photo de terrain se place à côté du grand chiffre : le résultat n'est plus un nombre seul, mais « voilà ce que coûte ce que vous voyez ». La fenêtre reste discrète, cadre fin, léger halo émeraude.

## 3. Cartouche « Cas Fréquence Jardin » dans le simulateur 2

Même principe, avec les images de jardin/patio végétalisé du projet, et le chiffre correspondant.

## Ludique et dynamique

- Les vignettes se révèlent en cascade à l'arrivée dans l'écran.
- Un léger effet de parallaxe sur la bande d'ouverture.
- Les compteurs comptent de 0 jusqu'à la valeur réelle.
- `prefers-reduced-motion` respecté : tout s'affiche immédiatement, sans mouvement.

## Garde-fous

- Aucune donnée inventée : les compteurs viennent des chiffres publics déjà utilisés ailleurs sur le site ; en cas d'indisponibilité, un tiret s'affiche.
- Aucun contenu retiré : curseurs, formules, volet de rigueur, sources datées et le bloc iNaturalist restent tels quels.
- Photos issues du projet uniquement, avec textes alternatifs descriptifs.

## Technique

- Nouveau `src/components/ia-frugale/BandeauTerrain.tsx` : mosaïque responsive (défilement horizontal sur mobile, grille décalée sur grand écran), imports ES6 des images de `src/assets/marcheurs` et `src/assets/isegcom`, compteurs via `usePublicGlobalStats`, révélation par IntersectionObserver comme `cc-reveal`.
- Petit `src/components/ia-frugale/VignetteCas.tsx` réutilisable pour les deux cartouches.
- `CodeCarbonSection.tsx` : insertion du bandeau après l'en-tête ; passage d'une prop `illustration` à `SimulateurCard` pour les cartouches.
- `SimulateurCard.tsx` : prop optionnelle `illustration` rendue à côté du bloc résultat, sans changer la logique de calcul.
- Styles ajoutés dans la portée `.cc-nuit` de `src/index.css` (teinte, halo, parallaxe).
- Vérification : typecheck + captures Playwright mobile 390 px et desktop.
