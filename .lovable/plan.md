## Objectif
Remplacer l'index latéral texte + point par un **index minimal : 4 points dorés seuls**, avec le label affiché uniquement au survol (desktop) ou au tap (mobile) via un tooltip. Plus aucune collision possible avec les textes des sections.

## Implémentation

**Fichier : `src/pages/ImmersiveGardenFiche.tsx`**

1. **`IndicatorDot`** — simplifier :
   - Supprimer le `<span>` label toujours visible et la logique `labelOpacity`.
   - Conserver l'animation existante du point (opacity/scale selon `scrollYProgress`).
   - Wrapper le point dans un conteneur `group relative` avec zone de hit élargie (`p-2 -m-2`) pour le survol.
   - Ajouter un tooltip label en position absolue à **gauche du point** (`right-full mr-3`), affiché via `opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity`.
   - Style tooltip : `text-[10px] tracking-[0.25em] uppercase text-[#f4ecd4]/90 font-serif italic whitespace-nowrap`, léger fond `bg-black/40 backdrop-blur-sm px-2 py-1 rounded`, `pointer-events-none`.
   - Ajouter `aria-label={label}` et `tabIndex={0}` sur le bouton pour l'accessibilité clavier.

2. **`StratIndicator`** — inchangé structurellement : conteneur fixe, gap resserré (`gap-5` pour aérer les points seuls), même position `right-4 top-1/2 -translate-y-1/2`.

3. **Mobile** — comportement identique à aujourd'hui : `hidden md:flex` (index desktop uniquement).

## Détails visuels
- Point actif : opacité 1 + scale 1.6 (déjà en place).
- Point inactif : opacité 0.35.
- Tooltip apparaît à ~150ms, disparaît à ~200ms (transition douce).
- Fond du tooltip discret pour rester lisible sur fond clair ou sombre.

## Hors scope
- Ne pas modifier le contenu ni la mise en page des sections.
- Ne pas ajouter de librairie de tooltip (implémentation Tailwind pure).
