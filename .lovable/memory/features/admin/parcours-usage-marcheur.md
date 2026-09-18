---
name: Parcours d'usage par marcheur
description: Onglet « Parcours » dans /admin/community — chronologie par marcheur et période (marches, jardins, contributions, recherches, échanges Assistant)
type: feature
---

- RPC `get_marcheur_parcours(_user_id, _from, _to)` (SECURITY DEFINER, admins seulement) : fusionne `marcheur_activity_logs`, contributions (`marcheur_medias`, `marcheur_observations` via `marcheur_id` = profil, `marcheur_textes`, `marcheur_audio`), `marche_participations`, `search_logs` et `assistant_messages`, avec noms résolus (exploration/événement/jardin).
- Tables `assistant_conversations` / `assistant_messages` : lecture auteur + admins, écriture service_role uniquement, aucun anon. Une conversation par surface et cible, réutilisée 2 h.
- Journalisation côté edge : `supabase/functions/_shared/assistant-log.ts` duplique le flux SSE (`tee`) et enregistre question + réponse après diffusion, sans ralentir la réponse. Branché dans `propriete-chat` (surfaces `jardin` / `iot`) et `community-chat` (surface `communaute`).
- Traces jardin : `useActivityTracker` accepte `proprieteId` (rangé dans `metadata.propriete_id`) ; `useProprieteTracker(proprieteId)` émet `propriete_view` avec `{ module, action, cible }`.
- Front : `src/hooks/admin/useMarcheurParcours.ts`, `src/components/admin/community/parcours/{ParcoursTab,ParcoursTimeline}.tsx`. Vocabulaire « Assistant », mobile first.
