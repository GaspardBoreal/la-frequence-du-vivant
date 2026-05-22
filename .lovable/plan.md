# Plan — Fiche espèce unifiée (étape 1) + préparation étape 2

## Constat — 3 vues, 3 comportements

| # | Point d'entrée | Composant rendu | Trophic widget | Données marche/observateurs | Carrousel terrain + iNat |
|---|---|---|---|---|---|
| 1 | Synthèse → Taxons → carte espèce | `SpeciesGalleryDetailModal` (`trophicPool` fourni par `SpeciesExplorer`) | ✅ | ✅ (explorationId) | ✅ |
| 2 | Synthèse → Pouls du vivant → point → espèce du jour | `SpeciesGalleryDetailModal` ouvert par `DayDetailDrawer` **sans `trophicPool`** | ❌ | ✅ partiel (explorationId mais `count=1`) | ✅ |
| 3 | Marches → onglet Vivant → espèce | `SpeciesExplorer compact` (sans `explorationId`) → branche `else` → ancien `SpeciesDetailModal` | ❌ | ❌ | ❌ |

Fichiers en cause :
- `src/components/community/exploration/DayDetailDrawer.tsx` (l. 226–238) — ne passe pas `trophicPool` ni le `count` réel.
- `src/components/community/MarcheDetailModal.tsx` (l. 1130) — appelle `SpeciesExplorer` sans `explorationId` ni `trophicPool`.
- `src/components/biodiversity/SpeciesExplorer.tsx` (l. 480–486) — branche `else` qui ouvre l'ancien `SpeciesDetailModal`.
- `src/components/biodiversity/SpeciesDetailModal.tsx` — composant legacy à retirer.

## Étape 1 — Standardiser sur `SpeciesGalleryDetailModal` (cible unique)

Objectif : une seule fiche, même contenu visible quel que soit le point d'entrée, contenu graduellement adapté au contexte (exploration, marche, jour).

### 1.1 Rendre la fiche auto‑suffisante pour le widget trophique

Dans `SpeciesGalleryDetailModal` : si `trophicPool` n'est pas fourni mais qu'un `explorationId` l'est, **résoudre le pool en interne** via `useExplorationSpeciesPool(explorationId)` (hook déjà existant utilisé par Synthèse). Le widget « Sa place dans la chaîne » devient ainsi disponible partout dès qu'on connaît l'exploration.

Fallback : si `explorationId` absent (cas vue 3), tenter le pool fourni par le parent (nouveau prop `species` ou `speciesPool`). Sinon, masquer proprement le bloc (déjà le cas).

### 1.2 Corriger la vue 2 (Pouls du vivant)

`DayDetailDrawer` :
- Passer `count = selectedSpecies.observations` (et non `1`) si la propriété est disponible côté `DayDetail`. Sinon laisser `1` (jour précis).
- Le `trophicPool` sera résolu automatiquement grâce à 1.1 (rien à passer ici), mais on peut aussi le propager si déjà chargé par le parent pour éviter une 2e requête.

### 1.3 Corriger la vue 3 (Marches → Vivant)

