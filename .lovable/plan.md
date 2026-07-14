## Problème

Sur la fiche jardin (`/jardin/:slug`), l'index vertical de navigation (Canopée / Arbustive / Rhizosphère / Saisons) est positionné en `fixed right-4 z-40`. Le "Panneau vivant" (composant `StratPanel`) de la Strate 1 est aligné à droite (`md:justify-self-end`) avec `backdrop-blur-xl`. Résultat : à mi-scroll, les pastilles de l'index chevauchent le panneau — elles restent visibles par-dessus au lieu de glisser proprement dessous (ou d'être décalées), ce qui casse la lecture du panneau.

## Correction proposée

Modification uniquement dans `src/pages/ImmersiveGardenFiche.tsx`, composant `StratIndicator` (l.478-485) :

1. **Déplacer l'index vertical à gauche** (`left-4` au lieu de `right-4`) pour éviter toute collision avec les `StratPanel` alignés à droite. Inverser l'ordre des dots (`flex-row` inversé) : pastille à gauche, label à droite, aligné `justify-start`.
2. **Descendre le z-index** de `z-40` à `z-20`, sous le z implicite des panneaux, pour que — si un panneau finit malgré tout par croiser la zone — l'index passe proprement dessous plutôt que de flotter au-dessus.
3. Ajouter un léger fond flouté sur chaque ligne (`bg-black/20 backdrop-blur-sm rounded-full px-2 py-1`) pour rester lisible sur les fonds clairs de la section Canopée.

Aucune modification du `StratPanel` ni du reste de la page. Aucun changement backend.

## Vérification

- Rechargement de `/jardin/dbaf6db0-...` en desktop.
- Scroll manuel : l'index reste ancré à gauche, les 3 `StratPanel` (droite/gauche/droite) ne sont plus chevauchés.
- Screenshot Playwright aux 4 seuils de scroll (0, 25 %, 50 %, 75 %) pour confirmer visuellement.
