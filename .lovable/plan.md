## Bloc 2.2 · Prélèvements — superposer les observations marcheurs + fix Cadastre

### Constat

Le bloc « 3 à 5 échantillons représentatifs » (`SamplesMapBlock`) ne montre aujourd'hui que les pastilles A–E. La carte « Où les marcheurs ont-ils observé le vivant ? » (`RevealMapBlock`, dans J'identifie·2) montre les waypoints des marcheurs mais **sans le Cadastre** (`cadastre: false`).

### Deux corrections

**1. Fusionner la vue « marcheurs » dans `SamplesMapBlock`**

Sur la même carte que les pastilles A–E, superposer les waypoints marcheurs (via `usePropertySpeciesPool`) avec les mêmes conventions visuelles que `RevealMapBlock` :

- Marqueurs points ronds colorés par règne (Plantae vert, Animalia ambre, Fungi violet), 12 px, halo crème 2 px — visuellement en retrait des grosses pastilles A–E pour ne pas gêner la lecture des prélèvements.
- Popup identique : miniature + nom vernaculaire + nom latin + date.
- Barre de contrôle discrète au-dessus de la carte (ligne « Glissez les pastilles · Cliquez la carte pour ajouter » enrichie à droite) :
  - Toggle **« Vivant observé »** ON/OFF (OFF par défaut si aucune donnée, ON si des waypoints existent).
  - Petits chips par règne : Plantae · Animalia · Fungi (avec compteurs, cliquables pour filtrer).
- `bounds` recalculés pour englober pastilles + parcelles + waypoints filtrés (seulement si le toggle est ON).
- Aucun changement de l'UX de saisie : clic sur la carte ajoute toujours un prélèvement A–E ; le drag et le retrait fonctionnent à l'identique. Les clics sur un marqueur ouvrent son popup et **n'ajoutent pas** de prélèvement (comportement natif Leaflet).

Nouvelles props : le hook `usePropertySpeciesPool(proprieteId)` est appelé en interne — pas de prop supplémentaire nécessaire. Petite légende sous la carte : « ● Prélèvements  ● Observations marcheurs ».

**2. Réparer Cadastre dans `RevealMapBlock`**

Passer `controls={{ ..., cadastre: true }}` sur le `RichMap` de `RevealMapBlock` (aujourd'hui à `false`). Le `RichMap` accepte déjà l'overlay Cadastre et prend le centre de carte comme point pivot pour charger les parcelles alentour — aucune autre modification nécessaire côté layer.

### Fichiers touchés

- `src/components/propriete/analyze/blocks/SamplesMapBlock.tsx` — ajout du hook `usePropertySpeciesPool`, overlay markers waypoints, toggle + chips filtre règne, ajustement `bounds` et légende sous la carte.
- `src/components/propriete/identify/blocks/RevealMapBlock.tsx` — activer `cadastre: true` dans les `controls` de `RichMap`.

Aucun changement de schéma, aucun impact sur les hooks de sauvegarde des échantillons.