`MarcheDetailModal` :
- Passer `explorationId={exploration.id}` et `allEventMarches` à `<SpeciesExplorer>` (déjà dispo dans ce scope ; sinon prop drilling depuis l'appelant).
- Passer le `trophicPool` (= liste complète d'espèces du marché ou de l'événement) pour activer la chaîne trophique au niveau « marche ».

`SpeciesExplorer` :
- Supprimer la branche `else` qui rend `SpeciesDetailModal`. Toujours rendre `SpeciesGalleryDetailModal`. Quand `explorationId` est absent, la modale fonctionne en mode dégradé (pas d'onglets Carte/Observateurs propres à l'event, mais identité + carrousel + chain + chat OK).
- Supprimer l'import et le fichier `SpeciesDetailModal.tsx` (dead code après suppression). Vérifier qu'il n'a aucune autre référence (déjà vérifié : 3 fichiers, tous neutralisés).

### 1.4 Harmoniser le contrat d'entrée

Aujourd'hui la modale reçoit un objet ad-hoc `{ name, scientificName, count, kingdom, photos? }`. Les trois appels divergent légèrement. On garde ce contrat (changement minimal) mais on documente clairement les champs requis vs optionnels en JSDoc + on ajoute un prop optionnel `speciesPool?: BiodiversitySpecies[]` pour le cas « hors exploration ».

### 1.5 QA visuel

Tester les 3 entrées sur l'URL en cours :
- Synthèse → Taxon : aucune régression, widget toujours là.
- Pouls du vivant → un point → une espèce : widget visible, badge "X observations sur Y marches".
- Marches → Vivant → espèce : nouvelle modale moderne, carrousel + onglets Liste/Carte/Observateurs + widget trophique.

## Étape 2 — Enrichissements (préparation seulement, pas d'implémentation dans ce plan)

Architecture cible pour brancher les futurs ajouts sans casser l'étape 1 :

```text
SpeciesGalleryDetailModal (Sheet right/bottom)
├── Header (identité, badges)
├── Carrousel photos (terrain + iNat)            ─┐
├── Place trophique (mini + fullscreen)          ─┤  étape 1 (OK après ce PR)
├── CTA Chat IA                                  ─┤
├── Onglets Liste / Carte / Observateurs         ─┘
└── 🆕 Bouton « Vue plein écran »   ──────────►  SpeciesFullscreenView (étape 2)
                                                  ├── Carte avancée (Mapbox/MapLibre)
                                                  │    • points GPS exacts par observation
                                                  │    • drag-to-reposition (RPC recalibrate)
                                                  │    • clusters, filtres date, légendes
                                                  ├── Galerie haute-déf + EXIF
                                                  ├── Timeline observations
                                                  ├── Bouton « Générer rapport PDF »
                                                  │    └── edge function (jsPDF/pdfmake) :
                                                  │        identité, chaîne trophique,
                                                  │        carte statique, top observations,
                                                  │        signatures + logo
                                                  └── Bouton « Partager / Export CSV »
```

Pré-requis posés par l'étape 1 : un point d'entrée unique, un contrat de props unique, le pool trophique résolvable depuis n'importe quel contexte. Ces 3 invariants débloquent toute l'étape 2 sans refactor supplémentaire.

## Détails techniques

- Hook ajouté côté modale : `useExplorationSpeciesPool(explorationId)` (déjà existant — confirmé via `src/hooks/useExplorationSpeciesPool.ts`). Activé conditionnellement : `enabled: !trophicPool && !!explorationId`.
- Suppression : `src/components/biodiversity/SpeciesDetailModal.tsx` + l'import dans `SpeciesExplorer`.
- Aucune migration DB.
- Aucun changement de design system (la fiche cible utilise déjà les tokens projet via `Sheet` + classes existantes).

## Fichiers modifiés

1. `src/components/biodiversity/SpeciesGalleryDetailModal.tsx` — résolution interne du pool, JSDoc props, prop optionnel `speciesPool`.
2. `src/components/community/exploration/DayDetailDrawer.tsx` — `count` correct, propagation `trophicPool` si dispo.
3. `src/components/community/MarcheDetailModal.tsx` — passe `explorationId`, `allEventMarches`, `trophicPool` à `SpeciesExplorer`.
4. `src/components/biodiversity/SpeciesExplorer.tsx` — toujours `SpeciesGalleryDetailModal`, suppression de la branche legacy.
5. `src/components/biodiversity/SpeciesDetailModal.tsx` — **supprimé**.

## Hors scope (étape 2)

Vue plein écran, repositionnement GPS, génération PDF, export CSV, partage social — listés ci-dessus pour cadrer l'architecture, **non implémentés** dans ce PR.
