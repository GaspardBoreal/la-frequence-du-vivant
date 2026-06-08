---
name: Public global stats — source of truth
description: RPC `get_public_global_stats` + hook `usePublicGlobalStats` alimentent /agent-ia, /agent-ia/fiche (PDF dynamique imprimable) et /marches-du-vivant (ScienceCounters, ProofBar) ; jamais de valeurs hardcodées
type: feature
---
Source unique pour TOUS les chiffres publics : RPC `public.get_public_global_stats()` (SECURITY DEFINER, exposée à anon) renvoyant `especes_tracees` (union scientificName sur tous les snapshots), `domaines` (marches), `marches_organisees` (marche_events), `marcheurs` (community_profiles), `observations_citoyennes` (marcheur_observations), `participations_validees` (validated_at not null), `photos_collectees` (marche_photos + marcheur_medias.type_media='photo'), `computed_at`.

Hook `usePublicGlobalStats` (staleTime 15min, refetchOnMount:'always'). Branché sur : `src/pages/AgentIA.tsx` (4 KPI), `src/pages/AgentIAFiche.tsx` (route `/agent-ia/fiche` — fiche A4 imprimable, auto window.print, remplace l'ancien PDF statique), `src/components/marches-vivant/ScienceCounters.tsx` (3 KPI alignés terminologie), `src/components/marches-vivant/ProofBar.tsx`.

**Règle :** jamais de fallback hardcodé pour ces 7 KPI ; jamais réintroduire `useBiodiversityStats`/`usePhotosCount` pour ces vues publiques. Le PDF statique `public/fiche-agent-marches-du-vivant.pdf` est obsolète (conservé comme fallback seulement).
