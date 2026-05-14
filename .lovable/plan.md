# Plan

## Objectif
Relancer le backfill iNaturalist pour l’événement `DEVIAT / Jardin Monde du 11.03.26 à aujourd'hui`, puis identifier précisément pourquoi l’orchidée visible dans la Fréquence n’a pas été rattachée au carnet marcheur de Laurence.

## Ce que j’ai déjà confirmé
- Laurence Karki a bien une participation sur cet événement.
- Laurence a bien un compte iNaturalist lié : `laurencekarki`.
- Un backfill manuel a déjà réussi le `10/05` sur cette exploration : `20` insertions sur `4` marches.
- L’événement DEVIAT appartient à l’exploration `20dd3be8-e594-492c-998a-5c4d009a5094`.
- Le trigger automatique n’a vraisemblablement pas joué pour Laurence au moment de sa participation, car sa participation a été créée avant l’installation du trigger de backfill.

## Exécution proposée
1. **Relancer la fonction ciblée pour Laurence sur cet événement**
   - Appeler `backfill-marcheur-inaturalist` avec :
     - `user_id = 0c9a3fbe-20d0-4989-bde9-24678768e85f`
     - `exploration_id = 20dd3be8-e594-492c-998a-5c4d009a5094`
     - `marche_event_id = f6095e8d-44a8-4156-951f-dd604b821603`
     - `source = manual_event_recheck`
   - C’est sûr côté données : la fonction fait un `upsert` idempotent sur `(marcheur_id, marche_id, species_scientific_name)`.

2. **Lire le log de ce run immédiatement après**
   - Vérifier :
     - `inat_login`
     - `marches_scanned`
     - `candidates`
     - `observations_inserted`
     - éventuelle `error`
   - Cela dira si la fonction voit bien des observations iNaturalist brutes pour Laurence aujourd’hui.

3. **Comparer le backfill avec les snapshots qui comptent déjà l’orchidée**
   - Contrôler les marches DEVIAT où `Anacamptis pyramidalis` apparaît déjà dans `biodiversity_snapshots`.
   - Comparer ces données au périmètre réel utilisé par le backfill, qui repose uniquement sur :
     - le `user_login` iNaturalist,
     - les coordonnées des `exploration_marches`,
     - un rayon fixe de `500 m`.

4. **Isoler la cause exacte du non-match**
   - Je m’attends à confirmer l’une de ces causes :
     - **cause A — pas de relance après la nouvelle observation** : le backfill a tourné le 10/05, mais l’orchidée du 14/05 est plus récente ;
     - **cause B — écart de pipeline** : l’orchidée est visible dans les snapshots via attribution/fusion, mais pas récupérable par le backfill basé sur `user_login` iNaturalist ;
     - **cause C — écart géographique** : l’observation est hors du rayon de 500 m autour des marches GPS de l’exploration ;
     - **cause D — périmètre exploration vs événement** : la fonction scanne les marches de l’exploration, pas une logique enrichie par parcelle/section de l’événement.

## Si le diagnostic confirme le bug
Je proposerai ensuite une correction minimale et robuste, sans élargir le scope inutilement :
- soit **ajouter une relance manuelle par événement**,
- soit **ajouter un fallback depuis les attributions de snapshot** quand iNaturalist `user_login` ne suffit pas,
- soit **adapter le périmètre GPS** si la parcelle 362 n’est pas couverte par les marches actuelles.

## Détail technique
- Fonction concernée : `supabase/functions/backfill-marcheur-inaturalist/index.ts`
- Limites actuelles observées :
  - scan par `user_login` iNaturalist uniquement ;
  - rayon fixe `0.5 km` ;
  - scan des `exploration_marches` plutôt qu’un périmètre événement enrichi ;
  - aucune lecture des attributions déjà présentes dans `biodiversity_snapshots` pour compléter `marcheur_observations`.

Si tu valides, j’exécute la relance ciblée puis je te donne la cause exacte du non-match sur cet événement.