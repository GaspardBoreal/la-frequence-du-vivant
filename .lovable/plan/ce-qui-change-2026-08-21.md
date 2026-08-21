Remplacer le compteur "Sols documentés" par "Prélèvements analysés" dans la section Science Participative de `/marches-du-vivant`.

## Ce qui change

- Le cinquième compteur passe de :
  - **Sols documentés** (avec sous-label "45 prélèvements analysés")
- À :
  - **45 prélèvements analysés** (le nombre de prélèvements analysés devient le label principal)

- Le nombre est déjà calculé dynamiquement par le RPC `public.get_public_global_stats()` via la clé `prelevements_analyses` (table `propriete_test_medias`). Aucun changement de base de données n'est nécessaire.

## Fichiers concernés

1. `src/components/marches-vivant/ScienceCounters.tsx`
   - Transformer le compteur "Sols documentés" pour afficher `prelevements_analyses` comme valeur principale.
   - Label principal : "Prélèvements analysés".
   - Retirer le sous-label existant.
   - Conserver l'icône `Layers` ou la remplacer par une icône plus adaptée aux prélèvements (ex. `FlaskConical` ou `TestTube`).
   - S'assurer que la grille reste responsive (`grid-cols-2 md:grid-cols-3`).

2. `src/hooks/usePublicGlobalStats.ts`
   - Aucun changement requis : l'interface contient déjà `prelevements_analyses: number`.

3. Base de données
   - Aucune migration requise : la valeur est calculée dynamiquement à chaque appel du RPC existant.

## Règle à respecter

- Pas de valeur en dur. Le chiffre doit provenir exclusivement du hook `usePublicGlobalStats` (donc du RPC).
- Maintenir la mention "Chiffres recalculés en direct à chaque consultation".
