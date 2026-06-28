
# Mode plein écran Découverte

Nouveau bouton **Découvrir** à droite de Galerie/Liste qui ouvre un overlay plein écran (Fullscreen API) présentant les espèces actuellement filtrées sous 3 modes immersifs. Composant mutualisé, réutilisable sur toutes les grilles d'espèces (Biodiversité de la marche, Apprendre, Carnet…).

## 1. Architecture

```text
src/components/biodiversity/discover/
├── DiscoverFullscreen.tsx        # Overlay racine (Fullscreen API + raccourcis + gestes)
├── DiscoverModeSelector.tsx      # Hub d'accueil : 3 cartes (Enfant / Immersif / Prospectif)
├── DiscoverHeader.tsx            # Compteur + filtres actifs (chips) + close
├── modes/
│   ├── ImmersiveScreensaver.tsx  # Carrousel 4s, ken-burns + morph
│   ├── KidsMode.tsx              # Hub 4 mini-jeux dessin main
│   ├── games/
│   │   ├── MemoryGame.tsx
│   │   ├── WhoAmIGame.tsx        # Silhouette → 3 propositions
│   │   ├── KingdomSortGame.tsx   # DnD Faune/Flore/Champignon
│   │   └── ZoomDetailGame.tsx    # Chasse aux détails
│   └── Prospective2100.tsx       # Vue futuriste, 4 statuts + IA on-demand
└── useDiscoverData.ts            # Adapter species[] + filtres actifs (chips lisibles)
```

Bouton d'ouverture : nouveau `<DiscoverButton />` rendu à droite de `<SpeciesViewModeToggle />` dans `SpeciesExplorer.tsx`. Le hook `useDiscoverData` reçoit en props la même liste filtrée déjà calculée pour la Galerie, garantissant l'iso-périmètre.

## 2. Hub d'accueil (par défaut)

Au passage en fullscreen, écran de sélection plein écran avec 3 grandes cartes animées :
- **Enfant** — pictos crayonnés, palette papier/aquarelle
- **Immersif** — vignette parallaxée live
- **Prospectif 2100** — gradient nuit + horizon

Compteur "N espèces · filtres : Faune (18), Tous observateurs (4)…" en haut. Raccourcis `1` / `2` / `3` pour choisir, `Esc` pour fermer.

## 3. Mode Immersif — « Screensaver »

- Une espèce plein écran toutes les **4 s**, fade + ken-burns lent (scale 1 → 1.08).
- Transition cross-fade 600 ms entre espèces.
- Overlay bas gauche : nom FR (XXL), latin (italic), famille trophique, mini-pill `iNat`/photo marcheur.
- Barre de progression fine en bas.
- `Espace` = pause, `←/→` = naviguer, tap = pause/play (mobile).
- Lecture randomisée stable (seed = hash des IDs) pour cohérence en pause.

## 4. Mode Enfant — 4 mini-jeux dessin main

