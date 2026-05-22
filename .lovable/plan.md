## Objectif

Le filtre période (et son sélecteur de plage personnalisée) actuellement local au graphe **« Pouls du vivant »** doit piloter aussi :
- la **liste des espèces** en dessous (cartes),
- le **compteur global** (« 98 espèces trouvées », badge « Toutes (98) »),
- les **compteurs des onglets** Faune / Flore / Champignons / Autres,
- le **nombre d'observations affiché sur chaque fiche** espèce.

Le tout sur l'onglet *Synthèse → Taxons observés* (`EventBiodiversityTab` → sous-onglet `taxons`).

Les statistiques de l'onglet **Synthèse** (les 5 grands compteurs animés) restent inchangées : ce sont des totaux narratifs « depuis le début ».

---

## Architecture proposée

### 1. Sortir l'état période du graphe et le faire vivre dans le parent

Aujourd'hui : `period`, `customRange`, `dateSource` sont des `useState` internes à `BiodiversityEvolutionChart`.

Cible : ces états remontent dans `EventBiodiversityTab` (sous-onglet `taxons`) :

```ts
const [period, setPeriod] = useState<EvolutionPeriod>('all');
const [customRange, setCustomRange] = useState<{from?: string; to?: string}>();
const [dateSource, setDateSource] = useState<DateSource>('observation');
```

`BiodiversityEvolutionChart` devient contrôlé : il reçoit `period`, `customRange`, `dateSource`, `onPeriodChange`, `onCustomRangeChange`, `onDateSourceChange`. L'UI (Select + Popovers + toggle Date terrain/collecte) reste rendue à l'intérieur du graphe (zéro changement visuel).

L'état `metric` (Espèces / Observations) reste local au graphe : il ne concerne pas la liste.

### 2. Projeter chaque espèce à travers la période

Nouveau hook utilitaire `useSpeciesFilteredByPeriod(species, { period, customRange, dateSource })` dans `src/hooks/`. Il :

- résout `{ fromISO, toISO }` via la **même fonction `resolvePeriodRange`** que le hook d'évolution (à exporter depuis `useBiodiversityEvolution.ts` pour éviter toute dérive),
- pour `period === 'all'` → renvoie `species` tel quel (passe-plat),
- sinon, pour chaque `BiodiversitySpecies` :
  - filtre `attributions[]` aux observations dont la date (`observationDate` si `dateSource === 'observation'`, sinon date de collecte du snapshot rattaché) est dans la plage,
  - recalcule `observations = filteredAttributions.length`,
  - **exclut** l'espèce si `observations === 0` après filtrage,
  - renvoie un objet espèce immuable cloné `{ ...sp, attributions: filteredAttributions, observations: filteredAttributions.length }`.

Mode collecte : si `dateSource === 'collection'`, on filtre sur la date du snapshot d'origine de chaque attribution (déjà disponible via `attr.source`/snapshot parent — sinon, fallback : on garde l'espèce uniquement si son snapshot parent est dans la plage, sans toucher aux attributions).

### 3. Brancher la liste sur la liste filtrée

Dans `EventBiodiversityTab` (sous-onglet `taxons`) :

```tsx
const speciesFiltered = useSpeciesFilteredByPeriod(allSpeciesWithFrNames, {
  period, customRange, dateSource,
});

<BiodiversityEvolutionChart
  snapshots={snapshots}
  period={period} customRange={customRange} dateSource={dateSource}
  onPeriodChange={setPeriod} onCustomRangeChange={setCustomRange} onDateSourceChange={setDateSource}
  overrideTotalSpecies={speciesFiltered.length}
  /* …reste inchangé */
/>
<SpeciesExplorer
  species={speciesFiltered}
  trophicPool={allSpeciesWithFrNames}   /* le pool trophique reste complet */
  /* …reste inchangé */
/>
```

`SpeciesExplorer` n'a **aucun changement à faire** : ses `categoryStats`, ses compteurs d'onglets, son badge « N espèces trouvées » et ses `EnhancedSpeciesCard` (qui lisent `species.observations` et `species.attributions`) se mettent à jour automatiquement.

### 4. Cohérence du graphe avec la liste

`overrideTotalSpecies` (badge « X / Y espèces » sur le graphe) passe de `stats.total` à `speciesFiltered.length` pour que graphe et liste affichent toujours le même total.

Le `BiodiversityEvolutionChart` continue de calculer sa courbe cumulative via `useBiodiversityEvolution` (inchangé) — cohérence garantie car les deux pipelines partagent `resolvePeriodRange`.

### 5. Snapshot chatbot

`useChatTabSnapshot('taxons', …)` doit refléter la liste filtrée : on injecte `period`, `customRange`, `speciesFiltered.length` dans le slice « taxons » pour que l'IA voie le périmètre réel.

---

## Fichiers touchés

| Fichier | Action |
|---|---|
| `src/hooks/useBiodiversityEvolution.ts` | Exporter `resolvePeriodRange` |
| `src/hooks/useSpeciesFilteredByPeriod.ts` | **Nouveau** hook de projection |
| `src/components/community/exploration/BiodiversityEvolutionChart.tsx` | Rendre contrôlé (props `period/customRange/dateSource` + handlers), supprimer les `useState` correspondants |
| `src/components/community/EventBiodiversityTab.tsx` | Lever les états, appeler le hook de projection, brancher `speciesFiltered` sur `<SpeciesExplorer>` + `overrideTotalSpecies` |
| `src/components/biodiversity/SpeciesExplorer.tsx` | **Aucun changement** (purement piloté par la prop `species`) |

## Hors scope

- Onglet Synthèse (compteurs animés « depuis le début »).
- Onglet Indicateurs, Témoignages, Textes, Analyse IA.
- Tabs de niveau supérieur (Carte, Marches, …).
- Pas de changement de schéma DB, pas d'edge function.

## Vérifications visuelles à faire après build

1. Sélectionner « 7 derniers jours » → le graphe se restreint, le badge passe à `N` et la liste se réduit aux espèces observées sur 7 j ; les compteurs Faune/Flore/Champignons/Autres et le nombre d'observations sur chaque fiche reflètent ce sous-ensemble.
2. Sélectionner « Personnalisée » avec une plage très ancienne → liste vide cohérente.
3. Revenir à « Tout l'historique » → exact même état qu'avant la refonte (non-régression).
4. Basculer Date terrain ↔ Date collecte → la liste se recompose en cohérence avec le graphe.