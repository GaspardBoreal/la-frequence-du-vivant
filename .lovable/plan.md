# Évolution de la biodiversité — graphique temporel inspirant

## Objectif

Enrichir l'onglet **Synthèse → Taxons observés** d'un module narratif "Pouls de la biodiversité" qui raconte visuellement la découverte du vivant sur l'exploration, à la fois pour les marcheurs (émerveillement) et les futurs organisateurs (preuve d'impact).

## Emplacement

Nouveau composant `BiodiversityEvolutionChart` inséré **en haut de l'onglet Taxons observés** (au-dessus du `SpeciesExplorer`), dans `EventBiodiversityTab.tsx`. Réutilisable plus tard sur les pages publiques `/lecteurs/`.

## Architecture visuelle

```text
┌─────────────────────────────────────────────────────────────┐
│  Pouls du vivant                          [Espèces|Obs.]    │
│  87 espèces découvertes depuis le 12 mars 2024              │
│                                                             │
│  ╱╲                                                ╱── 87   │
│ ╱  ╲___                                       ____╱         │
│╱       ╲___________                      ____╱              │
│            ░ ▒ ░  ▒░ ░    ▒    ░ ░  ▒ ░ ░    (barres jour) │
│ Mar       Avr       Mai       Jun       Jul       Aoû      │
│                                                             │
│  [Tout] [12 mois] [6 mois] [3 mois] [30j]   ⓘ Date terrain │
│                                                  ⚪ Collecte │
└─────────────────────────────────────────────────────────────┘
```

- **Aire cumulée** (gradient émeraude, courbe douce monotone-x) — la narration principale.
- **Bande grise quotidienne** (mini-barres en arrière-plan, opacité 30%) — le pouls réel jour par jour.
- Animation d'entrée : tracé progressif de la courbe (path stroke-dashoffset, 1.4s ease-out).
- Au survol d'un point : tooltip discret (date, valeur cumulée, valeur du jour, "+N nouvelles espèces").
- Au clic : ouvre une **drawer latérale** détaillée.

## Contrôles (sobriété informationnelle)

Trois toggles, alignés sous le graphique :

1. **Métrique** — `Espèces` ↔ `Observations` (segmented pill).
2. **Période** — `Tout · 12 mois · 6 mois · 3 mois · 30 jours` (chips horizontales). Par défaut : `Tout`.
3. **Source de date** — petit selector discret en bas à droite : `Date d'observation terrain` (défaut, raconte le vivant) ↔ `Date de collecte` (analytique). Tooltip explicatif au survol du `ⓘ`.

Mode par défaut : **cumulé sur toute la période** (aire) **+ pulse quotidien** (barres grises) — la combinaison la plus inspirante.

## Drawer "Ce jour-là"

Au clic sur un point (ou une journée), drawer latérale (réutilise le pattern existant de `MarcheurPortfolioDrawer`) avec trois sections séparées :

### 1. Espèces
- **Nouvelles espèces du jour** (badge "Première observation", icône étincelle) — section mise en avant.
- **Re-observées ce jour-là** (repliable, plus discret).
- Chaque espèce : photo miniature, nom français + scientifique, taxon coloré, lien vers la fiche dans `SpeciesExplorer`.

### 2. Marches actives
- Liste des étapes (marches) où des observations ont eu lieu ce jour, avec mini-carte ou puce de couleur, distance/durée si dispo, lien vers la marche.

### 3. Contributeurs iNaturalist
- Avatar + pseudo iNat + nombre d'observations du jour, lien externe vers le profil iNat.
- Si un contributeur correspond à un marcheur (matching NFD via `identity-matching-logic`), badge "🌿 Marcheur de l'exploration" et lien interne vers son portfolio.

## Données — source unique

Tout vient de `biodiversity_snapshots` déjà chargé pour l'exploration :
- `snapshot_date` → axe "Date de collecte".
- `species_data[].observations[].observed_on` (ou champ équivalent dans le JSON iNat) → axe "Date terrain" (prioritaire selon Core memory `Freshness`).
- `species_data[].observations[].user.login` → contributeurs.
- `species_data[].observations[].marche_id` (ou rapprochement par coordonnées) → marches actives.

**Déduplication stricte** : par `scientificName` (memory `global-count-consistency-logic`). Une espèce n'incrémente le cumul **qu'au premier jour** où elle apparaît.

## Détails techniques

- **Nouveau hook** `useBiodiversityEvolution(explorationId, { dateSource, metric, period })` :
  - Récupère snapshots via le hook existant `useExplorationBiodiversitySummary` (pas de requête supplémentaire).
  - Construit un `Map<dayISO, { newSpecies: Set, allSpecies: Set, observations: Obs[], marches: Set, contributors: Map }>`.
  - Renvoie `{ series: [{ date, cumulative, daily, newSpeciesCount }], byDay: Map }` mémoïsé.
- **Nouveau composant** `BiodiversityEvolutionChart.tsx` (recharts — déjà dans le projet) : `ComposedChart` avec `Area` (cumulé) + `Bar` (quotidien gris).
- **Nouveau composant** `DayDetailDrawer.tsx` qui consomme `byDay.get(selectedDay)`.
- **Empty state** : si < 2 jours de données, message poétique "L'histoire commence à peine — revenez après la prochaine marche".
- **Période** : filtre côté client sur la série, recalcul du cumulé relatif à la borne de début de la période sélectionnée (option : afficher aussi le cumul absolu en pointillé pour contexte).
- **Tokens design** : `--primary` (émeraude) pour l'aire, `--muted-foreground` pour les barres, dégradé via `--gradient-primary` déjà défini. Aucune couleur en dur. Dark/light themes auto.
- **Responsive** : sur mobile (< 640px), chips de période deviennent un select compact, drawer en bottom-sheet plein écran.
- **Accessibilité** : `aria-label` sur chaque point, navigation clavier sur la série (←/→), annonces SR au changement de jour sélectionné.

## Fichiers touchés

- **Créer** : `src/hooks/useBiodiversityEvolution.ts`
- **Créer** : `src/components/community/exploration/BiodiversityEvolutionChart.tsx`
- **Créer** : `src/components/community/exploration/DayDetailDrawer.tsx`
- **Modifier** : `src/components/community/EventBiodiversityTab.tsx` (insérer le chart en tête de l'onglet `taxons`).
- **Mémoire** : ajouter `mem://features/mon-espace/biodiversity-evolution-chart-logic`.

## Hors scope (à valider plus tard)

- Export PNG/CSV du graphique.
- Comparaison entre deux explorations.
- Projection / prédiction IA.
- Annotations manuelles (événements météo, marches notables) — possible v2.
