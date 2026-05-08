# Améliorations du Nuage de mots (témoignages)

## 1. Filtrage des mots parasites

Fichier : `src/components/community/insights/testimonies/utils/tokenize.ts`

**Problème** : des fragments d'élisions (`quelqu` ← quelqu'un, `parce` ← parce que), des conjugaisons (`était`, `prend`, `passent`) et des mots vides (`vrai`, `truc`, `chose`, `fois`) apparaissent.

**Corrections** :

- **Couper aussi sur l'apostrophe** avant tokenisation, pour que `quelqu'un` produise `un` (filtré) au lieu de `quelqu`. Idem `aujourd'hui`, `jusqu'à`.
- **Étendre la stop-list** (formes accentuées ET désaccentuées, puisqu'on normalise NFD) :
  - Verbes très fréquents : `etait`, `etaient`, `etre`, `ete`, `prend`, `prends`, `prendre`, `prenait`, `prennent`, `passe`, `passent`, `passer`, `passait`, `va`, `vais`, `vont`, `allait`, `allais`, `dit`, `dire`, `disait`, `voir`, `vois`, `voit`, `voyait`, `vu`, `savoir`, `sait`, `savait`, `peut`, `pouvoir`, `pouvait`, `veut`, `vouloir`, `voulait`, `mettre`, `met`, `donne`, `donner`, `trouve`, `trouver`, `arrive`, `arriver`.
  - Locutions tronquées / mots de liaison : `parce`, `quelqu`, `aujourdhui`, `jusqu`, `lorsqu`, `puisqu`, `presqu`, `quoiqu`.
  - Mots peu signifiants : `truc`, `chose`, `choses`, `fois`, `vrai`, `vraie`, `vraiment`, `super`, `genre`, `etc`, `cetait`, `cest`, `juste`, `dejà`, `deja`, `enfin`, `donc`, `puis`, `aussi`, `tres`, `assez`, `parfois`, `souvent`.
  - Démonstratifs / interrogatifs restants : `celle`, `ceux`, `celles`, `quoi`, `dont`, `ou`.

- Garder le seuil `length ≥ 4` mais le passer à **≥ 5 pour les verbes courts** est risqué — on s'appuie plutôt sur la stop-list.

## 2. Redesign moderne du nuage

Fichier : `src/components/community/insights/testimonies/modes/WordCloud.tsx`

**Objectif** : passer d'un patchwork multicolore plat à un nuage **éditorial, élégant, plus poétique** — proche d'une œuvre typographique.

**Direction visuelle** :

- **Palette monochromatique** alignée sur la marque (Forêt Émeraude en dark, Papier Crème en light) avec **un seul accent** chaud (`amber`) pour les mots du top 5. Fini l'arc-en-ciel.
- **Typographie hiérarchisée** :
  - Top 3 : `font-serif italic` taille XL (jusqu'à 4rem), couleur accent.
  - Mots moyens : `font-semibold` sans-serif, `text-foreground`.
  - Mots faibles : `font-light` `text-muted-foreground`, opacité réduite.
- **Container** : carte avec `bg-gradient-to-br from-emerald-500/[0.03] via-card to-amber-500/[0.03]`, bordure douce, `rounded-3xl`, ombre `shadow-elegant`, padding généreux (`p-10 sm:p-14`), masque radial sur les bords (`[mask-image:radial-gradient(...)]`) pour fondu organique.
- **Layout** : `flex-wrap` centré avec `gap-x-4 gap-y-3`, **rotation aléatoire douce** (-6° à +6°) sur les mots non-top pour casser la grille.
- **Interaction** :
  - Hover : `scale-110`, halo lumineux (`drop-shadow-[0_0_12px_hsl(var(--primary)/0.4)]`), curseur `pointer`.
  - Mot actif : underline animée (motion `layoutId`).
- **Animation d'entrée** : stagger plus poétique (`delay: i * 0.04`, `ease: [0.22, 1, 0.36, 1]`), apparition `blur-sm → blur-0`.
- **Header discret** au-dessus : petit label `Les mots qui reviennent` en `uppercase tracking-[0.3em] text-xs text-muted-foreground`.

**Modal de détail** : même esprit éditorial — supprimer le vert vif, utiliser `text-foreground` + accent `amber-500` pour le mot-clé, fond `bg-card/95 backdrop-blur-xl`.

## Détails techniques

- Aucune nouvelle dépendance.
- Modifs limitées à 2 fichiers : `tokenize.ts` (stop-words + split apostrophe), `WordCloud.tsx` (rendu).
- Tokens sémantiques uniquement (pas de couleurs hardcodées hors palette Tailwind déjà utilisée par le projet).
- Compatible thèmes clair/sombre (déjà gérés par `text-foreground`, `bg-card`, etc.).
