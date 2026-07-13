## Diagnostic

Le screenshot montre le Hero de l'immersion Vignoble **quasi-vide** : titre invisible, méta invisible, second CTA fantôme, scroll cue absent. Seuls survivent le cartouche « GRAND CRU DU VIVANT », le filet or et le bouton bordeaux « MARCHER CE VIGNOBLE ».

### Cause racine (bug de contraste)

`VignobleHero` utilise `min-h-screen` + `justify-end` avec un gradient vertical `ink → wine → paper` (crème). Tout le texte du hero est en `text-[hsl(var(--vignoble-paper))]` (crème) mais **le contenu est ancré en bas du hero**, là où le gradient est déjà arrivé à `paper` : on affiche donc du crème sur du crème. La photo de couverture n'existe pas pour Château Boutinet → c'est la branche `else` (gradient sans image) qui s'applique, et elle finit en crème.

Symptômes visibles :
- H1 → invisible (paper sur paper)
- Ligne date/lieu → invisible
- Bouton « Explorer le domaine » (variant outline transparent + texte paper) → invisible
- Pills Top-bar → uniquement le contour or reste
- Le "Sept chapitres" en bas → invisible

Le bouton « Marcher ce vignoble » est le seul lisible car il a son propre fond bordeaux plein.

### Cause secondaire (design)

Sans photo de couverture, le hero se rabat sur un simple gradient monotone. Pas de « wahouh » : aucun ornement structurant, aucune signature Terroir Noble. On voit littéralement un aplat crème.

---

## Plan — Refonte du Hero Vignoble « Cellier Noble »

Une seule intervention, **scopée au composant `VignobleHero`** dans `src/components/vignoble/VignobleImmersion.tsx` (+ quelques tokens/keyframes dans `src/index.css`). Aucune refonte des autres actes.

### 1. Fond « Terroir Noble » plein-cadre (fix contraste)

Remplacer le gradient qui vire au crème par un **fond ink profond stable** sur toute la hauteur du hero, avec :
- Un halo radial `wine` diffus derrière le titre (spotlight théâtral).
- Une **texture grain SVG** subtile (`opacity: 0.06`) en overlay pour la matière papier/lithographie.
- Un **filet or continu** en haut ET en bas du hero (double liseré éditorial).
- Une **transition « fondu vers paper »** dédiée sur les 96px finaux uniquement, pour raccorder proprement au chapitre I sans manger le contenu.

Résultat : texte crème garanti lisible partout dans le hero.

### 2. Composition « Cartel de Grand Cru »

Centrer verticalement (`justify-center`) et structurer en 6 lignes rythmées :

```text
                    ✦  ACTE I / VII  ✦          ← numérotation romaine or, tracking large
              ┌─── GRAND CRU DU VIVANT ───┐     ← cartouche existant, agrandi
              
                    Château Boutinet
              LE VIGNOBLE VIVANT             ← H1 en 2 lignes, Cormorant italic sur ligne 1
                                                romain sur ligne 2, très gros (clamp 3-7rem)
                    ── filet or ──
                    
              26 SEPTEMBRE 2026 · BERGERAC    ← petite capitale espacée, séparateur ·
              
           [ MARCHER CE VIGNOBLE → ]   [ Explorer le domaine ]
                                                ← 2e CTA passe en ghost avec bord or +
                                                  fond ink/40 backdrop-blur (visible)
```

### 3. Sceau de cire (signature visuelle « wahouh »)

Coin supérieur droit, en overlay absolu : un **médaillon SVG « sceau de cire »** de 120px, cerclé or, gravé « BOUTINET · 2026 · VIVANT » en circulaire, avec une grappe stylisée au centre. Rotation légère (-8°), ombre douce. Animation d'entrée : scale 0.6 → 1 + fade sur 900ms.

### 4. Colonne décorative de vigne (côté gauche desktop)

Sur `lg:`+ uniquement : une **branche de vigne SVG verticale** (feuilles + vrilles) le long du bord gauche, opacité 0.18, or pâle, qui s'anime au scroll (parallax léger). Purement décorative, `aria-hidden`.

### 5. Numérotation romaine « ACTE I / VII »

Au-dessus du cartouche, en très petites capitales or espacées, remplace le « Sept chapitres » du bas. Renforce la narration en 7 actes déjà en place et cohérent avec `ChapterProgress`.

### 6. Scroll cue repensé

En bas centre : filet or vertical animé (24px → 48px en boucle) + label italique « Descendre au domaine ». Cohérent avec l'écriture éditoriale.

### 7. Micro-motion

- Titre : mask reveal ligne par ligne (clip-path inset 0 100% 0 0 → 0 0 0 0), 900ms ease-out, décalé.
- Filet or : dessin left-to-right sur 700ms après le titre.
- Sceau : scale/rotation en dernier (1.4s delay).
- Respect de `prefers-reduced-motion` : tout devient fade simple.

### 8. Fallback photo de couverture

Quand `event.cover_image_url` **est** défini : on garde la logique image + parallax existante, mais on assombrit davantage (overlay `ink/85`) pour préserver la même lisibilité crème que le mode « no-image ». Le sceau + la vigne restent visibles par-dessus.

---

## Fichiers touchés

- `src/components/vignoble/VignobleImmersion.tsx` — refonte du composant `VignobleHero` uniquement (les 6 actes suivants et `ChapterProgress` sont intouchés).
- `src/index.css` — ajout de 3 utilitaires : `.vignoble-grain` (texture SVG data-uri), `.vignoble-hero-bg` (fond composite ink + halo wine radial), keyframes `vignoble-scroll-cue` et `vignoble-title-reveal`.

Aucune modif backend, aucune modif de données, aucune régression sur les autres marches (le composant n'est monté que pour `category === 'vignoble'`).

## Vérification

- Ouvrir `/m/chateau-boutinet-le-vignoble-vivant-2026-09-26` : titre, date/lieu, les deux CTA et le scroll cue doivent être **immédiatement lisibles**.
- Sceau de cire visible en haut-droite avec animation d'entrée.
- Branche de vigne perceptible sur desktop uniquement.
- Le raccord avec le chapitre I (« Le Domaine ») reste doux (fondu 96px).
