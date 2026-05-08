## Le bug

Sur DEVIAT Point 01 Descente, l'onglet **Écrire** affiche un badge "2" mais une seule fiche s'affiche ("Chevreuil – Crédité à Karine Log").

### Cause racine

Le badge et l'affichage utilisent **deux logiques d'attribution différentes** :

- **Badge `tabCounts.ecrire`** (`MarcheDetailModal.tsx` ligne 1202) vient de `useMarcheurStats.totalTextes`, calculé en SQL par :
  ```
  marcheur_textes WHERE marche_id = X AND (user_id = moi OR is_public = true)
  ```
  → ignore complètement `attributed_user_id` / `attributed_marcheur_id`.

- **Affichage `LireTab`** filtre ensuite par *effective author* :
  - `myTextes` = textes dont l'auteur effectif est moi (donc un texte que j'ai tapé mais réattribué à quelqu'un d'autre **n'est plus à moi**)
  - `othersTextes` = ceux des autres, **et seulement si `is_public = true`**

### Données réelles pour Point 01 (Gaspard = b821bb9c)

| titre     | user_id | attributed_marcheur | is_public | compté ? | affiché ? |
|-----------|---------|---------------------|-----------|----------|-----------|
| Cerisier  | Gaspard | Karine (crew)       | false     | OUI (typist=moi) | NON (auteur effectif=Karine, mais privé → exclu de othersTextes) |
| Chevreuil | Gaspard | Karine (crew)       | true      | OUI (public) | OUI (Crédité à Karine Log) |

→ badge = 2, affiché = 1.

## Plan de correction

Aligner le badge sur la **même règle que l'affichage** : compter les textes après résolution de l'auteur effectif et application des règles de visibilité.

### Étape 1 — Corriger `useMarcheurStats` (textes seulement)

`src/hooks/useMarcheurContributions.ts` (fonction `useMarcheurStats`) : remplacer le `count head:true` SQL pour les textes par un fetch léger des colonnes nécessaires + comptage côté client utilisant `routeTexte` :

```ts
// au lieu de count head:true
const { data: textRows } = await supabase
  .from('marcheur_textes')
  .select('id, user_id, attributed_user_id, attributed_marcheur_id, is_public')
  .eq(filterCol, filterVal)
  .or(`user_id.eq.${userId},attributed_user_id.eq.${userId},is_public.eq.true`);

// totalTextes = mes propres (auteur effectif=moi) + autres publics
const total = (textRows || []).filter(t => {
  const mineEffective =
    (!t.attributed_marcheur_id && !t.attributed_user_id && t.user_id === userId) ||
    (t.attributed_user_id === userId && !t.attributed_marcheur_id);
  return mineEffective || (t.is_public && !mineEffective);
}).length;
```

(Photos/audio non concernés ici car le bug ne porte que sur `ecrire`. On pourra étendre plus tard si nécessaire.)

### Étape 2 — Vérifier la cohérence

Recharger la marche Point 01 :
- badge "Écrire" doit afficher **1** (Chevreuil seul)
- "Cerisier" reste invisible (privé + plus à Gaspard via auteur effectif)
- Sur Point 03 (où "Pissenlit" est crédité à Karine et public), Karine doit avoir badge=1, Gaspard ne doit plus le compter.

### Fichiers touchés

- `src/hooks/useMarcheurContributions.ts` — fonction `useMarcheurStats` (textes uniquement).

Aucune migration, aucun changement RLS, aucun changement UI.
