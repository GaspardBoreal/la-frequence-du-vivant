## Objectif

Accélérer le défilement du carrousel hero du Jardin et magnifier la transition entre photos pour un effet vraiment « wahou ».

## Changements

**`src/components/immersive-garden/KenBurnsCarousel.tsx`** (seul fichier modifié)

1. **Cadence plus rapide**
   - `intervalMs` par défaut : `6500` → `2800` ms (une nouvelle photo toutes ~2.8 s).
   - Appelé sans prop depuis `ImmersiveGardenFiche` → hérite du nouveau défaut.

2. **Transition progressive multi-couches (effet wahou)**
   - **Cross-fade + zoom continu** : chaque image entre en `scale 1.15 → 1.35` sur toute sa durée d'affichage (Ken Burns accéléré, mouvement toujours perceptible).
   - **Blur reveal** : `filter: blur(14px) → blur(0)` sur les 900 premières ms → sensation d'émergence.
   - **Radial mask iris** : l'image entrante est révélée via `clip-path: circle(0% → 140%)` centré aléatoirement (coin/centre) sur 1.1 s → effet d'ouverture organique différent à chaque transition.
   - **Flash lumineux doré** ultra-bref (120 ms, opacity 0 → 0.35 → 0) superposé à chaque changement, teinte `#f5d68a` → rappelle la lumière filtrée par la canopée.
   - **Ken Burns directionnel randomisé** : chaque image tire un vecteur de translation (`x`, `y` entre ±4 %) pour éviter la sensation répétitive.

3. **Préchargement**
   - Précharger l'image `n+1` dès que `n` est affichée (`new Image().src = list[next].url`) pour éviter tout flash blanc à cette cadence.

4. **Respect `prefers-reduced-motion`**
   - Si réduit : cadence ralentie à 5 s, pas de blur ni clip-path, cross-fade simple.

## Hors scope

- Aucun changement de routing, de données, ni des autres composants immersifs.
- Aucun changement backend.

## Détails techniques

- Utilise `framer-motion` `AnimatePresence mode="sync"` (déjà en place) + `custom` par image pour passer le vecteur Ken Burns et l'origine du clip-path.
- Overlay flash = `motion.div` frère de l'image, `pointer-events-none`, `mix-blend-mode: screen`.
- Le dégradé/vignette existant (lisibilité titre) est conservé au-dessus du flash.
