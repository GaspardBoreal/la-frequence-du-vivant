## Objectif

Ajouter un 4ᵉ module au stepper Synthèse → Analyse IA : **« Origines & Flux »** (🌍). Une vue immersive qui fait voyager le lecteur vers les origines biogéographiques et historiques des espèces présentes sur toutes les marches d'un événement.

## Trois couches narratives fusionnées

1. **Aires de répartition natives** (GBIF) — pays d'origine biogéographique de chaque espèce, traduits en flux animés vers le territoire de l'événement.
2. **Descripteurs taxonomiques historiques** — Linné, Cuvier, Buffon… extraits de l'autorité scientifique (`scientificNameAuthorship`), géolocalisés à leur pays/époque.
3. **Observateurs citoyens contemporains** — iNat/eBird/GBIF déjà présents dans `biodiversity_snapshots.species_data[].attributions[]`, géocodés via leur `observerInstitution` / `locationName`.

## Expérience desktop / tablette (immersive plein écran)

```text
┌─────────────────────────────────────────────────────────┐
│  🌍 Origines & Flux du Vivant            [Plein écran ⤢]│
│  287 espèces · 42 pays d'origine · 18 descripteurs      │
├─────────────────────────────────────────────────────────┤
│                                                         │
│        ╭─ Carte monde (globe ou Mercator) ─╮            │
│        │   arcs animés Origin → Event       │            │
│        │   pulses dorés = descripteurs      │            │
│        │   pulses verts = observateurs      │            │
│        ╰────────────────────────────────────╯            │
│                                                         │
│  Filtres : [Toutes] [Faune] [Flore] [Champi] [Autres]   │
│  Couches : ☑ Natives  ☑ Descripteurs  ☑ Observateurs   │
├─────────────────────────────────────────────────────────┤
│  Top origines        │  Descripteurs        │ Observateurs│
│  🇧🇷 Brésil  · 34    │  Linné · 1758 · 🇸🇪   │ @marie_n · 12│
│  🇲🇽 Mexique · 21    │  Cuvier · 1817· 🇫🇷   │ @jean_b  · 8 │
│  …                   │  …                   │ …            │
└─────────────────────────────────────────────────────────┘
```

- **Globe interactif** (react-globe.gl ou Maplibre+arc layer) : rotation lente, arcs lumineux émergeant des pays d'origine vers le centroïde de l'événement, durée 3-4s, easing fluide.
- **Hover sur arc** : tooltip espèce + voyage (ex. « *Robinia pseudoacacia* — originaire des Appalaches, naturalisée ici depuis 1601 »).
- **Click sur pays** : drawer latéral listant les N espèces partageant cette origine, avec mini-fiches (photo iNat + nom FR + auteur).
- **Mode plein écran** (bouton ⤢) : la vue prend tout le viewport, header sticky compact.

## Expérience mobile (story scrollée verticale)

Pas de carte horizontale (illisible) — un **récit en sections snap** :

1. **Hero** : globe stylisé en SVG + chiffre clé « 287 espèces venues de 42 pays ».
2. **Carrousel des origines** : 1 carte par pays-source, drapeau XL, liste d'espèces emblématiques, arc SVG animé vers la France.
3. **Galerie des descripteurs** : portraits stylisés (silhouettes + emoji) Linné/Cuvier/etc., date, nombre d'espèces décrites présentes.
4. **Mur des observateurs** : avatars cercles iNat, top 10 contributeurs, lien vers leur profil.
5. **CTA** : « Ouvrir la carte du monde » → modal plein écran avec carte 2D Maplibre tactile.

## Données — pipeline

### Source A : snapshots existants (zéro coût)
- `biodiversity_snapshots.species_data[].attributions[]` → observateurs citoyens (déjà exploité par `useSpeciesObservers`).
- `species_data[].scientificNameAuthorship` → descripteur + année (déjà collecté par les edges de collecte, sinon parser depuis `scientificName`).

### Source B : enrichissement GBIF (nouveau)
Nouvelle table cache :
```sql
CREATE TABLE public.species_biogeography_kb (
  scientific_name text PRIMARY KEY,
  native_countries text[],          -- ISO-2 codes
  native_continents text[],
  introduced_countries text[],
  authorship text,                  -- "Linnaeus, 1758"
  describer_name text,              -- "Carl Linnaeus"
  describer_year int,
  describer_country text,           -- pays d'activité du descripteur
  describer_birth_year int,
  source text DEFAULT 'gbif',
  fetched_at timestamptz DEFAULT now()
);
GRANT SELECT ON public.species_biogeography_kb TO anon, authenticated;
GRANT ALL ON public.species_biogeography_kb TO service_role;
ALTER TABLE public.species_biogeography_kb ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read" ON public.species_biogeography_kb FOR SELECT USING (true);
```

