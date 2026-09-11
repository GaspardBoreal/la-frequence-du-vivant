# Page Sauniers — chiffres vivants dans « Rejoignez la dynamique »

## Ce qui se passe aujourd'hui

Les quatre compteurs de la section (espèces, marcheurs, observations, photos) viennent déjà de la base et se rafraîchissent à chaque ouverture de la page.

En revanche le titre « Plus de 60 marcheurs » est écrit en dur. Le nombre réel de marcheurs aujourd'hui est 74 : le titre est donc en retard sur la réalité et ne bougera jamais tout seul.

## Ce que je change

1. **Titre calculé** : « Plus de 70 marcheurs », où le 70 est l'arrondi automatique à la dizaine inférieure du nombre réel de marcheurs. À 74 aujourd'hui, la page affichera « Plus de 70 marcheurs » ; à 81 demain, « Plus de 80 marcheurs ». Rien à modifier à la main.
2. **Pendant le chargement** : le titre reste neutre (« Rejoignez les marcheurs du réseau ») tant que le chiffre n'est pas connu, puis se précise — pas de nombre faux affiché une fraction de seconde.
3. **Fraîcheur à chaque ouverture** : la section redemande les chiffres à la base à chaque arrivée sur la page, comme c'est déjà le cas pour les quatre compteurs.

Aucun autre texte, style ou section de la page n'est touché.

## Détail technique

- `src/pages/SauniersProposition.tsx` : remplacer le `titre` littéral du `<Section eyebrow="REJOIGNEZ LA DYNAMIQUE…">` par une valeur dérivée de `stats?.marcheurs` (arrondi `Math.floor(n / 10) * 10`, seuil de repli si `< 10` ou valeur absente).
- Source inchangée : hook `usePublicGlobalStats` (RPC `get_public_global_stats`, `refetchOnMount: 'always'`), déjà monté dans la page — pas de requête supplémentaire.
- Pas de migration, pas de nouveau composant.
