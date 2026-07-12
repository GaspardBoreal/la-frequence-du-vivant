# Correctif jardin + boost wahou

## Diagnostic

Le clic ne route pas vers `/jardin/:slug` parce que la condition actuelle exige `event.is_public && event.public_slug`. L'événement testé (`a4f24960…`) n'est pas publié : `is_public = false` → on retombe sur `/admin/marche-events/:id`.

Preuve : la route active est `/admin/marche-events/a4f24960-1a6f-437c-a18e-1e7ea43373a5`.

## Fix routing

1. Route élargie : `/jardin/:slug` accepte **soit** un `public_slug` **soit** un UUID d'event.
2. `useGardenFiche(slugOrId)` :
   - Détection UUID (`/^[0-9a-f-]{36}$/i`) → query `marche_events` par `id`.
   - Sinon → query par `public_slug`.
   - RLS décide de la visibilité (admin voit tout, public voit `is_public=true`).
3. Générateurs de lien (MapView popup, EventCard, ConstellationView, MurDuVivantView) : pour un event de catégorie `jardin`, on route toujours vers `/jardin/…` avec priorité `public_slug` puis fallback `event.id`. On supprime la contrainte `is_public` pour les jardins.
4. Fallback `<Navigate>` si l'event chargé n'est pas de catégorie jardin → `/m/:slug` ou `/admin/marche-events/:id`.

## Effets wahou additionnels

Objectif : rendre l'immersion vraiment renversante à l'ouverture.

1. **Révélation du titre lettre par lettre** dans la Canopée (framer-motion stagger, italique serif qui « prend racine » avec un léger `y` + blur).
2. **Aurore vivante** : un halo doré qui suit doucement le curseur en fond de la Canopée (radial-gradient piloté par `useMotionValue`).
3. **Divider organique SVG** entre chaque strate (blob wave qui se déforme au scroll via `pathLength`).
4. **Chiffres clés en compteur animé** dans les StratPanel (0 → valeur, `useMotionValue` + spring).
5. **Rhizosphère enrichie** : vers de terre stylisés qui ondulent (SVG animé) + pulsations mycorhiziennes (dots qui respirent).
6. **Transition de saison teintée** : quand on change de saison, un flash coloré très bref (radial expand 700ms) traverse l'écran depuis le bouton cliqué.
7. **Bouton CTA final « Soutenir ce jardin »** : glow doré pulsant + micro-particules d'étincelles au hover.
8. **Cover image parallax** dans le hero (translate vertical léger au scroll, en plus du Ken Burns existant).

## Fichiers touchés

Modifiés :
- `src/hooks/useGardenFiche.ts` — accepte slug OU id, supprime le filtre `is_public`.
- `src/pages/ImmersiveGardenFiche.tsx` — révélation titre, aurore curseur, dividers, compteurs, transition saison, glow CTA.
- `src/components/immersive-garden/StratPanel.tsx` — compteur animé sur les valeurs display numériques.
- `src/components/carte-mdv/views/MapView.tsx` — routing jardin sans exiger `is_public`.
- `src/components/carte-mdv/EventCard.tsx` — idem.
- `src/components/carte-mdv/views/ConstellationView.tsx` — idem.
- `src/components/carte-mdv/views/MurDuVivantView.tsx` — idem.

Créés :
- `src/components/immersive-garden/OrganicDivider.tsx` — SVG blob wave séparateur de strate.
- `src/components/immersive-garden/CursorAurora.tsx` — halo doré qui suit le curseur (désactivé si `prefers-reduced-motion`).
- `src/components/immersive-garden/AnimatedCounter.tsx` — compteur numérique framer-motion.

Aucun changement BDD.
