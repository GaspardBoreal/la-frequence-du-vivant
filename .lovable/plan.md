

# Page Exploration Marcheur — Vue immersive dédiée

## Vision

Remplacer le popup (MarcheDetailModal) par une **page plein écran avec URL dédiée** pour chaque exploration. Cette page devient le hub central du marcheur pour vivre, analyser et partager son exploration — avec une architecture extensible pour les futures fonctionnalités collaboratives.

## Architecture des routes

```text
/marches-du-vivant/mon-espace/exploration/:explorationId
```

Depuis le Carnet, un clic sur un événement redirige via `navigate()` au lieu d'ouvrir un Dialog. Le bouton retour ramène à `/marches-du-vivant/mon-espace` (onglet Carnet).

## Structure de la page

```text
┌─────────────────────────────────────────────────────┐
│  ← Retour   Nom Exploration   📍 Territoire        │  Header sticky
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌──────────┐  │
│  │ Marches │ │Marcheurs│ │  Carte  │ │ Messages │  │  Onglets globaux
│  └─────────┘ └─────────┘ └─────────┘ └──────────┘  │
│                                                     │
│  ══════════════════════════════════════════════════  │
│                                                     │
│  Section : Marches (vue par défaut)                 │
│  ┌─────────────────────────────────────────────┐    │
│  │  Step Selector horizontal (marche par marche)│    │
│  ├─────────────────────────────────────────────┤    │
│  │  Voir │ Écouter │ Lire │ Vivant             │    │  Sous-onglets sensoriels
│  ├─────────────────────────────────────────────┤    │
│  │                                             │    │
│  │  Contenu plein largeur (plus de max-w-md!)  │    │
│  │  Photos en grille 4 cols desktop            │    │
│  │                                             │    │
│  └─────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────┘
```

## Phase 1 — Ce qu'on construit maintenant

### 1. Nouvelle page `ExplorationMarcheurPage.tsx`

Page plein écran avec :
- **Header** : bouton retour, nom exploration, lieu, dates
- **Navigation par onglets globaux** : Marches (défaut), Marcheurs, Carte, Messages
- **Onglet Marches** : reprend exactement le contenu actuel de `MarcheDetailModal` (StepSelector + tabs Voir/Ecouter/Lire/Vivant) mais en plein écran — plus de contrainte `max-w-md max-h-[85vh]`
- **Onglets Marcheurs / Carte / Messages** : placeholder "Bientot disponible" avec un design inspirant (icone, texte atmospherique)

### 2. Modification de `CarnetVivant.tsx`

- Au clic sur un événement : `navigate(/marches-du-vivant/mon-espace/exploration/${explorationId})` au lieu d'ouvrir le modal
- Supprimer l'état `selectedEventId` et le rendu du `MarcheDetailModal`
- Passer l'`exploration_id` en query param ou le résoudre depuis le `marche_event_id`

### 3. Route dans `App.tsx`

Ajouter :
```
/marches-du-vivant/mon-espace/exploration/:explorationId
```

### 4. Adaptation du contenu existant

Les composants VoirTab, EcouterTab, LireTab, VivantTab restent dans `MarcheDetailModal.tsx` mais sont extraits en exports nommés pour être réutilisés dans la nouvelle page. La grille photo passe de 3 colonnes à 4 sur desktop (responsive).

## Phase 2 — Fonctionnalités à venir (placeholders élégants)

| Onglet | Fonctionnalité | Données |
|--------|---------------|---------|
| **Marcheurs** | Liste des participants avec stats (photos, sons, textes, espèces) | `marche_participations` + `community_profiles` + stats agrégées |
| **Carte** | Map des marches avec progression temporelle | GPS des `marches` + timeline |
| **Messages** | Notes et commentaires partagés entre marcheurs | Nouvelle table à créer |
| **Story Bio** | Narration automatique des données biodiversité | `biodiversity_snapshots` agrégés |

## Fichiers impactés

| Fichier | Action |
|---------|--------|
| `src/pages/MarchesDuVivantExplorationMarcheur.tsx` | Nouveau — page principale |
| `src/components/community/ExplorationMarcheurPage.tsx` | Nouveau — composant de la page |
| `src/components/community/CarnetVivant.tsx` | Modifier — navigation au lieu de modal |
| `src/components/community/MarcheDetailModal.tsx` | Exporter les tabs en composants réutilisables |
| `src/App.tsx` | Ajouter la route |

## Résultat UX

- Plus de "sursaut" : la page se charge avec ses propres skeletons plein écran
- Espace visuel genereux : photos en grille large, pas de popup étroit
- URL partageable et bookmarkable
- Architecture prête pour les 4 fonctionnalités collaboratives annoncées

