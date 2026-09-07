# Section CodeCarbon : direction « Précision botanique (sombre) »

## Ce qui change (visible)

La section CodeCarbon de `/ia-frugale/outils-de-mesure` adopte l'habillage choisi : fond forêt sombre (`#0D2B24`), titres en sérif élégant, chiffres et formules en monospace, cartes en verre dépoli, résultats grands et lumineux avec halo émeraude.

- En-tête : badge crème « bibliothèque de mesure », grand titre CodeCarbon en sérif, lien discret vers l'outil officiel ; filet de séparation fin.
- Les deux cartes « Ce qu'il mesure » / « Quand s'en servir » deviennent des panneaux de verre, avec les pastilles animées (pulse doux) et le duo kWh × gCO₂e.
- Le panneau de constantes reste en pointillés, mais passé en trois repères centrés en monospace séparés par de fins filets verticaux.
- Les deux simulateurs sont remis en scène : pastille ronde numérotée 1 et 2, curseurs fins accentués émeraude, bloc formule sur fond encre, et à droite le grand chiffre de résultat en monospace avec halo lumineux et une phrase d'équivalence en italique.
- Révélations douces à l'arrivée dans l'écran, respect de `prefers-reduced-motion`.

## Garde-fous

- Aucun contenu supprimé : sliders, formules, volet de rigueur, sources datées et le bloc d'ancrage iNaturalist restent fonctionnels.
- Aucune donnée inventée ; les chiffres continuent de venir des mêmes calculs.
- Cohérence des thèmes : la section garde son fond sombre dédié dans les deux thèmes (clair et sombre), comme une « serre de nuit » ; les autres sections et outils ne changent pas.

## Technique

- Nouveau composant `src/components/ia-frugale/CodeCarbonSection.tsx` reprenant la structure du prototype v3 en tokens sémantiques (pas de couleurs codées en dur dans les composants : ajout des teintes forêt/émeraude dans `index.css` / `tailwind.config` si nécessaires, ou styles scopés via variables CSS dédiées à la section).
- `src/pages/IaFrugaleOutils.tsx` : la boucle générique des outils laisse place à ce rendu dédié pour `outil.cle === 'codecarbon'`, en réutilisant `SimulateurCard` (reskiné via prop ou variante) et `AncrageInaturalist`.
- Vérification : build + capture Playwright mobile (390 px) et desktop des deux thèmes.
