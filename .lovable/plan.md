
# Refonte du module « 🌍 Origines & Flux » (étape A)

Objectif : rendre le 4ᵉ onglet de Synthèse → Analyse IA lisible et immersif sur la marche en cours. La généralisation à toutes les marches + le branchement temps réel iNaturalist/eBird (étape B) sera traitée après validation visuelle.

---

## 1. Pays d'origine UNIQUE par espèce (type locality GBIF)

Aujourd'hui chaque espèce génère plusieurs arcs (tous les pays natifs). Conséquence : la carte est illisible et fausse cognitivement (un châtaignier ne « vient » pas de 20 pays).

Choix : **type locality GBIF** (lieu où l'espèce a été décrite scientifiquement la première fois).

Changements :
- **Migration BDD** : ajout sur `species_biogeography_kb` des colonnes
  - `type_locality_country` (text, code ISO-2)
  - `type_locality_label` (text, libellé GBIF brut, ex. « Suecia »)
  - `type_locality_lat`, `type_locality_lng` (double precision, optionnels — géocode best-effort du libellé)
- **Edge function `enrich-species-biogeography`** : enrichit ces champs en lisant `species/{key}` → champ `origin` + parsing de `typeLocality` ou `description`. Fallback : 1er pays natif si type locality absente. Conserve aussi `native_countries` pour info secondaire.
- **Hook `useExplorationBiogeography`** : agrégation `origins` basée UNIQUEMENT sur `type_locality_country` (1 espèce = 1 pays). Fallback `native_countries[0]` si null pour ne pas perdre l'espèce, avec flag `inferred: true`.

Sur le globe : 1 arc par espèce. Carte beaucoup plus lisible, narration juste.

## 2. Contrôles de zoom sur le globe

`react-globe.gl` expose `controls().enableZoom = true` mais sans UI. Ajout :
- Boutons `+` / `−` / `🎯 recentrer` en surimpression bas-droite (style cohérent avec `ZoomControls.tsx` existant : pill glassmorphism).
- Action : `controls.dollyIn(1.4)` / `dollyOut(1.4)` puis `controls.update()`.
- Bouton recentrer = `pointOfView({ lat: eventPoint.lat, lng: eventPoint.lng, altitude: 2.2 }, 1200)` + arrête `autoRotate` au 1er geste utilisateur.
- Désactivation auto-rotate dès interaction (`controls.addEventListener('start', …)`).
- Tablette/mobile : pinch-zoom natif déjà géré par OrbitControls, on ajoute juste les boutons (utiles au doigt).

## 3. Galerie des découvreurs — 3 modes

Nouveau composant `<DescribersGallery>` avec un switcher segmenté (3 icônes) en haut à droite, persistance localStorage `origins.describersView`. **Défaut = Grille de cartes**.

### Mode A — Grille de cartes (défaut)
- Grille responsive `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`.
- Carte : silhouette/emoji époque (🎩 XIXᵉ, 📜 XVIIIᵉ, 🔬 XXᵉ), nom + années (naissance–mort), pays + drapeau, badge « N espèces décrites ici ».
- Hover : élévation + gradient ambre/rose.
- Clic → drawer biographique (existant `DescriberDrawer`).

### Mode B — Mur immersif « Panthéon »
- Fond noir profond, portraits/silhouettes en cadres dorés type galerie de musée.
- Layout masonry (3 colonnes desktop, 2 tablette, 1 mobile carrousel horizontal snap).
- Halo doré au hover, plaque gravée en bas du cadre (nom + années).
- Animation d'entrée : fade staggered + légère parallaxe au scroll.

### Mode C — Frise chronologique
- Axe horizontal 1700 → 2026, graduation par décennies.
- Pastilles positionnées sur l'axe (année de description la plus ancienne du découvreur).
- Taille pastille = nb d'espèces. Couleur par siècle.
- Desktop/tablette : frise complète scrollable horizontalement.
- Mobile : frise verticale (axe vertical, pastilles à gauche/droite alternées).
- Clic pastille → même drawer biographique.

Toutes les variantes consomment le même `describers` du hook — zéro requête supplémentaire.

## 4. Responsive 3 niveaux

| Breakpoint | Globe | Galerie | Switcher modes |
|------------|-------|---------|----------------|
| **Mobile** (`< 768`) | Story verticale existante (`OriginsMobileStory`) enrichie : 1 pays / 1 espèce | Carrousel horizontal snap (grille) / vertical (panthéon, frise verticale) | Pills compactes en haut, sticky |
| **Tablette** (`768–1279`) | Globe 70vh + rankings condensés en dessous | Grille 2 col / Panthéon 2 col / Frise scroll-x | Switcher segmenté |
| **PC** (`≥ 1280`) | Globe 80vh à gauche + rankings/galerie à droite (split 2/3 – 1/3) | Grille 3-4 col / Panthéon 3 col / Frise complète | Switcher segmenté |

Bouton « Plein écran » sur le globe (desktop + tablette) inchangé.

---

## Fichiers touchés

```text
supabase/migrations/<new>.sql                                  (ajout colonnes type_locality_*)
supabase/functions/enrich-species-biogeography/index.ts        (parsing type locality + géocode)
src/hooks/useExplorationBiogeography.ts                        (agrégation 1 pays/espèce)
src/components/community/analyse/origins/
  ├─ WorldOriginsGlobe.tsx                                     (ZoomControls overlay + 1 arc/espèce)
  ├─ GlobeZoomControls.tsx                                     (NEW, pill glassmorphism)
  ├─ DescribersGallery.tsx                                     (NEW, switcher + 3 modes)
  ├─ describers/GridMode.tsx                                   (NEW)
  ├─ describers/PantheonMode.tsx                               (NEW)
  ├─ describers/TimelineMode.tsx                               (NEW)
  ├─ OriginsFluxPanel.tsx                                      (layout responsive 3 niveaux, intègre Gallery)
  └─ OriginsMobileStory.tsx                                    (1 pays unique par espèce)
```

Hors scope étape A : tout cron de mise à jour cross-marches, hook iNat/eBird realtime, pages publiques.

---

## Étape B (à valider après) — aperçu

- **Backfill robuste** : edge function `backfill-biogeography-all` paginée (200 espèces/run, throttle 5 req/s GBIF), planifiée via `pg_cron` quotidien.
- **Update temps réel** : trigger SQL sur `marcheur_observations` + nouvelles lignes `species_snapshots` → enqueue dans table `species_biogeography_queue`, worker edge function la draine. Coût GBIF : 1 hit par nouvelle espèce inédite seulement (cache KB cross-marches déjà en place).
- **Frugalité** : pas de re-fetch si `fetched_at < 180 jours` ; respecte les en-têtes `Retry-After` GBIF ; logs dans `species_biogeography_audit`.

Détails techniques de l'étape B livrés après validation visuelle de l'étape A.
