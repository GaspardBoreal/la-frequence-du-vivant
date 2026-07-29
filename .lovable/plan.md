## Constat

L'Atelier compte 7 familles d'outils (Eau, Sol vivant, Nourricier, Patrimoine, Biodiversité, Usage, Annotation) — vérifié dans `src/lib/paysageTools.ts`. Aucun outil « Massif » : la composition ornementale/mellifère, cœur du métier paysagiste, n'est pas représentée. Et surtout : aucun outil ne porte aujourd'hui de **notion de couleur végétale ni de saisonnalité florale**.

Ta proposition est juste — et on peut aller plus loin qu'un simple outil : en faire une **grammaire chromatique** propre au studio.

## Ce que je propose

### 1. Une nouvelle famille « Massifs & couleur »
Tagline : « Composer avec la couleur, pas seulement avec la forme ». Couleur famille : prune/lie-de-vin.

Outils (polygones, unité m²) :
- **Massif monochromatique** — une seule teinte, effet de masse et de calme
- **Massif en camaïeu** — dégradé d'une même famille chromatique
- **Massif bicolore** — deux teintes, souvent en contraste ou complémentaires
- **Massif polychromatique** — prairie fleurie composée, effet naturaliste
- **Bordure / liseré fleuri** (ligne, ml) — la même grammaire en linéaire
- **Massif d'ombre** (polygone) — cas particulier : la couleur vient du feuillage, pas de la fleur

Chacun avec impact renseigné (couverture permanente, mellifère, coût conventionnel vs sol vivant, entretien) pour alimenter le Bilan du plan existant.

### 2. Le « nuancier » : l'outil créatif
Quand on pose un massif, l'inspecteur d'objet (`ObjectInspector`) ouvre un **module Nuancier** :
- choix de 1 à 5 **teintes** sur une roue chromatique horticole (blanc, jaune, orange, rouge, rose, mauve, bleu, pourpre, argenté, vert)
- le nombre de teintes **contraint automatiquement le type** : 1 teinte → monochrome ; 2 → bicolore ; 3+ voisines → camaïeu ; 3+ éloignées → polychrome. Le studio nomme le massif tout seul (« Massif bicolore mauve × jaune »).
- un **avertissement d'harmonie** discret quand les teintes choisies jurent (rouge + rose froid, orange + mauve), avec la suggestion complémentaire.
- le polygone sur la carte se remplit d'un **dégradé SVG réel des teintes choisies** — plus une couleur d'outil générique. Un massif bicolore se lit comme bicolore sur le plan.

### 3. Le calendrier de floraison
Deuxième bloc de l'inspecteur : une **frise 12 mois** où l'on coche les mois de floraison attendus. Elle produit :
- une jauge « continuité florale » (mois sans fleur = trous à combler)
- une lecture agrégée au niveau du site : **« votre jardin est fleuri 7 mois sur 12 »**, avec les mois creux nommés — argument client fort, et directement imprimable.

### 4. Recommandations par type de massif
Ajout de 6 fiches dans la base éditable `ouvrageRecoKb` (mise en œuvre, calendrier, entretien An0/An1/An3, espèces, vigilances, sources) — donc enrichissables par un admin comme les autres ouvrages. Les espèces recommandées sont croisées avec la palette du site (mécanisme de correspondance déjà en place dans `OuvrageRecoCard`).

### 5. Croisement avec la palette végétale existante
Les espèces de `plantPaletteKb` retenues pour une zone se voient attribuer une teinte dominante et un mois de floraison ; le massif propose alors **« 4 espèces de votre palette correspondent à ce nuancier »** — le lien entre l'étape 5 et l'atelier devient concret.

### 6. Impression
- Le **schéma de plan** (`PalettePlanSchema`) affiche les massifs avec leur dégradé réel et une légende chromatique.
- Une page **« Grammaire chromatique du jardin »** : nuancier des massifs, frise de floraison du site, mois creux, et lecture poétique de l'ensemble.

## Détails techniques

- `src/lib/paysageTools.ts` : ajout de la famille `massif` et des 6 outils ; extension optionnelle de `PaysageTool` avec `chromatique?: true`.
- Nouveau `src/lib/nuancierKb.ts` : les 10 teintes horticoles (hex, position sur la roue), la règle de déduction du type de massif, les règles d'harmonie/dissonance.
- Aucune migration : les teintes et les mois de floraison vont dans le champ `meta` (jsonb) de `propriete_objets`, déjà libre — `meta.teintes: string[]`, `meta.floraison: number[]`.
- Nouveau `src/components/propriete/palette/studio/NuancierPicker.tsx` (roue + frise) branché dans `ObjectInspector.tsx`.
- `ObjectsLayer.tsx` : `<linearGradient>` SVG par massif, appliqué au remplissage du polygone Leaflet.
- `src/lib/ouvrageRecoKb.ts` : 6 fiches de recommandation.
- Impression : légende chromatique dans `PalettePlanSchema.tsx`, nouvelle page dans `PalettePrintLayout.tsx` + pagination de `CombinedPrintLayout.tsx`.

Rien de l'existant n'est modifié dans son comportement : c'est une famille additionnelle et un bloc d'inspecteur supplémentaire.
