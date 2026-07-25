# Constellation animée — quand le GPS manque

## Constat

La vue Constellation actuelle (`GalleryConstellation.tsx`) suppose des coordonnées GPS pour poser chaque photo sur la carte et tracer un fil narratif. Or la plupart des photos remontent via WhatsApp, qui **strippe systématiquement l'EXIF GPS**. Résultat : carte vide, message "Aucune photo géolocalisée", et la promesse "balade visuelle" tombe à plat.

## Principe

Détecter automatiquement le taux de photos géolocalisées et **basculer** vers une vue **animée poétique** quand < 30 % ont un GPS (ou via toggle explicite `Carte` ↔ `Mouvement`). L'objectif : garder la métaphore « constellation » — points lumineux en mouvement, fils entre eux — mais **sans dépendance géographique**.

## Trois registres animés proposés (implémenter 1 par défaut + toggle vers les autres)

### 1. « Constellation Vivante » — orbites organiques (recommandé par défaut)

Fond noir profond dégradé bleu nuit, les 12 photos deviennent des **médaillons ronds lumineux** flottant sur des **orbites elliptiques** décalées, à vitesses différentes (les grandes orbites tournent lentement, les petites plus vite). 

- Fils fins ambrés reliant chaque photo à la suivante dans l'ordre narratif — les fils se **tendent et se relâchent** comme des élastiques au fil du mouvement.
- Hover sur une photo → l'orbite se **fige**, la photo passe au premier plan avec zoom léger, légende (auteur · date) apparaît en cartouche serif.
- Clic → **lightbox plein écran** avec navigation clavier (réutilise celle du Bento).
- Micro-particules (points lumineux) dérivent en arrière-plan pour donner la profondeur d'un ciel étoilé.
- Rotation continue ~40s pour un tour complet — assez rapide pour ressentir le mouvement, assez lent pour lire.

Techniquement : `requestAnimationFrame` + calcul positions polaires, pas de librairie lourde. `will-change: transform` pour la fluidité.

### 2. « Ruban de mémoire » — carrousel 3D infini

Les 12 photos défilent en **anneau horizontal 3D** (perspective CSS), comme un manège vu du dessus légèrement incliné.

- Défilement autonome lent (une photo/2s), pause au survol.
- Photo centrale au premier plan, légèrement plus grande, celles de côté floutées (`filter: blur`) et translucides.
- Fond dégradé crème → ambre pâle, ambiance carnet d'auteur.
- Flèches ← → discrètes, drag horizontal supporté (souris + tactile).
- Numéro d'ordre (1/12) et légende affichés sous la photo focus.

### 3. « Nuée » — Brownian float façon murmuration

Les 12 photos flottent librement dans le cadre, chacune avec sa propre **trajectoire pseudo-aléatoire douce** (mouvement brownien contraint). Elles se **repoussent légèrement** entre elles pour éviter les collisions.

- Ambiance plus abstraite, presque aquatique.
- Toutes les 6s, une photo est **mise en lumière** à tour de rôle : elle grossit, s'illumine, légende apparaît, puis retourne dans la nuée.
- Un fil ambré ténu suit l'ordre narratif mais **respire** avec le mouvement.
- Fond sombre avec léger grain, texture papier.

## UX de bascule

Toggle en tête de l'onglet Portrait devient :

`Mosaïque` · `Mouvement` · `Carte`

- **Carte** = actuelle GalleryConstellation, désactivée (grisée + tooltip) si 0 photo GPS.
- **Mouvement** = nouvelle vue animée. Sous-toggle interne discret pour choisir le registre (Orbites / Ruban / Nuée), état persisté en `localStorage` (`portrait.motionMode`).
- Auto-sélection au premier affichage : si ≥ 30 % GPS → Carte, sinon → Mouvement.

## Accessibilité & performance

- Respect `prefers-reduced-motion` : mouvement figé, photos disposées en grille circulaire statique, hover révèle la légende (pas d'animation continue).
- Pause automatique quand l'onglet n'est pas visible (`document.visibilityState`).
- Images déjà miniaturisées via le pipeline existant, pas de recharge.
- Animation en `transform` pur (GPU), pas de reflow.

## Fichiers touchés

- **Nouveau** `src/components/propriete/portrait/GalleryMotion.tsx` — orchestrateur avec les 3 registres (orbits/ribbon/swarm) en sous-composants internes ou fichiers voisins selon volume.
- **Nouveau** `src/components/propriete/portrait/motion/OrbitsField.tsx`, `RibbonCarousel.tsx`, `SwarmFloat.tsx` — un composant par registre.
- **Modif** `src/components/propriete/portrait/TabPortrait.tsx` — ajouter le mode `motion`, la logique auto-bascule GPS, et le sous-toggle registre.
- **Modif** `src/index.css` — quelques keyframes utilitaires si besoin (la majorité en JS pour orchestration précise).
- Lightbox mutualisée avec Bento (extraction légère si pas déjà factorisée).

## Livrable UX à valider

1. **Le registre par défaut** : Orbites (recommandé — le plus proche de la métaphore constellation), Ruban 3D, ou Nuée ?
2. **Auto-bascule GPS** : garder le seuil 30 % ou toujours proposer les deux vues au choix sans auto-select ?
3. **Implémenter les 3 registres d'entrée de jeu**, ou 1 seul en v1 puis itérer ?
