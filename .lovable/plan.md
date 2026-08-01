## Pourquoi vous ne les voyez pas

Le bloc « Scénographies » créé précédemment vit uniquement dans la **fiche dépliée d'un ouvrage du registre**, sous la carte de l'onglet Palette végétale (`OuvragesRegister` → `OuvrageScenariosPanel`). Dans le plein écran **L'Atelier du jardin nourricier** (`PaletteStudio`), aucune entrée ne liste les scénarios : l'inspecteur d'objet ne propose qu'un bouton « Ouvrir le Scénographe », qui rouvre toujours le scénario retenu (ou le premier) sans permettre de choisir.

## 1. Bibliothèque des scénographies dans l'Atelier

Nouveau bouton **« Scénographies »** (icône baguette + pastille du nombre) dans la barre d'outils haute de l'Atelier, à côté des actions existantes. Il ouvre un panneau latéral droit (même langage visuel que l'inspecteur : carte dockée, filet doré) :

- Liste **tous** les scénarios de la propriété, regroupés par ouvrage (nom de l'ouvrage + métré en en-tête de groupe).
- Chaque ligne : nom du scénario, nombre de sujets, glyphes de strates, date, pastille dorée « Retenu ».
- Filtre rapide : *Tous* · *Cet ouvrage* (quand un objet est sélectionné) · *Retenus*.
- Survol d'une ligne → l'emprise de l'ouvrage concerné clignote doucement sur le plan, pour relier liste et carte.
- Actions par ligne, identiques au registre : Ouvrir · Renommer · Dupliquer · Retenir · Supprimer (confirmation).
- État vide : « Aucune scénographie — sélectionnez un ouvrage et composez-en une. »

## 2. Rouvrir *le bon* scénario

Aujourd'hui `openScenographe(objetId)` ne transporte pas l'identité du scénario.

- `scenographeStore` gagne un champ `scenarioId` optionnel ; `openScenographe(objetId, { scenarioId, proposals })`.
- `ScenographeFullscreen` sélectionne ce scénario à l'ouverture au lieu du retenu/premier.
- Le registre (`OuvrageScenariosPanel`) et la nouvelle bibliothèque passent tous deux l'id — un clic ouvre exactement la variante cliquée.

## 3. Rappel dans l'inspecteur d'objet

Dans `ObjectInspector`, au-dessus du bouton « Ouvrir le Scénographe » : une ligne compacte « n scénographie(s) » avec les 3 dernières en puces cliquables (ouverture directe) et un lien « Toutes… » qui ouvre la bibliothèque filtrée sur cet ouvrage.

## Détails techniques

- Aucune migration : la table `propriete_ouvrage_scenarios` suffit.
- Nouveau hook `useProprieteScenarios(proprieteId)` : lecture de tous les scénarios de la propriété (une requête), plus `patch` / `remove` / `duplicate` / `setRetenu` mutualisés avec la logique existante de `useOuvrageScenarios`.
- Nouveaux fichiers : `palette/studio/ScenariosLibraryPanel.tsx`, `hooks/propriete/useProprieteScenarios.ts`.
- Modifiés : `scenographe/scenographeStore.ts`, `scenographe/ScenographeFullscreen.tsx`, `palette/studio/PaletteStudio.tsx`, `palette/studio/ObjectInspector.tsx`, `palette/OuvrageScenariosPanel.tsx`.
- Le panneau réutilise `uiOverlayLevel` pour se placer correctement sous les overlays plein écran.
