# Bug

Dans **Apprendre → Ce que nous avons vu → Le cœur (Textes)**, le haïku « Pissenlit » apparaît sous **Gaspard Boréal** alors qu'il a été réattribué à **Sophie D** (correctement affiché dans Marcheurs → Marcheurs).

# Cause racine

`TextesEcritsSubTab` consomme deux RPCs SECURITY DEFINER :
- `get_exploration_public_textes(p_exploration_id)`
- `get_event_public_textes(p_event_id)`

Les deux renvoient `t.user_id` (l'uploader) et joignent `community_profiles` sur cet uploader. Elles **ignorent totalement** `attributed_user_id` et `attributed_marcheur_id`, alors que partout ailleurs (Marcheurs, badges, modal) on route via `routeTexte` (crew → user → uploader).

Le frontend (`TextesEcritsSubTab`) groupe ensuite par `t.user_id` et appelle `authorMap.get(t.user_id)` → tout est attribué à l'uploader.

# Correctif

## 1. Migration SQL — recalculer l'auteur effectif côté RPC

Mettre à jour les deux fonctions pour exposer :
- `user_id` = **auteur effectif** (priorité : `attributed_marcheur_id.user_id` > `attributed_user_id` > `user_id`)
- `attributed_marcheur_id` (crew shadow non lié à un compte)
- `author_prenom` / `author_nom` / `author_avatar` résolus depuis `community_profiles` si l'auteur effectif est un user, sinon depuis `exploration_marcheurs` (crew shadow)

Pseudocode SQL :
```sql
WITH resolved AS (
  SELECT t.*,
    em.user_id AS crew_user_id,
    em.prenom  AS crew_prenom,
    em.nom     AS crew_nom,
    em.avatar_url AS crew_avatar,
    COALESCE(em.user_id, t.attributed_user_id, t.user_id) AS effective_user_id
  FROM marcheur_textes t
  LEFT JOIN exploration_marcheurs em ON em.id = t.attributed_marcheur_id
  WHERE ...
)
SELECT r.id,
       COALESCE(r.effective_user_id, '00000000-0000-0000-0000-000000000000') AS user_id,
       r.attributed_marcheur_id,
       r.marche_id, r.marche_event_id, r.type_texte, r.titre, r.contenu,
       r.is_public, r.ordre, r.created_at,
       COALESCE(cp.prenom, r.crew_prenom)     AS author_prenom,
       COALESCE(cp.nom,    r.crew_nom)        AS author_nom,
       COALESCE(cp.avatar_url, r.crew_avatar) AS author_avatar
FROM resolved r
LEFT JOIN community_profiles cp ON cp.user_id = r.effective_user_id;
```

Aucune autre RPC n'est touchée. Les conditions `is_public = true` et la portée (event/exploration) restent inchangées.

## 2. Frontend — exposer l'attribution dans le typage

`src/components/community/exploration/TextesEcritsSubTab.tsx` :
- Ajouter `attributed_marcheur_id?: string | null` dans `TexteRow`.
- Construire la **clé d'auteur** comme `t.attributed_marcheur_id ?? t.user_id` partout où aujourd'hui on utilise `t.user_id` pour le groupement et le `authorMap` (modes "Mur", "Marcheurs", "Itinéraire", panneau de détail). Cela permet de distinguer un crew shadow non lié à un compte (deux haïkus du même crew shadow ne fusionnent pas avec un autre user qui n'a pas d'`attributed_user_id`).

Aucun changement nécessaire dans `MarcheursTab`, `MarcheDetailModal`, `useExplorationParticipants` ni `useMarcheurContributions` (déjà alignés via `routeTexte`).

# Fichiers touchés

- `supabase/migrations/<timestamp>_fix_public_textes_effective_author.sql` (nouveau)
- `src/components/community/exploration/TextesEcritsSubTab.tsx` (typage + clé de groupement)

# Vérification

Sur DEVIAT, le haïku « Pissenlit » :
- doit apparaître sous **Sophie D** dans Apprendre → Le cœur (au lieu de Gaspard),
- la carte/le détail doivent afficher avatar + nom de Sophie,
- les compteurs « voix » (nombre d'auteurs distincts) doivent s'aligner sur Marcheurs.
