## Objectif

Dans le panneau **Calques → Vues de fond → Observations du vivant**, ajouter un filtre temporel identique à celui de **Mon espace → Biodiversité → Taxons observés**, en complément du sélecteur de portée Cadastre / Tous.

## Ce qui existe déjà

- Le filtre des Taxons observés utilise `EvolutionPeriod` + `resolvePeriodRange` (`src/hooks/useBiodiversityEvolution.ts`), avec les 10 options : Aujourd'hui, 7 j, 30 j, Mois dernier, Trimestre dernier, 6 mois, Année en cours, 12 mois glissants, Tout, Période personnalisée (2 calendriers) + bascule « Date terrain / Date collecte ».
- Côté propriété, la portée Cadastre/Tous est un réglage **global** porté par `ProprieteVivantScopeContext`, appliqué en amont dans `usePropertySpeciesPool` (`allRows`), donc suivi par toutes les cartes, listes, compteurs et impressions.
- Les observations disposent bien d'une date (`marcheur_attrs[].observation_date`, `attributions[].date/observationDate`).

## Ce que je construis

**1. Étendre le contexte de portée (même logique globale)**
`ProprieteVivantScopeContext` gagne `period` (défaut `all`), `customRange`, `dateSource`, persistés en `localStorage` par propriété — même mécanisme que `scope`. Une seule source de vérité pour toutes les vues de la fiche propriété (Atelier, Carte des révélations, J'identifie, compteurs, impressions).

**2. Filtrage en amont dans `usePropertySpeciesPool`**
Dans la même étape que le géofiltrage cadastral : on ne garde que les attributions dont la date tombe dans la fenêtre `resolvePeriodRange(period, customRange)`, on recalcule `observations`, on écarte les espèces sans attribution restante. Conséquence cohérente : espèces, waypoints, photos terrain, contributeurs et compteurs (`scopeCounts`) racontent la même histoire filtrée. `allWaypoints` (Contrôle GPS) reste volontairement hors filtre, comme aujourd'hui pour la portée.

**3. Nouveau composant `VivantPeriodFilter`**
Réutilise exactement la liste d'options et le comportement de `BiodiversityEvolutionChart` (Select + double calendrier pour la période personnalisée + pastille Date terrain / Date collecte), avec l'habillage sobre du panneau Calques (variantes `panel` et `inline` comme `VivantScopeSwitch`).

**4. Intégrations UI**
- `LayersPanel.tsx` : sous « Observations du vivant », juste après les pastilles Cadastre / Tous.
- Bandeaux de carte utilisant déjà `VivantScopeSwitch` en variante `inline` (Carte des révélations, cartes de l'Atelier) : même filtre à côté.
- Libellé de synthèse discret quand un filtre est actif (ex. « 30 derniers jours · 87 obs. »), avec bouton de réinitialisation.

## Détails techniques

- Fenêtre de dates : `resolvePeriodRange` réutilisé tel quel, comparaison sur jour ISO (`YYYY-MM-DD`) comme dans `useSpeciesFilteredByPeriod`.
- `dateSource` : conservé pour la parité d'interface ; comme dans Taxons observés, le filtre s'appuie sur la date terrain quand la date de collecte n'est pas disponible par observation (comportement documenté déjà en place).
- Aucun changement de base de données ni de RPC ; tout le filtrage est côté lecture.
