# Plan de correction

## Reproduction confirmée
J’ai rejoué le parcours complet dans le preview :
1. ouvrir la recherche sur l’événement
2. taper `catalpa`
3. ouvrir `Catalpa du sud`
4. cliquer `ROQUE GAGEAC / Jardin`

Résultat observé :
- la navigation arrive bien sur le bon événement
- l’onglet **Biodiversité** est actif
- le sous-onglet **Taxons observés** est actif
- la carte espèce **Catalpa du sud** reçoit bien le halo/focus
- mais le **bandeau droit / drawer espèce** ne s’ouvre pas

## Cause racine
Le flux actuel a deux vitesses différentes :
- le **halo** réessaie assez longtemps pour retrouver la carte quand la grille finit de charger
- le **drawer** consomme le focus trop tôt dans `SpeciesExplorer` avec un délai fixe court, avant que la liste d’espèces soit prête dans certains cas

Donc :
- le focus visuel survit
- le focus fonctionnel d’ouverture de fiche est perdu

## Mise en oeuvre proposée

### 1. Faire du prop-driven la source de vérité pour l’ouverture de la fiche espèce
Dans `EventBiodiversityTab` et `SpeciesExplorer`, conserver le `focusSpeciesId` tant que la correspondance espèce n’a pas réellement été trouvée et ouverte.

Objectif UX :
- aucun timeout “d’abandon” court
- pas de perte du focus si les données arrivent tard
- ouverture exactement une fois

### 2. Remplacer la consommation prématurée par un ack réel d’ouverture
Dans `SpeciesExplorer` :
- ne consommer le focus **que lorsque `selectedSpecies` est effectivement défini**
- supprimer la logique actuelle qui “give up” après ~800 ms
- garder une protection d’idempotence pour éviter les réouvertures parasites

Effet attendu :
- si la grille met 2 s à arriver, le drawer s’ouvre quand même dès que l’espèce est disponible

### 3. Rendre la résolution d’espèce plus tolérante et stable
Unifier le matching avec une normalisation robuste :
- NFD + suppression des diacritiques
- lowercase + trim
- exact scientific name
- fallback `startsWith` / authority suffix
- fallback nom commun FR/EN si présent

Et aligner ce matching avec le `data-focus-id` utilisé pour le halo, pour que le focus visuel et le focus fonctionnel parlent exactement de la même cible.

### 4. Durcir le flux parent : focus conservé tant que l’enfant ne l’a pas confirmé
Dans `EventBiodiversityTab` :
- garder `pendingSpeciesFocus` tant que `SpeciesExplorer` n’a pas confirmé l’ouverture
- ne jamais l’effacer sur simple attente ou premier render vide
- ne l’effacer qu’après succès ou impossibilité certaine après chargement complet

### 5. Fiabiliser l’entrée du flux depuis la recherche
Dans `SearchResultCard` / `GlobalSearchOverlay` :
- vérifier que tous les chemins de clic d’un résultat espèce portent le même contexte (`eventId`, `explorationId`, `marcheId`)
- éviter qu’un CTA secondaire ouvre une fiche sans contexte alors que le clic principal ouvre la bonne occurrence

Ce point n’est pas la cause directe du bug reproduit, mais il est nécessaire pour un comportement cohérent sur tout le flux de recherche.

### 6. Réduire la dépendance au bus pour ce cas critique
Conserver le bus pour les usages secondaires, mais faire en sorte que l’ouverture du drawer espèce repose d’abord sur le flux déterministe :
`URL/search target -> ExplorationMarcheurPage -> EventBiodiversityTab -> SpeciesExplorer`

Le bus devient un renfort, pas la mécanique principale.

## Fichiers concernés
- `src/components/biodiversity/SpeciesExplorer.tsx`
- `src/components/community/EventBiodiversityTab.tsx`
- `src/components/community/ExplorationMarcheurPage.tsx`
- `src/components/search/SearchResultCard.tsx`
- `src/components/search/GlobalSearchOverlay.tsx`

## Validation prévue
Je validerai dans le navigateur avec le parcours exact :
- `catalpa` → `Catalpa du sud` → `ROQUE GAGEAC / Jardin`

Critères de succès :
- arrivée sur le bon événement
- **Biodiversité > Taxons observés** actif
- halo visible sur **Catalpa du sud**
- **drawer droit ouvert automatiquement** sans clic supplémentaire
- fermeture manuelle possible puis réouverture correcte via une nouvelle recherche
- comportement stable même avec chargement lent

## Détail technique
- supprimer la consommation sur timeout court dans `SpeciesExplorer`
- consommer uniquement après `setSelectedSpecies(match)`
- garder le focus pending côté parent tant que `species[]` n’est pas exploitable
- n’effacer le pending qu’après succès ou absence confirmée après chargement complet
- harmoniser la normalisation de matching entre focus, halo et carte espèce
- vérifier que les CTA secondaires de `SearchResultCard` n’échappent pas au contexte de la ligne sélectionnée