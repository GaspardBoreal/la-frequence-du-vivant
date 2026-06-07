## Diagnostic

Le RPC `search_global('Buddleja de David')` renvoie **bien** les 11 marches attendues (DEVIAT ×4, ROQUE GAGEAC, POITIERS, Paris Saint-Lazare, Ajaccio…) dans `meta.recent_contexts`. Aucun bug back-end.

Le problème est purement **UX dans `SearchResultCard.tsx`** :
- la ligne « chips » n'affiche que `recent_contexts[0]` → une seule ville visible (la plus récente, ROQUE GAGEAC) ;
- les 10 autres marches sont planquées derrière un chevron `v` que l'utilisateur ne voit pas ;
- résultat : l'utilisateur conclut « il n'y a que ROQUE GAGEAC » alors que DEVIAT est juste en dessous.

## Correctif (UI uniquement, frontend)

Fichier : `src/components/search/SearchResultCard.tsx`

1. **Chip lieu enrichi pour espèces multi-marches** : au lieu d'une seule pastille MapPin avec une ville, afficher jusqu'à **3 villes distinctes** issues de `recent_contexts` (dédupliquées, triées par récence), avec un suffixe `+N` si plus.
   - Ex. : `📍 ROQUE GAGEAC · DEVIAT · POITIERS +2`
   - Cliquable → ouvre le panneau déplié (au lieu de la fiche).

2. **Auto-expand intelligent** : si `marches_count >= 3` ET que c'est l'unique résultat espèce affiché (ou que le score de match est > 0.6 → match quasi-exact comme « Buddleja de David » → « Buddleja davidii »), pré-déplier le panneau `recent_contexts` au montage. L'utilisateur voit immédiatement la liste complète des marches.

3. **Affordance visuelle du chevron** : remplacer le `ChevronDown` discret par un bouton plus lisible « Voir les 11 marches » à droite du titre quand `marches_count > 1`, pour signaler explicitement qu'il y a du contenu derrière.

4. **Tri des `recent_contexts`** : s'assurer que le tri exposé garde l'ordre récence DESC mais regroupe d'abord par ville (pour éviter 4× DEVIAT consécutifs visuellement noyés). Tri stable : `nom_marche` unique d'abord, puis date DESC.

## Hors scope

- Aucune modif SQL / RPC : le back renvoie déjà les bonnes données.
- Aucune modif du hook `useSearchGlobal`.
- Pas de touche aux autres `kind` (text, testimony, marcheur, event).

## Validation

- Rechercher « Buddleja de David » → la carte doit afficher **ROQUE GAGEAC · DEVIAT · POITIERS +2** dans la chip lieu, panneau auto-déplié listant les 11 marches dont les 4 DEVIAT clairement visibles.
- Rechercher une espèce mono-marche → comportement actuel inchangé (chip unique, pas d'auto-expand).
