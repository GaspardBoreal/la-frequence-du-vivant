## Objectif

Aligner le bloc « Étape 2 · 3 · Structure du sol » sur la grammaire visuelle déjà en place pour « État du terrain » (bloc 1) : un hero SVG qui morphe selon le choix + 3 pictos spécifiques, design, didactiques, partageant une signature graphique commune. S'inspirer de la page 6 du document D.S. (Compacte / Grumeleuse / Particulaire).

## Diagnostic actuel

- `StructureBlock.tsx` : le hero est statique (`SoilHeroStrata variant="cross"` — un cube stratifié qui ne change jamais quel que soit le choix).
- `SoilPictos.tsx` : les 3 icônes existent mais restent génériques (grille, ronds, points) sans « verbe clé » ni cohérence avec le hero.

## Ce qu'on va livrer

### 1. Nouveau composant `StructureCrossSection.tsx`
Même patron que `TerrainCrossSection` : une scène SVG « motte dans la main » qui morphe en 3 états via `framer-motion`, avec verbe clé animé en dessous.

- **Compacte** — motte massive, monolithique, fissurée sur une seule ligne nette ; verbe : « Résiste · bloc unique ».
- **Grumeleuse** — motte qui éclate en agrégats arrondis, aération visible (petits vides entre grumeaux), touche de radicelle ; verbe : « S'émiette · respire ».
- **Particulaire** — la motte se désagrège en grains individuels qui glissent entre les doigts ; verbe : « Se disperse · sable ».

Fond dégradé terre (ocre → sable) cohérent avec le hero actuel + main stylisée en bas pour rappeler le geste « cassez une motte ».

### 2. Redessin des 3 pictos (`SoilPictos.tsx`)
Même grammaire : cadre carré 64px, contour vert forêt, silhouette d'une motte, remplissage qui traduit l'état :

- **IconCompacte** — bloc plein avec une fissure nette diagonale (motte massive qui refuse de se briser).
- **IconGrumeleuse** — silhouette de motte composée d'agrégats arrondis imbriqués, un petit vide central (porosité).
- **IconParticulaire** — silhouette de motte dissoute en grains qui « coulent » vers le bas.

Chaque picto respecte le token `--primary` (forêt émeraude) et l'accent `--accent` (ambre) via la fonction `wrap` existante.

### 3. Câblage dans `StructureBlock.tsx`
- Remplacer `<SoilHeroStrata variant="cross" />` par `<StructureCrossSection value={value} />`.
- Passer `value` au hero pour qu'il morphe en direct sur clic.
- Rien d'autre ne change (choix, `AnalyzeCard`, `ChoiceButton`).

## Fichiers touchés

- **Nouveau** : `src/components/propriete/analyze/StructureCrossSection.tsx`
- **Modifié** : `src/components/propriete/analyze/SoilPictos.tsx` (les 3 icônes structure uniquement)
- **Modifié** : `src/components/propriete/analyze/blocks/StructureBlock.tsx` (hero + import)

Aucun changement sur le stockage, aucun impact sur les autres blocs (`TerrainBlock`, `TextureBlock`, `PhBlock`, `LifeBlock`) ni sur l'impression.
