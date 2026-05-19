## Objectif

Sur l'onglet **Synthèse → Synthèse** d'une exploration, remplacer le bloc actuel `ExplorationDefaultRadiusBlock` (carte verte « Rayon d'observation par défaut de l'exploration ») par un **bandeau ultra-discret**, replié par défaut, qui résume les rayons paramétrés marche par marche et permet de les modifier individuellement ou en lot, avec relance automatique de la collecte des taxons.

## UX — bandeau replié (1 ligne)

Une seule ligne, neutre, intégrée juste sous « 5 étapes analysées » :

```text
◎ Rayons d'observation · 5 marches · moy. 320 m · min 50 m · max 1 km     [chevron ▾]
```

- Pas de cadre vert imposant, juste un fond `bg-card/30`, bordure très fine.
- Icône cible (`Crosshair`/`Target` lucide), chevron à droite.
- Tout le bandeau est cliquable pour basculer ouvert/fermé.
- Stat moyenne pondérée arrondie (m si < 1000, sinon km).

## UX — bandeau déplié (tableau compact)

Sous la ligne d'en-tête, un tableau léger :

```text
┌────────────────────────────────────────────────────────────────────────┐
│ ◎ Rayons d'observation · 5 marches · moy. 320 m         [▴ replier]   │
├────────────────────────────────────────────────────────────────────────┤
│ [Appliquer à toutes les marches ▾]   Défaut exploration : 500 m       │
├────────────────────────────────────────────────────────────────────────┤
│ #1  POTAGER sols vivants   11.03    [15 m]●  0.001 km²  override     │
│ #2  Verger ancien          12.03    [500 m]  0.79 km²   défaut       │
│ #3  Lisière forestière     13.03    [1 km]●  3.14 km²   override     │
│ ...                                                                    │
└────────────────────────────────────────────────────────────────────────┘
```

Colonnes : ordre, nom marche, date, chip rayon (cliquable → popover presets 15m/25m/50m/150m/250m/500m/1km/2.5km/5km), zone couverte (km²), badge `défaut` ou `override` (point vert).

Permissions : lecture pour tous, édition réservée `admin` / `sentinelle` / `ambassadeur` (mêmes règles que le bloc actuel).

## Action « Appliquer à toutes les marches »

Bouton en tête de tableau ouvrant un menu de presets identique au sélecteur de marche. Au clic sur un preset :

1. Confirmation discrète (`AlertDialog` inline) : « Définir 250 m comme rayon de toutes les marches ? Les rayons personnalisés seront remplacés. »
2. Si confirmé : `UPDATE` en lot sur toutes les `marches.radius_m` de l'exploration via une mutation (Promise.all sur la même mutation existante, ou nouvelle RPC `set_all_marches_radius(exploration_id, radius_m)` — voir question 1).
3. Lance la re-collecte (cf. section suivante).

Option « Retirer tous les overrides » (radius_m = null) accessible dans le même menu.

## Relance automatique de la collecte + toast

Comportement unifié (auto + toast) :

- À chaque changement de rayon (unitaire **ou** bulk), après succès de l'UPDATE, on appelle `useTriggerBiodiversityCollection.mutate(explorationId)`.
- Toast `sonner` avec étapes : `loading('Recalcul des taxons…')` → `success('92 → 104 espèces · 5 marches recalculées')` ou `error(...)`.
- **Contournement du rate limit 24h** : l'edge function `collect-event-biodiversity` ignore aujourd'hui les marches ayant un snapshot < 24h. Pour qu'un changement de rayon recolle immédiatement, on ajoute un paramètre optionnel `force?: boolean` (et/ou `marcheIds?: string[]`) à l'edge function. Le front passe `{ explorationId, force: true, marcheIds: [...changedIds] }`. Cf. question 2 pour la stratégie exacte.
- Debounce 800 ms côté UI pour éviter de spammer la fonction si l'utilisateur change plusieurs marches en quelques secondes (on cumule les `marcheIds` puis on lance un seul appel).

## Découpage technique

1. **Nouveau composant** `src/components/community/exploration/ExplorationRadiusSummary.tsx`
   - Replace l'import de `ExplorationDefaultRadiusBlock` dans `EventBiodiversityTab.tsx` (ligne 487).
   - Garde la même interface props (`explorationId`, `userRole`, `fallbackSnapshotRadiusM`).
   - État local `expanded` (default `false`), `pendingMarcheIds: Set<string>` pour le debounce.

2. **Nouveau hook** `useExplorationMarchesRadius(explorationId)`
   - SELECT `id, nom_marche, ville, latitude, longitude, radius_m, exploration_marches.ordre, marches.date` filtré par `exploration_id` + `publication_status in (published, published_public)`.
   - Retourne aussi `defaultRadiusM` (depuis `explorations.default_radius_m`), `avg`, `min`, `max`, `count`.

3. **Mutation bulk** dans `useUpdateRadius.ts` :
   - `useBulkUpdateMarchesRadius({ explorationId, marcheIds, radiusM })` → `UPDATE marches SET radius_m = $1 WHERE id = ANY($2)`.
   - Pas besoin de RPC SECURITY DEFINER si les policies d'UPDATE existantes le permettent déjà aux ambassadeurs/sentinelles (à vérifier dans la migration en cours, cf. question 3).

4. **Edge function** `collect-event-biodiversity` : ajout du paramètre `force` (bypass rate limit 24h) et optionnellement `marcheIds` (process subset). Garde la signature actuelle rétro-compatible.

5. **Reuse** : le popover de presets réutilise `RADIUS_PRESETS_M` déjà défini dans `RadiusSelector.tsx` (à exporter si pas déjà fait).

## Fichiers touchés

- `src/components/community/EventBiodiversityTab.tsx` — swap import (~ligne 21, 487).
- `src/components/community/exploration/ExplorationRadiusSummary.tsx` — **nouveau**.
- `src/components/community/exploration/RadiusPresetPopover.tsx` — **nouveau** (chip + popover réutilisable).
- `src/hooks/useUpdateRadius.ts` — ajout `useBulkUpdateMarchesRadius`.
- `src/hooks/useExplorationMarchesRadius.ts` — **nouveau**.
- `supabase/functions/collect-event-biodiversity/index.ts` — paramètres `force`, `marcheIds`.
- `src/hooks/useTriggerBiodiversityCollection.ts` — accepter `{ explorationId, force?, marcheIds? }`.
- `src/components/community/exploration/ExplorationDefaultRadiusBlock.tsx` — **supprimé** (ou gardé deprecated si tu préfères transitionner).

## Questions restantes (pour finaliser)

1. **Bulk update — RPC ou UPDATE direct ?** Préfères-tu une RPC `SECURITY DEFINER` (audit / log centralisé) ou un simple UPDATE multi-id côté front (plus simple, dépend des RLS) ?
2. **Force re-collecte** — OK pour ajouter un flag `force: true` côté edge function qui bypass la fenêtre 24h **uniquement** quand l'appel provient d'un changement de rayon ? (Sinon on garde le rate limit pour les recalculs manuels.)
3. **Suppression du bloc actuel** : on supprime totalement `ExplorationDefaultRadiusBlock`, ou on garde le « Défaut exploration » accessible uniquement depuis l'en-tête du tableau (`Défaut : 500 m [modifier]`) — ma préférence est l'option 2, intégrée, pour rester ultra-discret.
4. **Visibilité non-éditeurs** : pour un marcheur simple (lecture seule), affiche-t-on quand même le tableau déplié (informatif) ou uniquement la ligne repliée avec les stats ?
