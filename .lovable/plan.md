# Bloc « Preuve par la data » — DEVIAT « Marcher sur un sol qui respire » (10 km)

## 1. Restitution immédiate des chiffres (chat)

Sur la marche **DEVIAT « Marcher sur un sol qui respire » (10 km)** — exploration `70fcd8d1…`, event `df85910e…` — la RPC unifiée `get_exploration_species_count` donne :

| Indicateur | Valeur |
|---|---|
| Espèces recensées | **147** |
| Marcheurs ambassadeurs | **8** |
| Flore (Plantae) | **84** (57 %) |
| Faune (Animalia) | **52** (35 %) |
| Champignons / Lichens (Fungi) | **2** |
| Autres règnes | **9** |
| Source : marcheurs ∩ snapshots | 126 |
| Source : marcheurs seuls | 9 |
| Source : snapshots iNat seuls | 12 |

Quelques espèces phares présentes des deux côtés (marcheurs + iNat) : *Anacamptis pyramidalis*, *Carabus coriaceus*, *Hemaris fuciformis*, *Episyrphus balteatus*, *Flavoparmelia caperata* (lichen bio-indicateur de qualité de l'air).

→ Bonne candidate **Focus Espèce Bio-indicatrice** : *Flavoparmelia caperata* (lichen foliacé, sensible à la pollution azotée et SO₂) ou *Carabus coriaceus* (coléoptère prédateur de sols vivants — collerait au titre « sol qui respire »).

## 2. Composant `PreuveParLaData` (intégration app)

### Emplacement
- Nouveau composant `src/components/community/exploration/PreuveParLaDataCard.tsx`.
- Injecté dans la **scénographie** de l'event 10 km via le registry per-event (mémoire « Per-event scenography »), pas en dur dans la page exploration — pour ne pas polluer les autres marches.
- Si la scénographie n'est pas branchée pour cette marche, fallback : afficher sur l'onglet **Synthèse** de `ExplorationLayout` quand `eventSlug === 'deviat-sol-qui-respire-10km'`.

### Données (zéro hallucination, source unique de vérité)
- Espèces + ventilation royaumes : `useExplorationSpeciesCount(explorationId)` (RPC `get_exploration_species_count`, déjà câblée et realtime).
- Marcheurs ambassadeurs : `useExplorationMarcheurs(explorationId)` filtré sur ceux qui ont au moins 1 observation (`observationsCount > 0`).
- Bio-indicatrice : champ éditorial stocké dans `exploration_curations` (clé `bio_indicator`) — saisi en admin, fallback heuristique côté front si vide (priorité : 1er lichen Fungi présent, sinon 1er coléoptère).
- Bouton **« Extrait direct CSV »** → réutilise l'edge `generate-pack-vivant` (mémoire « Pack Vivant export ») en mode `csv_only`, niveau d'accès `public`.

### UI (Forêt Émeraude / dark — cohérent avec le screenshot)
- Card glassmorphism 2 colonnes (texte gauche, donut droite), responsive → empile en `<lg`.
- Donut Plantae/Animalia (+ Fungi/Autres regroupés en « Autres ») via Recharts `PieChart` semi-transparent, label legend en bas.
- 2 tuiles KPI (« 147 ESPÈCES RECENSÉES », « 8 CITOYENS AMBASSADEURS »).
- Bloc « Focus Espèce Bio-indicatrice » avec `<SpeciesName />` (jamais de `commonName` brut — règle mémoire).
- Chips bas droite : 4 premiers genres distincts + « … » qui ouvre le drawer Espèces existant.

### Code (technique)
```
src/components/community/exploration/
  PreuveParLaDataCard.tsx          ← nouveau
  PreuveParLaDataDonut.tsx         ← sous-composant Recharts
src/hooks/
  useBioIndicatorSpecies.ts        ← résolution heuristique + override curation
```
Aucune migration BDD : tout existe déjà (`exploration_curations.functions` peut accueillir la clé `bio_indicator` sans nouvelle colonne — sinon nouvelle colonne `bio_indicator_scientific_name text` si tu préfères stockage explicite).

## 3. Question ouverte
- Bio-indicatrice : je laisse l'heuristique (lichen `Flavoparmelia caperata` par défaut) ou tu préfères forcer **Carabus coriaceus** comme dans le screenshot d'origine ? → réglable ensuite via un champ admin si tu valides ce plan.
