# Hiérarchiser l'Accueil — Fréquence en héros, Progression en bandeau

## Objectif

Inverser le poids visuel : « Ma Fréquence du jour » devient le héros poétique (typographie serif large, ambiance lumineuse animée), « Votre rôle actuel » devient un bandeau compact (chip + barre fine + jalons en pastilles).

Direction validée : **Éveil Forestier**. Périmètre limité aux deux composants de l'onglet Accueil — pas de changement de logique métier.

## Changements

### 1. `FrequenceWave.tsx` → carte héros poétique

- Conteneur : `rounded-3xl`, padding généreux (`p-6 md:p-8`), fond emerald profond (semantic tokens : `bg-primary/90` ou `bg-emerald-600 dark:bg-emerald-900`), `shadow-xl shadow-primary/10`.
- Effet ambiant : halo conique animé (rotation lente 20s) en `opacity-20` derrière le contenu, plus le wave existant en discret arrière-plan.
- Eyebrow : « MA FRÉQUENCE DU JOUR » en small-caps, tracking large, couleur emerald-100/70.
- Citation : `text-2xl md:text-3xl` en **Playfair Display** (italique sur le 2e segment), couleur foreground claire sur fond sombre.
- Auteur : ligne séparée avec petit séparateur `h-px w-8` + lien source discret.
- Onglets catégorie (Géopoétique / Biodiversité / Bioacoustique) repositionnés en bas de carte, plus discrets (icônes seules, fond translucide).
- Pulse dot animé à côté de l'eyebrow.
- Charger Playfair Display une fois (via `index.html` `<link>` ou `@import` dans `index.css`).

### 2. `ProgressionCard.tsx` → bandeau compact (~70px de hauteur)

- Suppression du gros nombre `marchesCount` (4xl), de la phrase descriptive italique, et de la timeline complète des 5 rôles avec icônes+labels.
- Conserve : libellé « Rôle actuel », chip RoleBadge inline, % progression, barre fine `h-1`, jalons en pastilles.
- Layout :
  ```
  [Rôle actuel: ●Marcheur  Niveau 4]              [65%]
  ●━━━━━━━━━━●━━━━━━━━━━○━━━━━━━━━━○ → Éclaireur
  ```
- Padding `p-4`, `rounded-2xl`, semantic tokens (`bg-card`, `border-border`).
- Au clic sur la carte → ouvre un Drawer/Sheet avec le détail complet (timeline 5 rôles, phrase d'encouragement, prérequis formation/certification) — réutiliser le contenu actuel à l'intérieur du drawer pour ne rien perdre.

### 3. Spacing parent

- `AccueilTab.tsx` : passer `space-y-5` → `space-y-4` pour resserrer.

## Détails techniques

- Tokens : utiliser `bg-primary`, `text-primary-foreground`, `border-border`, `bg-card`. Pas de couleurs HEX en clair dans les composants.
- Animations : Framer Motion (déjà importé) pour le halo conique (`animate={{ rotate: 360 }}` infini) et l'apparition.
- Le drawer de détail rôle : utiliser `@/components/ui/sheet` (déjà dans shadcn). Trigger = click sur le bandeau compact entier.
- Aucun changement de props publique : `FrequenceWave` et `ProgressionCard` gardent leur signature.
- Aucun changement DB / RPC / hook.

## Hors périmètre

- Pas de modification de la barre d'onglets, du header, ni de la grille de quick actions (Mes marches / Zones×4 / Quiz éveil).
- Pas de modification du contenu des citations ni de la logique de sélection journalière.