Edge function `enrich-species-biogeography` :
- Input : `{ explorationId }` ou `{ scientificNames: string[] }`.
- Pour chaque espèce manquante : `GET https://api.gbif.org/v1/species/match` → `usageKey` → `GET /v1/species/{key}/distributions` (filtré sur `status: NATIVE`).
- Pour l'auteur : parse `scientificNameAuthorship` (regex `^(.+?),?\s*(\d{4})`) + petit dictionnaire FR pour les 30 auteurs majeurs (Linné, Cuvier, Lamarck, Buffon, Brongniart, Vieillot, Latreille, etc.) avec pays + bio courte.
- Upsert dans `species_biogeography_kb`.
- Throttle 5 req/s GBIF (respect TOS), batch de 50, retour `{ enriched, cached, failed }`.

### Hook orchestrateur
`useExplorationBiogeography(explorationId)` :
1. Récupère la liste d'espèces de l'event (réutilise `allSpeciesWithFrNames`).
2. Lit `species_biogeography_kb` pour celles déjà cachées.
3. Si > 10 % manquantes, déclenche l'edge en background (toast discret).
4. Agrège : `{ originCountries: Map<ISO, Species[]>, describers: Map<name, Species[]>, observers: SpeciesObserver[] }`.

## Implémentation — fichiers

### Nouveaux
- `supabase/migrations/<ts>_species_biogeography_kb.sql` — table + grants + RLS + index sur `fetched_at`.
- `supabase/functions/enrich-species-biogeography/index.ts` — pipeline GBIF + parsing autorité.
- `supabase/config.toml` — `[functions.enrich-species-biogeography] verify_jwt = false`.
- `src/hooks/useExplorationBiogeography.ts` — hook agrégateur + auto-trigger enrichissement.
- `src/lib/historicalDescribersDictionary.ts` — 30 auteurs majeurs (nom FR, pays, années, bio 1-ligne).
- `src/components/community/analyse/OriginsFluxPanel.tsx` — conteneur, gère responsive (mobile story vs desktop globe).
- `src/components/community/analyse/origins/WorldOriginsGlobe.tsx` — globe (react-globe.gl ou Maplibre arc layer).
- `src/components/community/analyse/origins/OriginsMobileStory.tsx` — sections snap mobile.
- `src/components/community/analyse/origins/DescribersGallery.tsx` — galerie portraits stylisés.
- `src/components/community/analyse/origins/CountryOriginDrawer.tsx` — drawer espèces par pays.
- `src/components/community/analyse/origins/OriginsFullscreenModal.tsx` — wrapper plein écran.

### Modifiés
- `src/components/community/analyse/AnalyseIAStepper.tsx` :
  - Ajout `STEPS[3]` : `{ key: 'origines', emoji: '🌍', short: 'Origines', title: 'Voyage vers les origines du vivant', subtitle: 'D'où viennent les 287 espèces de cet événement, qui les a nommées, qui les observe.', Icon: Globe, gradient: 'from-amber-500/15 via-rose-500/8 to-transparent', ring: 'ring-amber-500/30', glow: 'bg-amber-500/20' }`.
  - Render `<OriginsFluxPanel explorationId={explorationId} species={species} />` sur cette step.

## Dépendances

- Ajouter `react-globe.gl` (~200 KB gzip, three.js déjà transitif) **OU** utiliser Maplibre `arc-layer` via `@deck.gl/layers` si déjà présent. Choix : **react-globe.gl** pour le « wahou » desktop + Maplibre 2D pour le fallback mobile fullscreen.
- Aucune autre dépendance.

## Design — tokens

- Palette **« voyage »** : ambre `hsl(38 92% 50%)`, rose `hsl(340 75% 55%)`, émeraude existante pour l'arrivée.
- Arcs : gradient ambre→émeraude, opacité 0.7, glow CSS `filter: drop-shadow`.
- Globe : nuit étoilée (texture `earth-night.jpg` bundled, ~80 KB), atmosphère bleutée.
- Typo : titres en `font-semibold tracking-tight`, descripteurs en italique pour effet « gravure ».
- Toutes les couleurs via tokens sémantiques (pas de hex en dur dans les composants — extension de `index.css` si besoin de nouveaux tokens `--journey-arc-start/end`).

## Hors scope

- Pas de modification de la collecte biodiversité existante.
- Pas de changement des autres onglets (Synthèse, Taxons, Témoignages, Textes).
- Pas de portage sur la vue publique `/m/:slug` dans cette itération (réservé à la vue marcheur authentifiée).
- Pas d'historique chronologique animé (timeline de découvertes) — pourra être une v2.

## Validation

- Charger l'event courant (`5481e513…`) en desktop 1120px → globe rendu, arcs animés, drawer pays fonctionnel.
- Mode plein écran → viewport entier, header compact, ESC pour sortir.
- Resize < 768px → bascule auto sur `OriginsMobileStory`.
- Espèce sans donnée GBIF → fallback gracieux (pas de pays affiché, descripteur seul si dispo).
- Vérifier qu'aucune PII utilisateur n'est exposée (les observateurs citoyens sont déjà publics par construction iNat/eBird).