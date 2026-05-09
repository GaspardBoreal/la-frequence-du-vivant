# Fix : Picker des pratiques emblématiques aligné sur l'onglet Marcheurs

## Diagnostic

Deux sources différentes étaient utilisées :

| Endroit | Hook | Personnes affichées |
|---|---|---|
| Onglet Marcheurs | `useExplorationParticipants` | crew éditorial **+** participants validés **+** orphelins (≈ 12+ personnes) |
| Picker pratiques | `useExplorationMarcheurs` | crew éditorial seulement (6 personnes) |

→ Jean‑François Servant, inscrit comme participant à une marche de l'exploration, n'a pas de fiche `exploration_marcheurs`, donc invisible dans le Picker.

Le schéma actuel de `curation_marcheurs.marcheur_id` référence en clé étrangère `exploration_marcheurs(id)` — il faut donc qu'une fiche éditoriale existe pour pouvoir l'associer.

## Approche retenue : "Shadow crew row" automatique

Quand on associe un participant communautaire à une pratique, on crée automatiquement (ou on récupère) sa fiche `exploration_marcheurs` "shadow" (avec `user_id` lié), puis on lie via `curation_marcheurs.marcheur_id`. Cela préserve :
- le schéma existant (FK, RLS, RPCs) ;
- la cohérence avec tout le système (réattribution médias, observations, etc. fonctionnent déjà avec ce pattern de shadow row → cf. `crewIdByUserId` dans `useExplorationParticipants`).

## Étapes

### 1. Picker — changer la source de données

`PratiqueMarcheursPicker` consomme désormais `useExplorationParticipants(explorationId)` au lieu de recevoir `marcheurs` en prop. Liste enrichie : photo + nom + sous‑label rôle (Marcheur, Sentinelle, etc.). Tri identique à l'onglet (par contributions).

`MainCuration` n'a plus besoin de mapper les marcheurs — il passe juste `explorationId` au Picker.

### 2. RPC `attach_pratique_to_marcheur` étendue

Nouvelle signature :
```
attach_pratique_to_marcheur(
  p_curation_id uuid,
  p_marcheur_id uuid DEFAULT NULL,   -- crew row direct
  p_user_id uuid DEFAULT NULL,        -- participant communautaire
  p_role_label text DEFAULT NULL
) RETURNS uuid
```

Logique :
- Vérifie auth (admin / ambassadeur / sentinelle) — inchangé.
- Si `p_marcheur_id` fourni → comportement actuel.
- Si `p_user_id` fourni :
  1. cherche `exploration_marcheurs` où `user_id = p_user_id` AND `exploration_id = (curation.exploration_id)` ;
  2. si absent : crée une shadow row (prenom/nom/avatar copiés depuis `community_profiles`, `role='marcheur'`, `couleur` par défaut, `ordre` = MAX+1) ;
  3. utilise l'`id` de cette row comme `marcheur_id` pour l'INSERT dans `curation_marcheurs`.
- `ON CONFLICT (curation_id, marcheur_id) DO UPDATE` sur `role_label` — inchangé.

### 3. Hook `useAttachPratique`

Accepte désormais `{ curation_id, marcheur_id?, user_id?, role_label? }`. Le Picker envoie `marcheur_id` pour les crew rows et `user_id` pour les participants purs (selon la source `'crew' | 'community'` de `MarcheurWithStats`).

### 4. Pas d'autres changements

- `detach_pratique_from_marcheur` reste inchangée (retire toujours via `marcheur_id`).
- Le calcul de Fréquence (V4) reste inchangé : il compte par `marcheur_id` sur les fiches éditoriales — la shadow row créée fournit ce `marcheur_id` correctement.
- Aucune migration des données existantes.

## Détails techniques

```text
Picker
 └─ useExplorationParticipants(explorationId)   // mêmes ~12 personnes que l'onglet
     ├─ source='crew'      → attach({ marcheur_id: crewId })
     └─ source='community' → attach({ user_id })   // shadow row créée par la RPC
```

Migration SQL : `CREATE OR REPLACE FUNCTION public.attach_pratique_to_marcheur(...)` avec les nouveaux paramètres optionnels et la logique d'auto‑création.

Fichiers modifiés :
- `supabase/migrations/<new>.sql` (RPC étendue)
- `src/hooks/useCurationMarcheurs.ts` (signature mutate)
- `src/components/community/insights/curation/PratiqueMarcheursPicker.tsx` (source + props)
- `src/components/community/insights/curation/MainCuration.tsx` (props simplifiées)

## Validation

Sur l'exploration `70fcd8d1…` (DEVIAT) : Jean‑François Servant, Victor Boixeda, Jean‑Paul Chiron, Laurent Tripied apparaissent dans le Picker. Associer Jean‑François à "Culture de Co…" crée silencieusement sa shadow row + le lien, et il est compté dans son indice Sentinelle ensuite.
