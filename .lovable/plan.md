# Fix : 0 espèces / 0 règnes sur l'espace Propriété

## Diagnostic (confirmé par lectures DB)

L'onglet « J'observe » de `/propriete/:slug` interroge `biodiversity_snapshots` avec `marche_event_id`, mais cette colonne **n'existe pas** sur la table :

- `biodiversity_snapshots` est clé par `marche_id` (table historique `marches`)
- `marche_events` n'a **pas** de colonne `marche_id` — c'est une table parallèle
- Le lien propriété → événement passe par `propriete_marche_events.marche_event_id` (donc côté `marche_events`)

Résultat : la requête ne remonte rien → 0 espèces, 0 règnes. La carte « Marches réalisées : 1 » fonctionne car elle compte les liens, pas les snapshots.

## Solution

Réutiliser la source de vérité déjà en place — la RPC `get_marche_species_count(p_marche_id uuid)` — qui unifie `biodiversity_snapshots` ∪ `marcheur_observations` avec filtre rayon et alias taxonomiques.

Pour ça, il faut **résoudre les `marche_events` liés à la propriété vers les `marches.id`** correspondants. Le pont existant est :

```text
marche_events.exploration_id → exploration_marches.exploration_id → exploration_marches.marche_id
```

## Étapes

1. **Nouvelle RPC `public.get_propriete_biodiversity(p_propriete_id uuid)`** (SECURITY DEFINER, search_path public,extensions) :
   - Récupère `propriete_marche_events` → `marche_events.exploration_id`
   - Joint `exploration_marches` pour obtenir la liste des `marches.id` sous-jacents
   - Appelle la logique de `get_marche_species_count` par marche puis agrège :
     - `species_total` (union dédupliquée par clé canonique)
     - `by_kingdom` (Animalia, Plantae, Fungi, Others)
     - `top_species` (top 12 par nombre d'observations)
     - `events` (id, title, date_marche, last_event_date)
   - GRANT EXECUTE à `authenticated`

2. **`src/hooks/propriete/usePropertyBiodiversity.ts`** : remplacer les requêtes actuelles par un simple `supabase.rpc('get_propriete_biodiversity', { p_propriete_id })`. L'interface `PropertyBiodiversity` reste identique — aucun changement dans les 5 onglets.

3. **Vérification** : sur `/propriete/jardin-monde-deviat`, les compteurs doivent refléter l'événement DEVIAT Jardin Monde (espèces, règnes, top espèces, palette végétale).

## Notes techniques

- Pas de changement RLS nécessaire (RPC en SECURITY DEFINER, appelée par utilisateur authentifié ayant déjà accès à la propriété via `useUserAppsAccess`).
- Cohérence garantie avec Carnet / Carte / Synthèse marcheur puisqu'on partage la même logique de comptage.
- Si un `marche_event` n'a pas d'`exploration_id`, il est ignoré côté biodiversité (comportement à documenter).
