# Science participative — chiffres enrichis

## Ce qui change

Le bloc « Science participative » de `/marches-du-vivant` passe de 3 à 6 compteurs :

| Compteur | Source |
|---|---|
| Espèces tracées | existant |
| Domaines documentés | existant |
| Observations citoyennes | existant |
| **Marcheurs** (nouveau) | `community_profiles` — déjà calculé par le RPC, simplement pas affiché |
| **Sols documentés** (nouveau) | diagnostics de sol enregistrés + prélèvements photographiés |
| **Mesures capteurs** (nouveau) | mesures IoT remontées par les sondes du réseau |

Valeurs actuelles constatées en base : 4 diagnostics de sol sur 4 propriétés, 45 médias de prélèvements, 8 266 mesures IoT depuis le 5 août 2026, 4 sondes (3 en service).

Affichage : grille responsive 2 colonnes en mobile, 3 en desktop, même carte que l'existant. Les 3 nouveaux indicateurs prennent une icône dédiée (marcheurs, sol, capteur) et une sous-légende discrète, par exemple « depuis août 2026 » pour les mesures IoT.

## Fraîcheur des chiffres

Vérifié : le RPC `get_public_global_stats()` recalcule tout à chaque appel (aucune table de cache, `computed_at` = `now()`). Côté client, le hook garde les données 15 min en cache mais refetch à chaque montage de page (`refetchOnMount: 'always'`) — donc chaque consultation déclenche bien une lecture Supabase. On conserve ce comportement et on ajoute une mention « Chiffres recalculés en direct » sous les compteurs.

## Détails techniques

1. Migration : remplacer `public.get_public_global_stats()` (même signature, jsonb) en ajoutant trois clés :
   - `sols_documentes` = nombre de lignes `propriete_soil_diagnostics`
   - `prelevements_analyses` = nombre de lignes `propriete_test_medias`
   - `mesures_capteurs` = nombre de lignes `iot_mesures`
   - `sondes_actives` = `iot_capteurs` dont l'état est « service »
   - `premiere_mesure_capteur` = `min(mesure_at)` pour la sous-légende
   Fonction toujours `STABLE SECURITY DEFINER`, `search_path = public`, exécutable par `anon` et `authenticated` (grants inchangés).
2. `src/hooks/usePublicGlobalStats.ts` : étendre l'interface `PublicGlobalStats` avec ces champs.
3. `src/components/marches-vivant/ScienceCounters.tsx` : ajouter les compteurs Marcheurs, Sols documentés, Mesures capteurs ; grille `grid-cols-2 md:grid-cols-3`.
4. Aucune valeur en dur — règle « source de vérité unique » respectée ; `/agent-ia` et la fiche imprimable continuent de fonctionner (clés existantes inchangées).