Look & feel : fond papier crème (#FAF6EC), traits crayon (filter SVG `feTurbulence` léger), font *Caveat* + *Patrick Hand* (via `@fontsource`). Animations bouncy `spring(stiffness 240, damping 18)`.

Hub présentant 4 vignettes dessinées :
1. **Memory** — paires photo ↔ nom FR (6/8/12 cartes selon nb espèces), retour 3D, compteur de coups.
2. **Qui suis-je ?** — silhouette générée par `filter: brightness(0) saturate(100%)` sur la photo + 3 propositions (1 bonne + 2 leurres tirés du même royaume).
3. **Tri Faune/Flore/Champignon** — drag-and-drop `@dnd-kit` de vignettes vers 3 paniers crayonnés.
4. **Chasse aux détails** — crop aléatoire 15% de la photo plein écran, zoom progressif, 4 propositions.

Chaque jeu : score, étoiles, bouton "Rejouer" / "Mode suivant". Tire **uniquement** dans la liste filtrée (fallback si <4 espèces : message doux "Élargis tes filtres pour jouer").

## 5. Mode Prospectif 2100 — Mixte

Look : nuit profonde `#08111F`, accents `cyan-300/amber-300`, grille horizon, particules lentes.

- Heuristique locale instantanée (`src/lib/prospective2100.ts`) calcule un **statut climat 2100** par espèce parmi 4 : Stable / En recul / Migrante / Nouvelle venue. Règles simples basées sur `iconicTaxon` + famille + tags écologiques déjà en base (ex. lépidoptères thermophiles → Nouvelle venue ; amphibiens → En recul).
- Affichage : grille bento, chaque carte = photo + halo coloré selon statut + 1 phrase générée par règle ("Le Tircis pourrait gagner du terrain au nord…").
- Bouton **« Approfondir avec l'IA »** par carte → edge function `prospective-2100-species` (Lovable AI / Gemini Flash), réponse mise en cache dans une table `species_prospective_2100_cache` (scientific_name PK, narrative text, status, generated_at). Lecture publique, écriture service_role.
- Pas d'appel IA automatique : zéro coût sans clic.

## 6. Interactions transverses

- **Fullscreen browser réel** via `document.documentElement.requestFullscreen()` + fallback overlay z-[2000] si refusé.
- **Raccourcis clavier** : `Esc` ferme, `1/2/3` switch mode, `←/→` navigue, `Espace` pause, `H` retour hub.
- **Gestes tactiles** : swipe horizontal = mode suivant/précédent, tap = pause, pinch désactivé hors Immersif.
- **Filtres actifs** affichés en chips lecture seule en haut ; bouton "Modifier les filtres" ferme l'overlay et rend le focus aux filtres.
- **A11y** : `role="dialog" aria-modal`, focus trap, `aria-label` sur tous les boutons icônes, `prefers-reduced-motion` coupe ken-burns/parallax.

## 7. Données

Source unique : `species[]` déjà filtré passé en prop (mêmes objets que la Galerie). Photos : réutilise `useSpeciesPhoto` + `SpeciesPhotoModeContext` (priorité marcheur → iNat) pour cohérence avec la Galerie.

## 8. Backend (minimal)

Migration unique :
```sql
CREATE TABLE public.species_prospective_2100_cache (
  scientific_name text PRIMARY KEY,
  status text NOT NULL,           -- 'stable'|'recul'|'migrante'|'nouvelle'
  narrative text NOT NULL,
  generated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.species_prospective_2100_cache TO anon, authenticated;
GRANT ALL ON public.species_prospective_2100_cache TO service_role;
ALTER TABLE public.species_prospective_2100_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read all" ON public.species_prospective_2100_cache FOR SELECT USING (true);
```
Edge function `prospective-2100-species` : input `{ scientific_name, common_name, iconic_taxon }`, appelle Lovable AI Gateway (Gemini Flash), upsert dans la table.

## 9. Livraison incrémentale

1. Squelette overlay + hub + bouton + Fullscreen API + raccourcis (sans modes).
2. Mode Immersif Screensaver.
3. Mode Prospectif (heuristique locale + cartes), edge function + cache + bouton IA.
4. Mode Enfant : Memory → Qui suis-je → Tri → Chasse.
5. Polish gestes tactiles, reduced-motion, fallback <4 espèces.

## Détails techniques

- Aucun changement aux hooks de données existants ; intégration via props.
- `framer-motion` (déjà installé) pour transitions / layout / spring. `@dnd-kit` déjà présent pour Tri.
- Fonts crayon via `@fontsource/caveat` et `@fontsource/patrick-hand` (à ajouter).
- Tokens couleur Enfant (papier crème, encre, aquarelle) ajoutés dans `index.css` sous `.discover-kids` pour ne pas polluer le thème global.
- Le composant `DiscoverFullscreen` est strictement présentationnel : tout l'état persiste localement (pas de Context global), garbage-collecté à la fermeture.
