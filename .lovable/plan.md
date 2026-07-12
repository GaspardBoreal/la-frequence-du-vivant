## Objectif

Fusionner les KPI de `/admin/marche-events` dans le hero de `/marches-du-vivant/carte-marches-du-vivant`, avec un design premium et un affichage progressif animé.

## KPI cibles (2 rangées de 3)

**Rangée 1 — Le terrain**
- 17 Marches (marche_events géolocalisés)
- 87 Points d'observations (marches associées, distinctes)
- 617 km parcourus (somme distances)

**Rangée 2 — Le vivant**
- 56 Marcheurs actifs (community_profiles)
- 124 Participations (participations validées)
- 11 422 Espèces recensées (recalculé, voir plus bas)

Le compteur `753 Partenaires Sol Vivant` disparaît du hero (la couche Sol Vivant reste activable dans les filtres).

## Correction du compteur Espèces

Actuellement `get_carte_mdv_hero_stats` fait `SUM(MAX(total_species) per marche_id)` sur `biodiversity_snapshots`. Le résultat peut inclure des doublons entre snapshots multiples d'une même marche et n'est pas aligné avec le compteur par événement affiché ailleurs.

Nouvelle logique : réutiliser la source qui alimente déjà chaque carte événement — la RPC `get_marches_map_events` renvoie `species_count` par événement (dédoublonné par scientificName au sein de l'événement). Le total = `SUM(species_count)` sur tous les événements retournés. Ainsi le hero est **strictement égal à la somme visible sur les cartes événements**, sans doublon intra-événement.

## Migration Supabase

Recréer `get_carte_mdv_hero_stats()` retournant 6 champs :
`events_count`, `marches_count`, `total_km`, `marcheurs_count`, `participations_count`, `species_count`, `computed_at`.

- `events_count` : `COUNT(*) FROM marche_events WHERE latitude IS NOT NULL`
- `marches_count` : `COUNT(DISTINCT marche_id) FROM exploration_waypoints` liés aux marche_events (même logique que le KPI admin)
- `total_km` : même calcul que `get_marche_events_dashboard_stats.total_km`
- `marcheurs_count` : `COUNT(*) FROM community_profiles`
- `participations_count` : `COUNT(*) FROM marche_participations WHERE validated_at IS NOT NULL`
- `species_count` : `SELECT SUM(species_count) FROM public.get_marches_map_events()`

SECURITY DEFINER, GRANT EXECUTE TO anon, authenticated.

## Frontend

### `src/hooks/useCarteMdV.ts`
- Étendre `HeroStats` avec les nouveaux champs, retirer `partners_count`.
- `useCarteMdVHeroStats` conserve staleTime 5 min.

### `src/components/carte-mdv/CarteMdVHero.tsx` — redesign wow

Layout : bloc hero conservé (titre + accroche + CTA), puis **grille 2×3** de KPI-cards en dessous.

Chaque card :
- Fond `bg-card/40 backdrop-blur-xl` + bordure `border-primary/10` + halo radial `bg-[radial-gradient(...)]` en hover.
- Icône Lucide dans une pastille circulaire teintée (Footprints, MapPin, Route, Users, CheckCircle2, Sparkles) — teintes cohérentes avec le thème Forêt Émeraude / Papier Crème.
- Valeur numérique en `text-3xl sm:text-4xl font-serif tabular-nums`, avec **count-up animé** (0 → valeur finale sur 1,2 s, easing `easeOutCubic`, via `requestAnimationFrame`, formatage `Intl.NumberFormat('fr-FR')`).
- Label court + sous-label discret (ex: « Points d'observations » / « marches associées »).
- Animation d'entrée : `opacity 0 → 1` + `translateY 8px → 0`, **stagger 80 ms par card** via délai CSS, déclenchement dès que la data est chargée (skeleton pulse tant que `isLoading`).
- Séparation visuelle discrète entre les 2 rangées : label chapô « Le terrain » / « Le vivant » en `text-xs uppercase tracking-widest text-muted-foreground`.

Skeleton : chaque card affiche un `<div className="h-8 w-16 bg-muted/40 rounded animate-pulse" />` à la place de la valeur tant que `isLoading`, pour que le hero apparaisse instantanément sans layout shift, puis les chiffres s'animent au chargement.

### Aucun autre écran modifié
`ScienceCounters`, `ProofBar`, `AgentIA` restent branchés sur `usePublicGlobalStats` (source séparée, cf. mémoire dédiée).

## Fichiers touchés

- Migration SQL : redéfinition `get_carte_mdv_hero_stats`
- `src/hooks/useCarteMdV.ts` — type `HeroStats`
- `src/components/carte-mdv/CarteMdVHero.tsx` — nouveau design + count-up

## Hors scope

Modification de `usePublicGlobalStats`, du bandeau admin `EventsKpiBanner`, ou de la couche Sol Vivant.
