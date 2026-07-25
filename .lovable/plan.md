## Bloc 1 · État du terrain — pictos et visuel didactiques par cas

### Constat (audit UI)

- Les 5 pictos de vignette (Remanié, Remblai, Décaissement, Naturel, Inconnu) existent bien mais restent trop discrets pour porter la pédagogie de la page 6 du guide D.S.
- **Le vrai problème** : le grand visuel en haut de la carte (collines stratifiées) est **le même pour les 5 cas**. Résultat : rien ne « raconte » visuellement le cas choisi, alors que la méthode D.S. repose sur la lecture d'une coupe de terrain.

### Correctif — deux niveaux

**A. Hero dynamique — une coupe de sol par cas**

Remplacer le `SoilHeroStrata` statique par un composant `TerrainCrossSection` qui morphe (transitions Framer Motion 500 ms) selon la valeur choisie. Une seule scène (ciel + horizon + strates + surface végétale), 5 déclinaisons didactiques :

| Cas | Signature visuelle |
|---|---|
| **Remanié** | Strates ondulées puis rompues et rebouchées en désordre, cicatrice diagonale, petite pelle en filigrane |
| **Remblai** | Monticule ajouté au-dessus du terrain naturel, matériaux hétérogènes (cailloux, gravats stylisés), ligne pointillée marquant le sol d'origine enfoui |
| **Décaissement** | Cuvette creusée, strates tronquées net, flèche descendante ambre, ligne pointillée indiquant le niveau retiré |
| **Naturel** | Strates parallèles régulières (litière · humus · terre végétale · argile · roche mère), racines qui plongent proprement, herbes en surface |
| **Inconnu** | Coupe voilée par un dégradé brumeux, points d'interrogation en filigrane, strates à moitié révélées comme un scan incomplet |

Palette commune (crème → ambre → forêt) pour rester cohérent avec les autres blocs. État par défaut (aucun choix) : version « Naturel » désaturée + légende « Choisissez un cas pour révéler la coupe ».

**B. Refonte des 5 pictos de vignette**

Les redessiner pour qu'ils partagent la **même grammaire** (cadre 64×64, ligne d'horizon commune, ambre = intervention humaine, forêt = matière naturelle) et deviennent immédiatement lisibles :

- **Remanié** : deux couches décalées avec flèche circulaire de brassage
- **Remblai** : monticule posé sur ligne de sol + trois cailloux ambre
- **Décaissement** : cuvette + flèche descendante ambre + niveau d'origine pointillé
- **Naturel** : strates parallèles nettes + brin d'herbe
- **Inconnu** : coupe voilée + point d'interrogation intégré à la strate

Chaque picto reprend la même signature que son hero → lecture croisée immédiate (petit picto = petit résumé du grand visuel).

**C. Micro-interaction pédagogique**

Sous le hero, une ligne discrète (10 px, tracking large) affiche le **verbe clé** du cas sélectionné : « Terre déplacée · brassée » / « Terre apportée · empilée » / « Terre retirée · creusée » / « Terre en place · stratifiée » / « À investiguer · scan partiel ». Fade-in synchronisé avec le morph du hero.

### Fichiers touchés

- `src/components/propriete/analyze/SoilPictos.tsx` — redessin des 5 icônes Terrain avec la nouvelle grammaire commune (mêmes signatures = mêmes exports, aucun impact ailleurs).
- `src/components/propriete/analyze/TerrainCrossSection.tsx` — **nouveau**. SVG 320×140 avec 5 variantes + `AnimatePresence` pour le morph.
- `src/components/propriete/analyze/blocks/TerrainBlock.tsx` — remplacer `<SoilHeroStrata variant="strata" />` par `<TerrainCrossSection value={value} />` + petite légende dynamique du verbe clé.

Aucun changement de données ni d'API ; strictement UI/illustration.
