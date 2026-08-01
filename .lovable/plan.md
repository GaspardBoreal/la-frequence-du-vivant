## Objectif

Depuis la vue Scénario (Scénographe), imprimer un **« Dossier de chantier »** A4 haut de gamme, à présenter à un paysagiste / pépiniériste pour valider le chantier : espèces en place, espèces proposées et retenues, photos avant aménagement, plan et métrés.

## Ce que contient le dossier (pagination A4 portrait)

1. **Couverture** — nom de l'ouvrage + scénario, propriété / commune, surface, date d'édition, bandeau doré, vignette du plan, chiffres clés (nb d'espèces, strates, couverture projetée An 3 / An 10).
2. **Le plan de plantation** — plan pleine page issu du canevas du Scénographe : emprise de l'ouvrage, halos d'envergure adulte, pastilles numérotées, échelle et nord. Légende par strate.
3. **La liste de plantation** — tableau pro numéroté (n° du plan, nom français + *nom scientifique*, strate, origine, envergure adulte, quantité), trié par strate, avec sous-totaux. C'est la pièce que le professionnel chiffre.
4. **Les espèces en place** — planche visuelle (vignettes photo) de ce qui existe déjà dans l'emprise, avec le niveau de rigueur retenu (strict / lisière / voisinage) indiqué, pour dire au pro « ceci reste, ne pas toucher ».
5. **Les espèces proposées et retenues** — planche visuelle des apports (photo, nom FR + scientifique, strate, fonctions écologiques, envergure). Distinction claire posé / non posé.
6. **Photos avant aménagement** — le carnet photo de l'ouvrage en planche datée (mosaïque, date EXIF, légende), plus une page « état actuel » en grand format si ≥ 1 photo.
7. **Repères de chantier** — surface, densité, écartements, note libre du scénario, sources et mentions.

## Comment ça marche (technique)

- Nouveau composant `src/components/propriete/scenographe/print/ScenarioPrintLayout.tsx` qui compose des sous-blocs : `ScenarioCover`, `ScenarioPlanPage`, `PlantingTablePrint`, `SpeciesPlatePrint` (réutilisée pour « en place » et « proposées »), `PhotosBeforePrint`.
- **Réutilisation stricte de l'existant** : mêmes classes `.synthesize-print-page` / `-rule` / `-body` / `-foot` déjà stylées dans `src/index.css`, même portail d'impression, même `printImageUrl.ts` (variantes allégées + repli original) et même `usePrintCombined.ts` + `PrintPreparationOverlay.tsx` (barre de progression, préchargement et re-essais des images). Aucun nouveau moteur PDF.
- **Le plan** : rendu SVG déterministe (pas de capture de tuiles), même logique que `PalettePlanSchema.tsx` — projection équirectangulaire locale de l'emprise et des `plantings`, halos d'envergure calculés par `growthModel.ts` pour An 3 / An 10. Option « fond satellite » écartée par défaut (tuiles non fiables en super-zoom, cf. sonde de couverture), donc plan trait + trame lisible en noir & blanc comme en couleur.
- **Les données** : `useOuvrageScenarios` (plantings du scénario actif), le pool « en place » filtré par `ouvrageScope.ts` au niveau de rigueur courant, `useObjetPhotos` pour le carnet photo, `useProprieteObjets` pour l'emprise et le métré.
- **Le déclencheur** : bouton « Dossier de chantier » dans le bandeau du Scénographe, à côté de « La Chambre du Vivant », avec un petit dialogue de choix (inclure les photos / inclure les espèces en place / horizon An 3 ou An 10).

## Direction graphique

Papier crème, filet doré fin en tête de page, titres sérif, corps sans-serif, pastilles numérotées identiques à celles du plan pour lier tableau et dessin, aplats par strate discrets, pied de page « Propriété · Ouvrage · Scénario · page n/N ». Grandes images en pleine largeur, marges généreuses, aucune couleur criarde — un dossier qui se pose sur la table d'un professionnel.

## Hors périmètre

Pas de génération serveur, pas d'export Word/Excel, pas de chiffrage tarifaire automatique (colonne « prix unitaire » laissée vide à remplir par le professionnel).
