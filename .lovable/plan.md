## Objectif

Retravailler la barre de navigation flottante des fiches Jardin :
- Supprimer les gros chevrons bas-gauche / bas-droit.
- Regrouper **Retour · ‹ · n/total · Catégorie · ›** dans une **capsule flottante unique**, centrée en haut de la page (`top-4`), à la même hauteur que l'ancienne flèche retour.
- Remplacer le petit rond « flèche retour » par un **bouton texte « ← Retour »** intégré à cette capsule.
- Chevrons prev/next **plus petits** (32 px), fondus dans la capsule glass/or.

## UX cible

Une seule capsule `top-4 left-1/2 -translate-x-1/2 z-50`, verre foncé + bordure or, très fine et élégante :

```text
┌──────────────────────────────────────────────────────────┐
│  ← Retour   │   ‹   3 / 12 · Jardin   ›                 │
└──────────────────────────────────────────────────────────┘
```

- Séparateur vertical fin `bg-[#c9a24a]/25` entre « Retour » et le bloc prev/next.
- « Retour » : icône `ArrowLeft` + label « Retour » (masqué sous 380 px → icône seule), hover → glow doré.
- Chevrons : boutons ronds 32 px, `bg-transparent hover:bg-[#c9a24a]/15`, désactivés en bout de liste (opacité 30 %, curseur interdit).
- Compteur central : `n / total · Catégorie`, typographie serif italique, chiffre courant en `#c9a24a` bold.
- Si `total ≤ 1` → chevrons + compteur masqués, capsule ne montre que « Retour ».
- Raccourcis clavier `←` / `→` / `Esc` inchangés.
- Animation d'apparition douce (`opacity + y`), halo doré subtil au survol de la capsule entière.

## Style (design)

- Fond : `bg-black/45 backdrop-blur-xl`.
- Bordure : `border border-[#c9a24a]/35`, `rounded-full`.
- Ombre : `shadow-[0_10px_40px_-12px_rgba(201,162,74,0.35)]`.
- Hauteur cible : ~40 px (au lieu de 56 px pour les gros chevrons actuels), même axe vertical que l'ancien bouton retour (`top-4`).
- Padding : `pl-2 pr-3 py-1.5`.
- Typo compteur : `font-serif italic text-xs tracking-[0.22em] uppercase`.
- Toute la capsule respire la même palette or/nuit que le reste de la fiche jardin.

## Fichiers touchés

### `src/components/immersive-garden/GardenSiblingNav.tsx` (refonte complète)
- Nouvelle prop : `backHref: string` (remplace `onBack` en Link direct pour préserver le comportement navigateur ; on garde `onBack` pour la touche `Esc`).
- Structure : `<motion.nav>` unique, `fixed top-4 left-1/2 -translate-x-1/2`, contenu = `[Link Retour] | [Prev] [Compteur] [Next]`.
- Chevrons 32 px, sans halo lourd.
- Compteur masqué quand `total ≤ 1`, mais la capsule reste (juste « Retour »).
- Conserve la gestion clavier existante.

### `src/pages/ImmersiveGardenFiche.tsx`
- Supprimer le `<Link>` « retour discret » (lignes 169-176).
- Passer `backHref={sibling.backHref}` au `<GardenSiblingNav>` (en plus de `onBack` pour `Esc`).
- Aucune autre modification (transitions, hooks, overlay inchangés).

## Hors scope

- Pas de changement des transitions (`GardenTransitionOverlay`) ni du hook `useSiblingGardenEvents`.
- Pas de refonte de la fiche, du carrousel ni des autres composants.
- Aucun changement backend.
