## Objectif

Afficher l'onglet **Profils** (mosaïque + dashboard d'impact) dans 3 contextes, avec **un seul code source** :

1. `/admin/community` → tous les marcheur·euse·s (déjà en place).
2. `/admin/marche-events` → tous les marcheur·euse·s (déjà en place).
3. `/admin/marche-events/:id` → **uniquement les participants validés de cet événement** (à ajouter).

Tout ajout fonctionnel futur (KPI, filtre, action…) doit s'appliquer automatiquement aux trois.

## Analyse de l'existant

- `ProfilsPanel` (composant racine) charge aujourd'hui **tous** les `community_profiles` et rend `<ProfilsImpactDashboard />` + `<ProfilsMosaique>` + `<MarcheurEditSheet>`.
- `ProfilsMosaique` est déjà 100 % réutilisable : il reçoit `profiles` en prop et gère ses filtres internes.
- `ProfilsImpactDashboard` est aujourd'hui **autonome** : il appelle `useCommunityImpactAggregates` qui frappe la RPC `get_community_impact_aggregates()` — sans paramètre, donc agrégats globaux.
- `MarcheEventDetail.tsx` a déjà une requête `marche-participations` filtrée sur `marche_event_id = :id`, et un onglet `Tabs` (3 triggers actuellement : Informations / Parcours vivant / Empreinte).
- La RPC actuelle ne sait pas filtrer par événement.

## Stratégie : un seul `ProfilsPanel` qui s'adapte au contexte

### 1. Étendre `ProfilsPanel` avec une prop `scope` optionnelle

```ts
type ProfilsScope =
  | { type: 'all' }                       // défaut — comportement actuel
  | { type: 'event'; eventId: string };   // restreint à un événement
```

- Sans `scope` (ou `scope.type === 'all'`) → comportement strictement identique à aujourd'hui (zéro régression sur `/admin/community` et `/admin/marche-events`).
- Avec `scope.type === 'event'` :
  - La requête `community-profiles-admin` devient `community-profiles-by-event` (clé incluant `eventId`) : on récupère d'abord les `user_id` validés de `marche_participations` pour cet événement, puis les `community_profiles` correspondants.
  - On passe le scope à `ProfilsImpactDashboard` pour qu'il agrège sur le même sous-ensemble.

### 2. Rendre `ProfilsImpactDashboard` "scope-aware" via une nouvelle RPC paramétrée

Créer une RPC `get_community_impact_aggregates_scoped(p_event_id uuid default null)` :
- Même logique que l'actuelle (mêmes clés JSON, même structure de retour → zéro changement côté UI).
- Si `p_event_id` est NULL → résultat identique à la fonction actuelle.
- Si `p_event_id` est fourni → la CTE `base` est filtrée :
  ```sql
  WHERE cp.user_id IN (
    SELECT mp.user_id
    FROM public.marche_participations mp
    WHERE mp.marche_event_id = p_event_id
  )
  ```
- `territories_count` devient le nombre d'`exploration_id` distincts liés à ce seul événement (1 ou 0), ce qui reste cohérent.
- Garde le check `check_is_admin_user(auth.uid())` + `SECURITY DEFINER` + `SET search_path = public`.
- L'ancienne RPC `get_community_impact_aggregates()` est conservée pour ne rien casser, mais le hook est mis à jour pour appeler la nouvelle (avec `null` par défaut → comportement identique).

Le hook `useCommunityImpactAggregates(eventId?: string)` accepte un argument optionnel et l'inclut dans la queryKey.

### 3. Nouvel onglet dans `MarcheEventDetail.tsx`

- Élargir la `TabsList` (ajout d'un 4ᵉ trigger « Profils » avec icône `Sparkles`).
- Ajouter `<TabsContent value="profils"><ProfilsPanel scope={{ type: 'event', eventId: id }} title="Profils des participant·e·s" subtitle="Portrait collectif des marcheur·euse·s validé·e·s sur cet événement." /></TabsContent>`.
- Onglet visible uniquement quand `!isNew` (cohérent avec les autres onglets dépendants de l'`id`).

## Garantie d'identité parfaite entre les 3 contextes

- Un seul composant `ProfilsPanel` rendu dans les 3 pages.
- Un seul composant `ProfilsImpactDashboard` rendu, alimenté par un seul hook.
- Un seul composant `ProfilsMosaique` (mêmes filtres internes, mêmes cartes).
- Un seul `MarcheurEditSheet` (édition identique partout).
- Les caches React Query sont segmentés par scope (`['community-profiles-admin']` global vs `['community-profiles-by-event', eventId]`) → pas de pollution croisée.

Toute évolution future (nouveau KPI, nouvelle colonne, nouveau filtre) ne se fait **qu'à un seul endroit** et apparaît instantanément dans les trois vues.

## Détails techniques

**Migration SQL** (1 nouvelle fonction, ancienne préservée) :
```sql
CREATE OR REPLACE FUNCTION public.get_community_impact_aggregates_scoped(
  p_event_id uuid DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE result jsonb;
BEGIN
  IF NOT public.check_is_admin_user(auth.uid()) THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;
  WITH base AS (
    SELECT cp.user_id, cp.role::text AS role, cp.genre::text AS genre,
           cp.csp::text AS csp, public.age_bracket(cp.date_naissance) AS bracket,
           cp.ville, cp.marches_count
    FROM public.community_profiles cp
    WHERE p_event_id IS NULL
       OR cp.user_id IN (
            SELECT mp.user_id FROM public.marche_participations mp
            WHERE mp.marche_event_id = p_event_id
          )
  )
  SELECT jsonb_build_object(
    'total', (SELECT COUNT(*) FROM base),
    /* ... mêmes clés que l'actuelle, en remplaçant simplement
       le sous-select 'territories_count' par une version filtrée si p_event_id non null ... */
    ...
  ) INTO result;
  RETURN result;
END $$;
```

**Fichiers touchés :**
- **Migration** : nouvelle RPC `get_community_impact_aggregates_scoped`.
- **Modifié** : `src/hooks/useCommunityImpactAggregates.ts` — accepte `eventId?: string`, appelle la nouvelle RPC.
- **Modifié** : `src/components/admin/community/ProfilsImpactDashboard.tsx` — accepte une prop optionnelle `eventId`, la transmet au hook.
- **Modifié** : `src/components/admin/community/ProfilsPanel.tsx` — accepte `scope?`, charge les profils via la requête appropriée, transmet `eventId` au dashboard.
- **Modifié** : `src/pages/MarcheEventDetail.tsx` — nouveau `TabsTrigger` + `TabsContent` "Profils" avec `<ProfilsPanel scope={{ type: 'event', eventId: id }} />`.

**Pas de modification** sur `CommunityProfilesAdmin.tsx` ni `MarcheEventsAdmin.tsx` : ils continuent de rendre `<ProfilsPanel />` sans scope → comportement strictement inchangé.

**Risque de régression** : minimal — l'ancienne RPC reste en place, les usages sans scope passent par un chemin de code (`p_event_id = NULL`) qui produit le même résultat que la fonction historique.
