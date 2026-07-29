## Objectif

Faire disparaître ces deux anciennes URL publiques :

```text
/marches-du-vivant/carnets-de-terrain/deviat-point-arbre-a-pic-vert--deviat
/marches-du-vivant/carnets-de-terrain/deviat-point-10-haies--deviat
```

## Ce qui a été vérifié

- Les deux URL correspondent à des marches réelles en base :
  - `DEVIAT Point Arbre à Pic Vert` — id `6e6e00f0-3bb0-4ec8-b849-38b4084aaed9`
  - `DEVIAT Point 10 HAIES` — id `f9d74108-c9b1-47d1-a4f1-4cbbb8414bdb`
- Toutes deux sont liées à l'exploration `70fcd8d1-…` avec `publication_status = 'published_public'`. C'est ce statut, et lui seul, qui les rend publiques.
- Les liens vers ces pages sont générés dynamiquement (aucun lien en dur dans le code) :
  - galerie `/marches-du-vivant/carnets-de-terrain` (`CarnetsDeTerrainGalerie` + `CarnetTerrainCard`)
  - navigation carnet précédent / suivant dans `CarnetDeTerrain.tsx`
- Aucune de ces URL n'est présente dans `public/sitemap.xml` ni `public/llms.txt` (seule la galerie l'est).

## Étapes

1. **Vérifier tous les liens de publication** de ces 2 marches (une marche peut être rattachée à plusieurs explorations, chacune avec son propre statut) avant modification.
2. **Migration de données** : passer chaque lien `exploration_marches` de ces 2 marches de `published_public` à `draft`.
3. **Effets attendus** : les 2 marches sortent de la liste des marches visibles (`useFeaturedMarches`), donc :
   - elles disparaissent de la galerie des carnets,
   - elles disparaissent de la navigation précédent/suivant des carnets voisins,
   - l'URL directe affiche l'écran « carnet introuvable » avec retour vers la galerie.
4. **Contrôle** : re-requête de vérification + parcours de la galerie en préview pour confirmer leur absence et que les carnets DEVIAT restants s'enchaînent correctement.

## Point d'attention à valider

`publication_status` est un statut global de la marche pour cette exploration : la dépublication la retire aussi des autres vues publiques alimentées par la même source (galerie fleuve, pages lecteurs, vitrines). Si tu veux la conserver ailleurs et l'exclure uniquement des carnets, il faudra un mécanisme d'exclusion dédié — dis-le moi et j'adapte.

## Détails techniques

- Modification : `UPDATE public.exploration_marches SET publication_status = 'draft' WHERE marche_id IN (…)` via l'outil de migration/données Supabase.
- Aucun changement de code n'est nécessaire : les listes et la navigation sont pilotées par les données.
- Pas de modification du sitemap (ces URL n'y figurent pas). Une désindexation Google plus agressive (410 / redirection) n'est pas incluse ici, conformément au choix « dépublier la marche ».
