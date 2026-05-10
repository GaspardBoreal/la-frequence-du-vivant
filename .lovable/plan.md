# Suggestion manquante pour "laurencekarki"

## Diagnostic

Données vérifiées en base :
- Le snapshot biodiversité contient bien l'observateur `laurencekarki` (source iNaturalist, 3 obs).
- Le profil existe : `Laurence Karki`.
- La RPC `suggest_science_accounts()` ne propose rien.

**Cause racine** : la RPC normalise le nom du profil en `"laurence karki"` (avec espace) et le compare à l'égalité stricte avec le nom d'observateur normalisé `"laurencekarki"` (sans espace, c'est un *login* iNaturalist, pas un display name). Les deux ne matchent jamais.

C'est un cas très fréquent sur iNaturalist où l'attribution remontée est le `user_login` (concaténé, en minuscules) plutôt que le nom affiché.

## Correctif proposé

Mettre à jour la RPC `suggest_science_accounts()` pour matcher selon **plusieurs formes normalisées** :

1. **Forme standard** : `unaccent(lower("prenom nom"))` — déjà en place (couvre "Gaspard Boréal").
2. **Forme compacte** : mêmes deux côtés mais espaces supprimés — couvre "laurencekarki" ↔ "Laurence Karki".
3. **Forme inversée** : `unaccent(lower("nom prenom"))` — couvre les attributions de type "Karki Laurence".

La JOIN devient : `match si l'une des trois formes du profil = la forme correspondante du nom d'observateur`.

Le calcul des homonymes (`homonym_count`) sera recalculé sur la même clé que celle qui a matché, pour conserver la distinction `exact` / `fuzzy` :
- 1 seul profil candidat → `confidence = 'exact'`
- ≥ 2 profils candidats sur la même clé → `confidence = 'fuzzy'`

Aucun changement côté frontend, types Supabase, ou table. Une seule migration SQL (CREATE OR REPLACE FUNCTION).

## Détails techniques

```text
profiles_norm:
  full_norm     = unaccent(lower(prenom||' '||nom))     -- "laurence karki"
  full_compact  = replace(full_norm, ' ', '')           -- "laurencekarki"
  full_reversed = unaccent(lower(nom||' '||prenom))     -- "karki laurence"

agg (observateurs):
  norm_name     = unaccent(lower(observerName))         -- "laurencekarki"
  compact_name  = replace(norm_name, ' ', '')           -- "laurencekarki"

matches: JOIN si
     p.full_norm     = g.norm_name
  OR p.full_compact  = g.compact_name
  OR p.full_reversed = g.norm_name
```

## Effet attendu

- "laurencekarki" → suggestion exacte sur le profil Laurence Karki (3 obs).
- "Gaspard Boréal" continue de matcher comme aujourd'hui.
- Les futurs marcheurs qui s'inscrivent sur iNat avec un login concaténé seront détectés automatiquement.

## Validation

Après application : recharger `/admin/community`, la bannière dorée doit afficher la suggestion pour Laurence Karki, et son `MarcheurEditSheet` doit afficher la carte "Compte iNaturalist suggéré".
