## Diagnostic (vérifié dans le code)

Le sélecteur d'ouvrages existe déjà (`OuvragesContextPicker.tsx`) et il est bien injecté via `providerGroupExtras.Ouvrages` (`ProprieteChatBotMount.tsx`). Mais il ne s'affiche jamais au premier usage, à cause d'un cercle vicieux :

- `ContextConsole.tsx` construit ses groupes **uniquement à partir des providers** (`groups = Map<group, providers[]>`), puis affiche `groupExtras[group]` à l'intérieur du groupe.
- Dans `useProprieteChatProviders.ts` (l.274-338), le provider `ouvrages.selection` n'est créé **que si `selected.length > 0`**, c'est-à-dire seulement si des ouvrages sont déjà retenus.

Résultat : aucune sélection → pas de groupe « Ouvrages » → le plateau de sélection n'est pas rendu → impossible de sélectionner. C'est exactement ce qu'on voit sur la capture (0/7 actif, groupes Vivant / Sol / Site / Flore seulement).

## Correction proposée

1. **`ContextConsole.tsx`** — rendre les groupes « extras » même sans provider :
   - Fusionner les clés de `groupExtras` avec celles des providers pour construire la liste des groupes, en conservant un ordre stable (Vivant, Sol, Ouvrages, Site, Flore).
   - Un groupe sans provider affiche uniquement son extra (pas de liste vide).

2. **`OuvragesContextPicker.tsx`** — le rendre lisible et « pro » dans ce contexte d'entrée :
   - Ne plus retourner `null` silencieusement : afficher un état vide explicite si la propriété n'a aucun ouvrage.
   - Ajouter sous le plateau une ligne de synthèse « ce qui sera transmis » : nombre d'ouvrages retenus, profondeur choisie, poids estimé (via `payloadBytes`/`formatBytes` de `chatContextCost`) — cohérent avec la jauge frugale du haut de la console.
   - Micro-affinage visuel : titre du plateau aligné sur le style des groupes, vignettes en 2 colonnes avec surface / obs / carottes, chips Tous · Aucun · Pertinents inchangés.

3. **Continuité d'activation** — quand la sélection passe de 0 à N, le provider `ouvrages.selection` apparaît : l'activer automatiquement (poser la slice `ctx.ouvrages.selection`) depuis `ProprieteChatBotMount.tsx`, pour que cocher un ouvrage produise un effet immédiat sans double clic. Inversement, la slice est retirée quand la sélection revient à 0.

## Détails techniques

- `ContextConsole` : `groups` devient `Array<[group, ContextProvider[]]>` construit depuis `new Set([...providersGroups, ...Object.keys(groupExtras ?? {})])`, trié selon un ordre de référence puis alphabétique pour le reste.
- Aucun changement de schéma ni d'edge function ; la frugalité reste inchangée (rien n'est transmis tant que rien n'est retenu/activé).
