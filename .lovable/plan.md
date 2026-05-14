# Indices de biodiversité — Synthèse → Taxons

## Vue d'ensemble

On garde le graphique d'abondance actuel **en tête de section** (inchangé), et juste en-dessous on insère un **bloc à 5 onglets** "Lecture écologique du peuplement" :

```text
┌─ Graphique d'abondance (existant, inchangé) ─┐
└──────────────────────────────────────────────┘

┌─ Lecture écologique ─────────────────────────┐
│ [Richesse] [Simpson] [Shannon] [Piélou] [Simulateur] │
│ ─────────────────────────────────────────────│
│  Toggle global : ⦿ Individus GPS  ○ Observations brutes  │
│  Périmètre : species-level uniquement                    │
│                                                          │
│  ┌─── Hero jauge radiale animée ───┐                    │
│  │            ╭──────╮              │                    │
│  │           │ 0.78  │   ← compteur │                    │
│  │            ╰──────╯      animé   │                    │
│  │   Diversité hétérogène ✦         │                    │
│  └──────────────────────────────────┘                    │
│                                                          │
│  Mini-storytelling :                                     │
│   « Sur ce territoire, deux individus tirés au          │
│     hasard ont 78 % de chances d'appartenir à des       │
│     espèces différentes. »                              │
│                                                          │
│  Repères : ░ Monoculture (0.1)  ▓ Forêt mature (0.85)   │
│                                                          │
│  ▾ Aller plus loin (accordéon)                          │
│      • formule + interprétation détaillée               │
│      • top contributeurs à l'indice                     │
│      • barres p_i (Pareto)                              │
└──────────────────────────────────────────────────────────┘
```

## Onglets

### 1. Richesse spécifique (refuge de l'existant)
- Le graphique en barres et la liste des taxons actuellement affichés sous "Taxons" sont **déplacés tels quels** dans cet onglet.
- Hero KPI : `S = nombre d'espèces species-level distinctes`.
- Mini-story : « Vous avez croisé **S** espèces différentes ici. »

### 2. Simpson — Indicateur de dominance
- Affiche **deux jauges côte-à-côte** : `D` (dominance, 0→1) et `1−D` (diversité, 0→1).
- Couleur : `1−D` proche de 1 → vert émeraude (sain) ; proche de 0 → ambre (monopole).
- Story dynamique selon valeur :
  - `1−D > 0.8` → « Diversité élevée, aucun taxon n'écrase les autres. »
  - `0.4 < 1−D ≤ 0.8` → « Quelques espèces dominent sans monopoliser. »
  - `1−D ≤ 0.4` → « Forte dominance de **<top espèce>** — vulnérabilité écologique. »
- Repères : Monoculture / Prairie / Forêt tempérée mature.

### 3. Shannon-Wiener — Hétérogénéité
- Jauge radiale `H'` (échelle 0 → ln(S) avec graduation contextuelle, et badge "≈ richesse équivalente").
- Story : « Votre territoire équivaut à un milieu de **e^H' ≈ N** espèces parfaitement équilibrées. »
- Sensibilité aux rares mise en avant : icône 🌿 pour chaque espèce dont la suppression ferait chuter `H'` de >5 %.

### 4. Piélou — Régularité
- Jauge `J' = H'/ln(S)` entre 0 et 1, palette dégradée.
- Story :
  - `J' > 0.85` → « Harmonie — toutes les espèces ont des effectifs comparables. »
  - `J' < 0.4` → « Une espèce écrase les autres : **<top>** représente **X %** des individus. »
- Visualisation complémentaire : courbe rang-abondance (Whittaker), pente plate = équitable, falaise = dominance.

### 5. Simulateur — pré-rempli avec les données réelles
Inspiré de la capture, mais branché sur l'exploration :
- Au chargement : top 5 espèces réelles du territoire (avec noms FR via `<SpeciesName />`) et leurs effectifs réels.
- Sliders 0→200 par espèce + bouton **+ Ajouter une espèce** / **Réinitialiser** / **Charger un scénario** (Monoculture, Équilibré, Forêt mature).
- KPIs en temps réel en haut : `Total individus`, `Shannon`, `Simpson (1−D)`, `Piélou`.
- Mini-graphe en barres synchronisé + 3 jauges horizontales animées.
- Pédagogie : un slider "Écraser sous une espèce dominante" qui pousse 90 % du total sur la première espèce et anime la chute des indices.

