# Onglet « Biodiversité » de la marche « Les Secrets de Sauniers »

## Ce que j'ai vérifié

- L'événement du 12 septembre est bien relié à ses deux marches (Amont le village, Aval le marais), créées ce matin à 12h03 (heure de Paris).
- La collecte du vivant a bien eu lieu à 16h52 : 63 espèces sur le segment village, 66 sur le marais. Les données existent donc en base.
- L'écran que vous voyez (« Empreinte en attente ») date d'avant cette collecte : l'écran ne s'est jamais rafraîchi tout seul.

## La cause

Quand on lance « Révéler l'empreinte vivante », l'application prévient bien quelques écrans qu'il y a du nouveau — mais pas celui de l'onglet Biodiversité, qui utilise un nom de liste différent. Résultat : la collecte réussit, les données sont enregistrées, et l'écran continue d'afficher « Empreinte en attente » jusqu'à ce qu'on recharge la page à la main.

## Ce que je corrige

1. Après une collecte réussie, l'onglet Biodiversité se met à jour immédiatement : les espèces, les compteurs par règne, les taxons observés et le nombre d'étapes analysées apparaissent sans recharger la page.
2. Même chose pour les écrans voisins qui affichent le nombre d'espèces (en-tête de l'événement, carte, carnet), afin qu'ils annoncent tous le même chiffre au même moment.
3. Petit filet de sécurité : si la collecte se termine sans qu'aucune espèce ne soit trouvée, l'écran le dit clairement au lieu de rester figé sur « en attente ».

Aucune donnée n'est supprimée ni recollectée : les 106 espèces déjà connues sur ce territoire restent en place.

## Détail technique

- `src/hooks/useTriggerBiodiversityCollection.ts` : `onSuccess` invalide aujourd'hui `['event-biodiversity-snapshots']`, alors que `EventBiodiversityTab` lit `['event-biodiversity-snapshots-all', marcheIds]` — le préfixe ne correspond pas, donc aucune revalidation. Ajouter les clés réellement utilisées : `event-biodiversity-snapshots-all`, `event-marcheur-observations`, `exploration-marche-ctx`, `event-all-marches`, plus la clé du compteur unifié (`useExplorationSpeciesCount` / `get_exploration_species_count`) et `exploration-species-pool`.
- Vérifier après coup, en session administrateur, que le rendu passe bien de l'état vide à la grille de statistiques sans rechargement.
- Aucune migration, aucune modification de la fonction edge `collect-event-biodiversity`, aucune URL publique touchée.
