# Analyses : « Lecture impossible » alors que les sondes émettent

## Ce qu'on observe
- Onglet **Poste de contrôle** : 200 relevés sur 24 h, frises de vitalité pleines pour Potager d'Été et d'Hiver.
- Onglet **Analyses** : en-tête « 3 sondes · **0 relevés** sur 30 jours », donc chaque sonde tombe en « Lecture impossible ».

En base, les mesures existent bien : 2 611 et 2 310 relevés sur 30 jours (source `webhook`, non rejetés) pour les deux sondes du potager. Le problème est donc côté lecture front, pas côté données.

## Cause
Les deux onglets n'utilisent pas la même requête :
- Poste de contrôle lit les mesures sans valeur initiale : la requête part normalement.
- Analyses passe par la fenêtre glissante, qui déclare une **valeur initiale « fenêtre vide »**. React Query considère alors cette fenêtre vide comme une donnée déjà chargée et fraîche (durée de fraîcheur 2 minutes), et **ne lance jamais la requête** quand la liste des sondes arrive. L'écran affiche donc 0 relevé, sans chargement ni erreur, et les verdicts concluent « la sonde ne transmet pas ».

## Correction
1. Supprimer la valeur initiale vide de la fenêtre de mesures : la requête doit réellement partir dès que les identifiants de sondes sont connus. Conserver un repli vide uniquement à la lecture (`data ?? fenêtre vide`), pour ne rien casser chez les autres consommateurs (IA de jardin, palette, télémétrie).
2. Garder l'affichage stable pendant un changement de fenêtre (7/30/90 j) avec une donnée de remplacement (ancienne fenêtre conservée) plutôt qu'une donnée initiale figée.
3. Distinguer trois états dans l'en-tête et les cartes : *lecture en cours*, *aucune mesure sur la fenêtre*, *mesures présentes*. « Lecture impossible » ne doit plus apparaître tant que la lecture n'est pas terminée.
4. Remonter une erreur de lecture visible (bandeau discret) si la requête échoue, au lieu de la faire passer pour une absence de données.

## Détails techniques
- `src/hooks/iot/useIotTelemetry.ts` — `useMesuresWindow` : retirer `initialData: EMPTY_WINDOW`, ajouter `placeholderData: (prev) => prev`, exposer `isFetching`/`error`.
- `src/hooks/iot/useIotAnalyses.ts` : `const win = query.data` puis `win?.rows ?? []` ; propager `isLoading`/`isFetching`/`error`.
- `src/components/iot/analyses/AnalysesTab.tsx` : en-tête et cartes conditionnés sur ces états ; message « Aucun relevé sur cette fenêtre » distinct de « Lecture impossible ».
- Vérification après correctif : l'en-tête doit afficher un nombre de relevés cohérent avec le poste de contrôle sur la fenêtre 30 jours.