## Design system / wahouhh

- **Jauges radiales** SVG custom (pas de Recharts) : arc de cercle dégradé `--emerald-glow` → `--ambre`, aiguille fine, compteur animé via `useAnimatedCounter`, halo pulsé sur la valeur finale.
- **Tokens uniquement** (HSL) — light Papier Crème / dark Forêt Émeraude.
- Apparition : `motion.div` avec `whileInView`, stagger 80 ms sur les éléments (hero → story → repères → accordéon).
- Tabs : composant `Tabs` shadcn déjà en place, variants custom underline + icône lucide par onglet (`Layers`, `Crown`, `Waves`, `Scale`, `Sliders`).
- Légende explicative : encart `bg-muted/40 backdrop-blur` avec icône `Info`, formule en `font-mono`, paragraphe court, bouton "Voir un exemple" qui jump-scroll vers le simulateur pré-rempli avec un scénario démonstratif.

## Logique de calcul

Nouveau `src/utils/biodiversityIndices.ts` :
- `computeAbundance(species, mode)` → `{ scientificName, label, n }[]` à partir de `species_data.attributions`.
  - `mode = 'individuals'` → réutilise `countIndividuals(...)` du clustering GPS 8 m (déjà prévu via la "Canopée").
  - `mode = 'observations'` → `attributions.length`.
  - Filtre `rank === 'species'` (species-level uniquement).
- `computeIndices(abundance)` → `{ S, N, D, simpsonDiversity: 1-D, H, Hmax: ln(S), J: H/Hmax, effectiveSpecies: exp(H), topShare, topSpecies }`.
- `interpretIndex(kind, value, ctx)` → string narrative + niveau (`harmony | balanced | dominated | critical`) + couleur token.
- 100 % client, mémoïsé via `useMemo` keyé sur `(snapshotId, mode)`.

## Toggle de comptage (header global du bloc)
- `Switch` "Comptage par individu GPS" persisté en `localStorage` (clé `bio-indices-mode`).
- Petit `Popover` info qui explique : « En mode individus, plusieurs photos d'un même pied (< 8 m) sont fusionnées. »

## Fichiers

**Nouveaux**
- `src/utils/biodiversityIndices.ts` — calcul des indices.
- `src/components/community/synthese/TaxonsIndicesPanel.tsx` — wrapper Tabs + toggle.
- `src/components/community/synthese/indices/RichnessTab.tsx` — réutilise l'existant.
- `src/components/community/synthese/indices/SimpsonTab.tsx`
- `src/components/community/synthese/indices/ShannonTab.tsx`
- `src/components/community/synthese/indices/PielouTab.tsx`
- `src/components/community/synthese/indices/BiodiversitySimulator.tsx`
- `src/components/community/synthese/indices/RadialGauge.tsx` — jauge SVG animée réutilisable.
- `src/components/community/synthese/indices/IndexLegend.tsx` — bloc légende formule + interprétation.
- `src/components/community/synthese/indices/RankAbundanceCurve.tsx` — courbe Whittaker pour Piélou.

**Modifiés**
- `src/components/community/EventBiodiversityTab.tsx` — déplace l'actuel bloc Taxons dans `RichnessTab`, ajoute `<TaxonsIndicesPanel />` sous le graphe.

**Aucune migration DB.**

## Détails techniques

- Jauge SVG : arc `pathLength=100`, `strokeDasharray={value*100, 100}`, transition `stroke-dashoffset` 1.2 s `cubic-bezier(0.22, 1, 0.36, 1)`.
- Animations : Motion for React (`motion.path`, `useSpring` pour le compteur).
- Accessibilité : chaque jauge expose `role="meter"` + `aria-valuemin/max/now` + label.
- Performance : indices recomputés uniquement si `species_data` ou `mode` changent.
- Pas de nouvelle dépendance (D3 déjà prévu pour Canopée, mais les jauges ici sont SVG natives).

## Hors scope (à confirmer ultérieurement)
- Comparaison inter-explorations (« vs autres territoires »).
- Export CSV/PDF des indices.
- Story Impact dédiée aux indices (peut être ajoutée plus tard à la suite des Impact Stories).
