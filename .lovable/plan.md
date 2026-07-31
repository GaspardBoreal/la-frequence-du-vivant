## Ce que je comprends

Aujourd'hui deux mondes vivent séparément :

- **Étape 2 · J'analyse** : des prélèvements de sol A, B, C… posés sur la carte, chacun portant structure, texture, pH, vie du sol.
- **Étape 5 · Palette végétale** : l'Atelier, où l'on dessine des ouvrages (massif, mare, potager, pas japonais…), plus un widget « Emplacements & ouvrages » qui permet encore de dessiner des zones — doublon inutile.

L'objectif : **faire dialoguer les deux**. Un massif doit savoir sur quel sol il repose, et l'IA de jardin doit pouvoir répondre « voici la palette adaptée à ce massif » en s'appuyant sur les analyses réelles du terrain.

## 1. La couche « Carottes de sol » — visible partout

Un nouveau calque système **« Prélèvements de sol »** (activable/désactivable) dans le panneau *Vues de fond*, présent :
- dans l'Atelier,
- dans la carte du widget « Emplacements & ouvrages ».

Chaque prélèvement devient une **pastille « carotte »** au design dédié : disque terreux, lettre A/B/C gravée, anneau coloré par la lecture dominante du sol (argile / limon / sable) et micro-jauge de pH en arc. Survol → mini-carte de lecture (texture, structure, pH, vie). Dans l'Atelier, la pastille est **déplaçable** (drag), synchronisée en direct avec l'étape « J'analyse » — même source de vérité, aucune duplication.

## 2. L'association ouvrage ↔ prélèvements

Ouverture de la fiche d'un ouvrage (inspecteur) → nouveau bloc **« Sol de référence »** :

- **Suggestion automatique** : les prélèvements contenus dans l'ouvrage, sinon le plus proche (avec distance affichée : « B · 4 m »). Proposés en un clic sous forme de puces « Adopter ».
- **Correction manuelle** : on peut attacher **plusieurs prélèvements** à un même ouvrage, en retirer, ou en ajouter un éloigné volontairement.
- **Lecture fusionnée** : dès qu'au moins un prélèvement est lié, l'inspecteur affiche une **synthèse agronomique de l'ouvrage** (texture dominante, structure, pH moyen + amplitude si plusieurs, vie du sol), plus une phrase de lecture (« Sol limoneux à structure grumeleuse, légèrement acide, bien vivant »).
- **Alertes de cohérence** : si l'ouvrage est une mare sur sol sableux drainant, ou un potager sur sol compacté, un bandeau ambré signale la contrainte avec le geste correctif.

Un fil visuel (trait pointillé doré animé) relie l'ouvrage à ses carottes quand la fiche est ouverte — lecture instantanée du lien sur la carte.

## 3. Le widget « Emplacements & ouvrages » simplifié

- Suppression du bouton « Dessiner une zone » : la création passe exclusivement par l'Atelier (bouton « Ouvrir l'Atelier » mis en avant).
- La carte reste, en lecture : parcelles, zones existantes, ouvrages, et la nouvelle couche prélèvements activable.
- Dans le registre des ouvrages, chaque carte gagne un **liseré « sol »** : pastille des prélèvements liés + résumé en une ligne, cliquable pour recentrer.

## 4. Le croisement palette ↔ sol

Dans les recommandations d'espèces par ouvrage, les plantes sont désormais **confrontées au sol réel** de l'ouvrage : badge vert « concorde avec le sol de B », badge ambré « pH un peu bas pour cette espèce ». On réutilise le moteur de concordance déjà écrit pour l'étape « J'identifie ».

## 5. Préparation de l'IA jardin (couche de données)

Construction d'un **dossier sol par ouvrage** : un objet consolidé (type d'ouvrage, surface, prélèvements liés avec toutes leurs mesures, lecture fusionnée, contraintes détectées, espèces déjà retenues) exposé par une fonction unique. Il servira de contexte à l'IA au prochain chantier, et alimente dès maintenant l'affichage et l'impression — aucune IA branchée dans cette itération.

## Détails techniques

- **Aucune migration lourde** : le lien est stocké dans `propriete_objets.meta` (champ `soil_samples: string[]`, ids de prélèvements) via la RPC `upsert_propriete_objet` existante. Les prélèvements restent dans `propriete_soil_diagnostics.samples` (JSON), déjà porteurs de `lat`/`lng`.
- Nouveau module `src/lib/soilLinkEngine.ts` : suggestion par appartenance point-dans-polygone puis distance haversine, fusion multi-prélèvements (réutilise `buildSoilReading`, `aggregatePh`, `aggregateLife`), règles de contrainte par type d'ouvrage (adossées à `ouvrageRecoKb`), et `buildOuvrageSoilDossier()` = payload IA.
- Nouveau hook `useOuvrageSoil.ts` : croise `usePropertySoil` et `usePropertyObjets`, expose suggestions, lien, lecture fusionnée.
- Nouveaux composants : `SoilSamplesLayer.tsx` (pastilles + drag optionnel, dans un pane Leaflet dédié au-dessus des polygones), `SoilCoreMarker.tsx`, `SoilLinkBlock.tsx` (bloc inspecteur), `SoilLinkThread.tsx` (fil pointillé).
- Intégrations : `LayersPanel.tsx` (toggle système), `PaletteStudio.tsx` (couche + drag → `updateSample`), `ZonesMapBlock.tsx` (couche lecture seule, retrait du bouton dessin et de `FreehandLayer`), `ObjectInspector.tsx` (bloc Sol de référence), `OuvragesRegister.tsx` / `OuvrageRecoCard.tsx` (liseré sol + badges de concordance).
- Impression : le dossier sol par ouvrage est ajouté à `OuvragePrintSheet.tsx`.
