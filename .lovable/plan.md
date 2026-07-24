# Hero « Canopée » pour l'espace Propriété

## Constat

Le hero actuel de `/propriete/:slug` est une simple image plate de 208–288px avec un `object-cover`, un fondu vers le fond, puis le titre plaqué en dessous. Comparé au hero immersif de `/jardin/:slug` (KenBurnsCarousel plein écran, overlay noir progressif, titre serif italique doré, CTA organique, indicateur de scroll), c'est effectivement pauvre.

Bonne nouvelle : les mêmes photos hero (`get_garden_hero_photos`) et les mêmes primitives (`KenBurnsCarousel`, `OrganicButton`, `RevealText`, palette doré/crème `#c9a24a`/`#f4ecd4`) sont déjà en place dans `ImmersiveGardenFiche.tsx`. Il suffit de les transposer dans `ProprieteEspace.tsx` en les adaptant au contexte connecté.

## Transposition proposée

### 1. Hero plein écran « Canopée du propriétaire »

Dans `src/pages/ProprieteEspace.tsx`, remplacer le bloc hero (lignes 116–143) par une section `h-[85vh]` (pas `h-screen` — on garde la sticky header visible et le premier onglet devine-able en bas) :

- **Fond animé** : `<KenBurnsCarousel>` avec les mêmes photos que le hero public (récupérées via le RPC `get_garden_hero_photos` existant + fallback sur `propriete.photo_hero_url`, puis `cover` par défaut). Interval 7s, zoom Ken-Burns fluide.
- **Voile** : dégradé `from-black/70 via-black/30 to-background` en bas pour la lisibilité + fondu vers le contenu qui suit.
- **Kicker doré** : petit bandeau `Leaf` + « Espace Propriétaire · Marches du Vivant » en `#c9a24a`, tracking `0.35em`.
- **Titre serif** : `font-serif italic` `text-4xl md:text-6xl` en `#f4ecd4` avec `<RevealText>` (animation lettre-par-lettre déjà utilisée).
- **Sous-titre** : ville + description courte en `#f4ecd4/75`.
- **Badge rôle** : le badge « Votre rôle : PROPRIETAIRE » repositionné sous le titre, style verre `backdrop-blur bg-white/10 border border-[#c9a24a]/40` — le seul rappel « app connectée » dans le hero.
- **CTA organique** : `<OrganicButton variant="gold" pulse>` « Explorer votre diagnostic vivant » qui scroll doucement vers la section des onglets D.S.
- **Indicateur ↓** : « ↓ Descendez dans votre jardin » animé en bas.
- **Parallaxe** : `useScroll` + `useTransform` pour `scale` (1 → 1.15) et un `opacity` overlay noir qui monte à mesure qu'on descend, comme la version publique.

### 2. Header sticky : traité « verre sombre »

Le header sticky actuel (`bg-white/95`) casse l'immersion quand on est sur le hero. Le passer en `bg-background/40 backdrop-blur-xl` avec `border-b border-white/10` tant qu'on est en haut, avec l'icône, le nom, `AppSwitcher` et `ThemeToggle` en teinte crème. Il reste lisible sur photo grâce au blur + une légère ombre portée sous le texte.

### 3. Sous le hero

La section principale (badge rôle + h1 + description) devient redondante avec le hero — on la supprime. On garde directement `NudgeMarcheBanner` + les onglets D.S., avec un `<section id="diagnostic">` cible du CTA « Explorer ».

## Fichiers touchés

- `src/pages/ProprieteEspace.tsx` : refonte du header + hero + suppression du bloc titre redondant, ajout de `id="diagnostic"` sur les tabs.
- Nouveau hook léger `src/hooks/propriete/useProprieteHeroPhotos.ts` : réutilise `get_garden_hero_photos` (le RPC accepte déjà un event_id) en prenant le 1er `marche_event_id` lié à la propriété via `propriete_marche_events`, avec fallback sur `propriete.photo_hero_url`.
- Aucun autre composant modifié — on importe `KenBurnsCarousel`, `RevealText`, `OrganicButton` déjà présents dans `ImmersiveGardenFiche.tsx` (à extraire si inline, sinon référencer leur chemin actuel).

## Notes

- Aucun changement DB, aucun changement RLS.
- Le rendu reste responsive : `h-[70vh]` sur mobile, `h-[85vh]` desktop.
- Respect palette « Papier Crème » (light) et « Forêt Émeraude » (dark) pour tout ce qui suit le hero.
