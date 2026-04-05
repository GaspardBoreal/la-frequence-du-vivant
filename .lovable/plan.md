

## Rendre les contributeurs visibles et filtrables dans toutes les vues biodiversité

### Problème

Les contributeurs biodiversité proviennent de deux sources distinctes :
1. **Attributions taxonomiques** — noms d'observateurs stockés dans `species_data[].attributions` des snapshots (GBIF, iNaturalist, eBird)
2. **Participants communautaires** — marcheurs inscrits aux événements via `marche_participations` + crew via `exploration_marcheurs`

Actuellement, `SpeciesExplorer` ne connaît que la source 1. Les anciens snapshots (ex: "La transhumance") n'ont aucune attribution, donc le filtre affiche "Tous (0)" ou un badge statique "Participants (N)" non filtrable.

L'utilisateur veut voir **tous les contributeurs** dans un dropdown filtrable et fonctionnel, pour **tous les événements**, y compris ceux sans attributions taxonomiques.

### Solution

Fusionner les deux sources dans un dropdown contributeur unifié à 3 sections :

```text
┌────────────────────────────────┐
│ Tous (N)                       │
├────────────────────────────────┤
│ 🚶 Marcheurs (M)               │  ← participants + crew
│   Chantal Brillet               │
│   Gaspard Boréal                │
├────────────────────────────────┤
│ 🐦 eBird (X)                   │  ← attributions taxonomiques
│   John Smith                    │
│ 🌿 iNaturalist (Y)             │
│   Jane Doe                      │
│ 📊 GBIF (Z)                    │
│   Museum XYZ                    │
└────────────────────────────────┘
```

- Quand on filtre sur un marcheur communautaire : toutes les espèces restent visibles (car on ne peut pas attribuer une espèce spécifique à un participant)
- Quand on filtre sur un observateur taxonomique : filtrage classique par `attributions.observerName`
- Le compteur total = marcheurs uniques + observateurs uniques (dédupliqués)

### Modifications

**1. `SpeciesExplorer.tsx`** — Ajouter une prop `eventParticipants`

```ts
interface SpeciesExplorerProps {
  // ...existing
  eventParticipants?: Array<{ name: string; source: 'community' | 'crew' }>;
}
```

- Fusionner `eventParticipants` avec les contributeurs taxonomiques dans le calcul `totalContributors`
- Ajouter une section "Marcheurs" dans le dropdown
- Quand un participant communautaire est sélectionné, ne pas filtrer les espèces (afficher toutes) mais indiquer visuellement le participant sélectionné
- Supprimer la prop `fallbackParticipantCount` (remplacée par `eventParticipants`)

**2. `EventBiodiversityTab.tsx`** — Construire la liste `eventParticipants`

- Déjà disponible via `useExplorationParticipants` + `useExplorationMarcheurs` (hooks existants)
- Transformer en `Array<{ name: string; source: 'community' | 'crew' }>` dédupliqué
- Passer à `SpeciesExplorer` via la nouvelle prop

**3. `MarcheDetailModal.tsx`** — Passer aussi les participants

- Ce composant utilise `useBiodiversityData` (edge function live) qui retourne des espèces **avec** attributions
- Ajouter le même passage de participants pour cohérence
- Nécessite de connaître l'`explorationId` de la marche affichée (déjà disponible dans le contexte)

**4. `BioDivSubSection.tsx`** — Vérification

- Utilise `biodiversityData.species` de l'edge function live qui inclut déjà les attributions
- Pas de contexte événementiel → pas de participants communautaires à ajouter
- Aucune modification nécessaire

### Détail technique

```text
AVANT:
  SpeciesExplorer.contributorsBySource ← species.attributions UNIQUEMENT
  fallbackParticipantCount → badge statique non filtrable

APRÈS:
  SpeciesExplorer.contributorsBySource ← species.attributions
  SpeciesExplorer.eventParticipants ← marcheurs + crew (nouvelle prop)
  → dropdown unifié avec sections Marcheurs + eBird + iNaturalist + GBIF
  → totalContributors = union des deux
```

### Comportement du filtre par participant communautaire

Quand un marcheur est sélectionné et qu'il n'y a pas d'attributions taxonomiques associées, toutes les espèces restent visibles avec un bandeau contextuel : « Espèces observées lors de la participation de [Nom] ». C'est scientifiquement honnête (on ne sait pas quel marcheur a vu quelle espèce) tout en mettant en valeur la dynamique participative.

### Fichiers modifiés
- `src/components/biodiversity/SpeciesExplorer.tsx`
- `src/components/community/EventBiodiversityTab.tsx`
- `src/components/community/MarcheDetailModal.tsx`

### Résultat attendu
- Tous les événements affichent un dropdown contributeurs rempli
- Les marcheurs communautaires et l'équipe sont toujours visibles
- Le filtrage taxonomique reste précis quand les attributions existent
- La dynamique participative est mise en valeur sur chaque événement

