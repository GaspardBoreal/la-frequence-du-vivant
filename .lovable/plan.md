## Problème

Le bouton **"Lancer l'analyse IA"** est désactivé (`disabled={triggerAi.isPending || pool.length === 0}`).

Pour cette exploration `70fcd8d1…` :
- 1 marche `df85910e…` sans `latitude`/`longitude`
- 0 snapshot biodiversité, 0 espèce dans le pool

→ La condition `pool.length === 0` rend le bouton non-cliquable et l'utilisateur n'a **aucun moyen de comprendre quoi faire**.

## Cause racine (deux niveaux)

1. **UX bloquante** : on désactive le bouton sans expliquer *pourquoi*.
2. **Architecture passive** : l'analyse IA dépend d'un snapshot iNaturalist préexistant. Si la marche n'a pas encore été géolocalisée ou collectée, le pipeline reste muet — alors que le brief initial était « parcourir l'ensemble des marches et lancer la collecte ».

## Solution proposée

### A. Front — `OeilCuration.tsx` (correctif immédiat)

1. **Toujours rendre le bouton cliquable** quand l'utilisateur est curateur (retirer `pool.length === 0` de `disabled`).
2. **Diagnostic visible** : remplacer le bandeau "Aucune analyse IA…" par un état précis basé sur les marches de l'exploration :
   - Aucune marche → « Crée d'abord une marche dans l'onglet Marches. »
   - Marches sans GPS → « X marche(s) sans coordonnées GPS. Renseigne la latitude/longitude pour lancer l'analyse. » + lien direct vers l'édition de la marche.
   - Marches GPS OK mais 0 snapshot → « Coordonnées prêtes — clique pour collecter la biodiversité et lancer l'analyse. »
   - Pool > 0 → état actuel.
3. **Spinner + toast clair** pendant `triggerAi.isPending`.

### B. Edge function `analyze-exploration-species` (auto-collecte)

Avant l'appel IA, si `pool` est vide mais qu'au moins une marche a des coordonnées :

1. Lister les `marche_events` de l'exploration ayant `latitude` ET `longitude`.
2. Pour chacune sans snapshot frais (>30j ou absent), appeler en interne `collect-event-biodiversity` (ou la chaîne `collect-biodiversity-step`) pour peupler `biodiversity_snapshots`.
3. Re-construire le pool, puis lancer l'IA comme aujourd'hui.
4. Renvoyer un payload structuré au front :
   ```json
   { "analyzed": 12, "collected_marches": 2, "skipped_no_gps": 1 }
   ```
5. Cas limites :
   - Aucune marche avec GPS → renvoyer 422 + message exploitable affiché en toast.
   - Collecte qui échoue partiellement → continuer avec ce qui est disponible, signaler.

### C. Petit hook utilitaire

Nouveau hook `useExplorationMarchesGpsStatus(explorationId)` qui retourne `{ total, withGps, withoutGps, withSnapshots }` — utilisé par le bandeau diagnostic du A.

## Fichiers touchés

- `src/components/community/insights/curation/OeilCuration.tsx` — bandeau + bouton activé
- `src/hooks/useExplorationMarchesGpsStatus.ts` — **nouveau**
- `src/hooks/useExplorationAiAnalysis.ts` — gestion des nouveaux codes retour (422, partial)
- `supabase/functions/analyze-exploration-species/index.ts` — auto-collecte avant analyse

## Détails techniques

- L'auto-collecte se fait **côté edge function** (service role) pour ne pas multiplier les allers-retours et ne pas exposer la logique de collecte au client.
- On garde le cap `MAX_SPECIES = 60` après agrégation post-collecte.
- Le bandeau utilise les mêmes couleurs ambrées du gradient existant pour cohérence.
- Pas de migration DB nécessaire.

## Ce qui n'est PAS dans ce plan

- Géocodage automatique d'une marche depuis son adresse (pourra venir plus tard si besoin).
- Re-design du panneau Apprendre (déjà couvert par L3a/L3b).
