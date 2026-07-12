# Fiche Immersive Jardin — "Immersion Stratifiée"

Route dédiée `/jardin/:slug` accessible depuis le bouton "Découvrir l'événement" **uniquement** pour les événements dont `event_type === 'jardin'`. Les autres types continuent vers `/m/:slug`.

## 1. Routing & branchement

- Ajouter la route `<Route path="/jardin/:slug" element={<ImmersiveGardenFiche />} />` dans `src/App.tsx`.
- Dans `src/components/carte-mdv/views/MapView.tsx` : le CTA "Découvrir l'événement" dans la popup teste `event_type` et cible `/jardin/${slug}` si `jardin`, sinon `/m/${slug}` inchangé.
- Idem partout où l'on link vers `/m/:slug` pour un event jardin depuis la carte (`ListView`, `TimelineView`, `EventCard` — vérifier et adapter uniquement les liens de type jardin).
- Fallback : si l'event chargé sur `/jardin/:slug` n'est pas de type jardin, redirection vers `/m/:slug`.

## 2. Composant `ImmersiveGardenFiche`

Fichier : `src/pages/ImmersiveGardenFiche.tsx`
Sous-composants dans `src/components/immersive-garden/` :
- `CanopeeHero.tsx` — hero photos Ken Burns
- `StrataArbustive.tsx`
- `StrataRhizosphere.tsx`
- `SeasonMatrix.tsx`
- `StratPanel.tsx` — panneau data rétractable réutilisable (jauges, chips)
- `OrganicButton.tsx` — bouton forme fluide (SVG blob)
- `SeasonOverlay.tsx` — filtres CSS + particules (neige/pollen/feuilles)

### Scroll-telling
- Framer-motion `useScroll` + `useTransform` sur un container plein hauteur (~400vh).
- 4 sections sticky qui s'enchaînent en fondu/parallaxe :
  1. Canopée (0-25%)
  2. Arbustive & herbacée (25-50%)
  3. Rhizosphère (50-75%)
  4. Matrice saisonnière + CTA (75-100%)
- Indicateur latéral discret (4 puces verticales) pour situer la strate.

## 3. Hero photos (Convivialité, Ken Burns)

- Réutiliser `useConvivialitePhotos(explorationId)` (déjà existant).
- Filtre `!is_hidden`, fallback sur `cover_image_url` si aucune photo Convivialité.
- Composant `<KenBurnsCarousel>` : 1 photo affichée en `object-cover` plein écran, transform `scale(1.1) → scale(1.25)` + translate lent (8 s), cross-fade sur 1,5 s vers la suivante, ordre aléatoire (shuffle une fois au mount).
- Overlay dégradé vert/gold pour lisibilité du titre.

## 4. Données dérivées (existantes)

Hook `useGardenStrataMetrics(eventId, explorationId)` qui compose :

- **Canopée / arbres** : compter `marcheur_observations` + `biodiversity_snapshots` où `iconic_taxon = 'Plantae'` avec strate arbre (via `plantStrate.ts`).
- **Arbustive** (zone 1) :
  - Abeilles / pollinisateurs : count `iconic_taxon = 'Insecta'` (jauge = ratio vs total insectes attendus, capped).
  - Papillons : count famille Lepidoptera.
  - Oiseaux : count `iconic_taxon = 'Aves'`.
- **Rhizosphère** (zone 2) :
  - Mycorhization : proxy = count `iconic_taxon = 'Fungi'` normalisé 0-100 %.
  - Microfaune : count `Insecta` sol + `Annelida` si présent.
  - Stockage carbone : dérivé qualitatif (Faible/Moyen/Élevé) à partir de la densité d'arbres.
- Toutes les jauges gèrent le cas 0 → affichage "En cours de recensement" plutôt qu'une valeur vide.

## 5. Panneaux data rétractables

- Position : rail droit, largeur 320 px desktop, drawer bas mobile.
- Trigger : chip organique flottante avec icône (Bee, Sprout, Worm…).
- Ouverture : `motion.div` slide + spring, backdrop-blur.
- Contenu : jauges arrondies (SVG stroke-dasharray), pastilles colorées, micro-légendes.

## 6. Matrice saisonnière

- Slider custom 4 crans (Printemps / Été / Automne / Hiver), forme organique.
- Applique un `SeasonOverlay` global (CSS filter + particules canvas légères) :
  - Printemps : teinte fraîche + pollen doré.
  - Été : saturation +, lumière chaude.
  - Automne : hue-rotate ambré + feuilles qui tombent.
  - Hiver : désaturation + neige.
- Mise à jour instantanée des visuels canopée + illustration rhizosphère (SVG stylisé, teinté).

## 7. CTA final

- Section 100vh sombre, particules douces.
- Bouton organique "Soutenir ce Jardin" → pour l'instant renvoie vers `/m/:slug` (page publique de l'event) — à câbler plus tard sur un flow don/adhésion.
- Lien secondaire discret "Voir la fiche événement classique" → `/m/:slug`.

## 8. Style & accessibilité

- Palette : verts profonds (`#1b3a2b`, `#2f5d3b`), bruns (`#3b2a1a`), gold (`#c9a24a`), crème.
- Typo titre : réutiliser la serif existante du projet ; tracking large.
- Respect `prefers-reduced-motion` : désactive Ken Burns + particules, transitions instantanées.
- SEO : `<Helmet>` avec titre "Jardin — {nom} | Marches du Vivant", description dérivée.

## 9. Détails techniques

- Framer Motion (déjà présent) pour toutes les animations — pas de nouvelle dépendance.
- Particules : petit canvas maison (~60 lignes) — évite d'installer tsparticles.
- Un seul appel data : hook combiné `useGardenFiche(slug)` qui charge event + exploration_id + photos convivialité + snapshots agrégés.
- Aucun changement backend, aucune migration.

## Fichiers touchés

Créés :
- `src/pages/ImmersiveGardenFiche.tsx`
- `src/components/immersive-garden/{CanopeeHero,StrataArbustive,StrataRhizosphere,SeasonMatrix,StratPanel,OrganicButton,SeasonOverlay,KenBurnsCarousel}.tsx`
- `src/hooks/useGardenFiche.ts`
- `src/hooks/useGardenStrataMetrics.ts`

Modifiés :
- `src/App.tsx` (route)
- `src/components/carte-mdv/views/MapView.tsx` (CTA popup)
- `src/components/carte-mdv/EventCard.tsx` + `views/ListView.tsx` + `views/TimelineView.tsx` (liens jardin)
