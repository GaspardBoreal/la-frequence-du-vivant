## Contexte

Sur les vignettes **Apprendre › Ce que nous avons vu › L'Œil**, les actions du curateur (en haut-droite de l'image) sont collées : `UserPlus` (attribuer à un marcheur), `Pin` (épingler), et selon l'état un 3ᵉ marqueur (étoiles IA / "à réviser"). Visuellement les deux pastilles se touchent (`gap-1`, `p-1.5`) et concurrencent le sujet photographique.

Fichier concerné : `src/components/community/insights/curation/CuratedSpeciesCard.tsx` (lignes 135-166 pour le cluster d'actions).

## Proposition — "Constellation flottante"

Une seule direction, sobre et inspirante, qui sépare clairement les 3 fonctions sans alourdir la carte :

1. **Disposition en arc vertical** plutôt qu'en rangée serrée :
   - `Attribuer` en haut-droite,
   - `Épingler` légèrement en dessous, décalé vers l'intérieur,
   - badge IA / "à réviser" reste en haut-gauche (déjà séparé).
   - Espacement `gap-2.5` minimum, chaque bouton dans son propre halo.

2. **Pastilles "verre dépoli"** unifiées :
   - Fond `bg-background/40 backdrop-blur-md`, bord `border-white/20`, ombre douce.
   - Taille `h-8 w-8` (au lieu de `p-1.5` mélangé), icône `w-4 h-4` centrée.
   - Couleur d'état : neutre au repos, accent ambre seulement quand actif (pin posé).

3. **Apparition au survol** sur desktop, **persistante en tactile** :
   - Au repos, opacité `0.55` ; au `group-hover` ou focus, opacité `1` + léger `translate-x-0` depuis `translate-x-1`.
   - Transition `duration-300 ease-out`, donne une respiration "constellation qui s'allume".

4. **Tooltips déjà en place** conservés, mais positionnés `side="left"` pour ne pas masquer la photo voisine.

5. **Zone de sécurité** : les actions sont regroupées dans un conteneur `top-2 right-2` avec `pointer-events-auto`, le reste de l'image reste cliquable pour ouvrir le détail.

## Hors-scope

- Pas de changement de logique (attribution, pin, IA inchangés).
- Pas de modification de `PinToggle` ni du dialog d'attribution — seules les classes du wrapper et le style des deux boutons sont ajustés.
- Pas de toucher aux vignettes hors Œil.

## Vérification

Recharger `/marches-du-vivant/mon-espace/exploration/.../` › Apprendre › L'Œil :
- En survol d'une vignette, les 3 marqueurs s'éclairent en constellation, bien séparés.
- En tactile, les actions restent visibles mais discrètes.
- L'épinglage actif conserve l'accent ambre lisible.
