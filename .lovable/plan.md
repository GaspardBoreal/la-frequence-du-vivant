## Le problème

Dans l'Atelier du jardin nourricier, les filtres du vivant (portée cadastre/tous, période « Aujourd'hui », types, familles, sources, bio-indicatrices, tags, recherche) donnent un **nombre** d'observations visibles, mais aucune **liste**. Pour savoir quelles espèces composent ces 6 points, il faut cliquer point par point.

Les données existent déjà côté client : `visibleWaypoints` dans `PaletteStudio.tsx` est exactement l'ensemble filtré affiché sur la carte. Il ne manque qu'une surface de lecture.

## La proposition : « L'Herbier du moment »

Un tiroir latéral, papier-herbier, qui est le **miroir textuel exact de la carte** : ce qui est dans le tiroir est ce qui est sur le plan, à l'observation près.

```text
┌──────────────────────────────────────────────┐
│ L'HERBIER DU MOMENT            6 obs · 4 esp │
│ Cadastre · Aujourd'hui · Flore, Faune    (x) │  ← chips des filtres actifs
├──────────────────────────────────────────────┤
│ ▣  Achillée millefeuille          2 obs  ⌖ ▸ │
│    Achillea millefolium · bio-indicatrice    │
│ ▣  Bourdon terrestre              1 obs  ⌖ ▸ │
│ ▣  Coquelicot                     3 obs  ⌖ ▸ │
├──────────────────────────────────────────────┤
│ Copier · CSV · Envoyer à l'IA de Jardin      │
└──────────────────────────────────────────────┘
```

### Comportements
- **Regroupement par espèce** (nom scientifique normalisé, dédup identique au reste de l'app), vignette photo (terrain marcheur en priorité, sinon iNat via le cache), nom français puis latin via `SpeciesName` / `useWaypointFrenchNames`.
- **Ligne dépliable** : chaque observation (date terrain, observateur, source marcheur/iNat, distance/statut géofence) sous l'espèce.
- **Survol** : la pastille correspondante pulse sur la carte (réutilise le mécanisme de highlight déjà en place dans le Scénographe).
- **Clic** : la carte se recentre sur l'observation et ouvre son popup existant (`ObservationPopupCard`).
- **Chips de filtres actifs** en tête, chacun cliquable pour être retiré — on comprend d'un coup d'œil *pourquoi* la liste est courte.
- **État vide soigné** : « Aucune observation ne passe ces filtres » + bouton « Élargir à Tout » / « Réinitialiser ».
- **Actions** : copier en Markdown, export CSV, et « Envoyer à l'IA de Jardin » qui pousse la liste comme contexte (réutilise `chatSuggestionContexts` / la Console de contextes).

### Ouverture (3 portes, aucune nouvelle icône orpheline)
1. Le compteur « Aujourd'hui · 6 obs. » du panneau Calques devient cliquable.
2. Un bouton « Voir la liste » en tête du panneau **Vivant** (`LivingFilterPanel`).
3. Une pastille discrète sur la carte affichant « 6 observations visibles » (raccourci clavier `L`).

## Détails techniques

- Nouveau composant `src/components/propriete/palette/studio/HerbierDuMomentDrawer.tsx` — présentation pure, alimenté par `visibleWaypoints`, `displayNameFor`, `fieldPhotos`, `tagsBySpecies` déjà calculés dans `PaletteStudio`.
- Nouveau `src/components/propriete/palette/studio/vivantFilterChips.ts` : dérive les libellés des filtres actifs à partir de `VivantFilterState` + du contexte `ProprieteVivantScopeContext` (portée + période).
- Regroupement dans un petit hook `useVivantSpeciesRoster(waypoints)` : Map latin normalisé → { obs[], count, indicateur, tags, photo }.
- Vignettes via `useSpeciesThumbs` (cache existant), fallback photos terrain `fieldPhotos`.
- Câblage dans `PaletteStudio.tsx` : état `herbierOpen`, `hoveredSpeciesKey`, `focusWaypointId` ; le survol/clic passe à `LivingLayer` par props (pas de nouvelle source de données, pas de requête supplémentaire).
- Aucun changement de logique métier ni de schéma : lecture seule sur des données déjà chargées, donc zéro coût réseau.
