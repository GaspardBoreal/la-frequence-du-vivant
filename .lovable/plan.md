## Diagnostic
En passant l'index en "points seuls + tooltip au survol", les 4 dots dorés de 6px sur fond sombre sont devenus quasi invisibles : l'index a l'air d'avoir disparu partout, alors que seule la strate 2 devait le masquer.

## Objectif
Rendre l'index à nouveau lisible **partout** (labels + points visibles en permanence), tout en conservant deux comportements :
1. **Il passe visuellement sous le panneau vivant** (StratPanel) grâce à un z-index inférieur — quand un panneau opaque le croise, il disparaît naturellement derrière.
2. **Il s'efface uniquement pendant la strate 2 (Rhizosphère)** — la seule section où le texte de droite entre en collision avec la colonne de l'index.

## Implémentation

**Fichier : `src/pages/ImmersiveGardenFiche.tsx`**

1. **`IndicatorDot`** :
   - Restaurer le `<span>` label **toujours visible** à côté du point (comme avant, style italic doré `text-[10px] tracking-[0.25em] uppercase text-[#f4ecd4]/70`).
   - Retirer la logique tooltip / group-hover.
   - Réintroduire `labelOpacity` via `useTransform` **uniquement pour la strate Rhizosphère** : passer un prop `fadeDuringActive?: boolean`. Si vrai, appliquer `opacity` qui descend à ~0.05 dans `[start, end]` et remonte à 1 hors de cet intervalle. Si faux (autres strates), label toujours à opacité 1.
   - Support `useReducedMotion()` : si réduit, opacité fixe 1.

2. **`StratIndicator`** :
   - Conteneur reste `fixed right-4 top-1/2 -translate-y-1/2 z-20 hidden md:flex flex-col gap-4` — le `z-20` garantit qu'il passe **sous** les StratPanel (z-30) et le texte de la strate 2 (z-30).
   - N'activer `fadeDuringActive` que sur `<IndicatorDot label="Rhizosphère" start={0.5} fadeDuringActive />`.
   - Les 3 autres (Canopée, Arbustive, Saisons) restent en label visible permanent.

3. **Point (dot)** : animation `opacity` (0.35 ↔ 1) et `scale` (1 ↔ 1.6) conservée pour toutes les strates — le point actif reste toujours repérable, seul le label texte de la Rhizosphère s'efface.

## Hors scope
- Ne pas modifier les StratPanel ni les sections.
- Ne pas déplacer l'index.
- Ne pas ajouter de librairie.
