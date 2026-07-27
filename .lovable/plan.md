## Ce qui se passe

Écarter *Acanthus mollis* échoue avec :
`invalid input syntax for type uuid: "https://www.inaturalist.org/observations/362307364"`

Ce point vient d'un snapshot iNaturalist : sa clé de curation (`target_kind = 'snapshot_attr'`) est l'URL de l'observation, pas un identifiant interne. C'est normal et voulu.

Le problème est dans la fonction base `set_observation_gps_override` : elle écrit une ligne de journal d'audit avec

```sql
INSERT INTO public.marcheur_media_gps_audit(... target_id ...)
SELECT 'observation', _target_key::uuid, ...
WHERE _target_kind = 'observation';
```

Le filtre `WHERE _target_kind = 'observation'` est censé neutraliser la conversion pour les points iNaturalist, mais Postgres évalue la conversion `_target_key::uuid` au moment de préparer la requête, avant d'appliquer le filtre. L'URL n'étant pas un UUID, la fonction s'arrête en erreur — alors même que l'écartement lui-même est valide.

Conséquence : **aucune observation d'origine iNaturalist ne peut être écartée, repositionnée ni validée** ; seules les observations marcheurs (clé UUID) fonctionnent.

## Correction

Une migration base de données qui remplace les deux fonctions de curation :

1. `set_observation_gps_override`
   - calculer d'abord un identifiant interne optionnel : renseigné uniquement si la cible est une observation marcheur et que la clé est bien au format UUID, sinon vide ;
   - n'écrire la ligne de journal d'audit que dans ce cas, via une condition explicite (plus de conversion évaluée « à vide ») ;
   - même protection pour la mise à jour miroir des coordonnées d'une observation marcheur ;
   - le reste (enregistrement de la correction, historique de la position d'origine, contrôles de droits) est inchangé.

2. `clear_observation_gps_override`
   - même protection au format UUID avant la remise en état d'une observation marcheur, pour que l'annulation d'une correction iNaturalist ne casse pas non plus.

Aucune modification de schéma, aucune donnée existante touchée, aucun changement de droits.

## Vérification

- Écarter à nouveau l'Acanthe à feuilles de figuier depuis la console GPS : le point doit passer en « écartée » et disparaître du périmètre partout (propriété, marche, exploration, événement, exports).
- Vérifier ensuite qu'une observation marcheur reste écartable/repositionnable et que la ligne de journal d'audit est toujours créée pour ce cas.
- Tester l'annulation d'une correction sur les deux types de points.

## Détails techniques

Mécanisme exact : plpgsql prépare un plan personnalisé où `_target_key` est une constante, et Postgres replie la conversion `text → uuid` au moment de la planification, ce qui déclenche l'erreur avant le filtre `WHERE`. La parade est de sortir la conversion du plan (variable calculée avec un test de format UUID par expression régulière) et d'entourer les instructions concernées d'un `IF`, qui n'est planifié que s'il est exécuté.
