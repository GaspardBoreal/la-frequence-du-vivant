

# Corrections des profils communautaires

## Probleme identifie

Les participations de Gaspard Boreal et Laurence Karki existent dans `marche_participations` mais n'ont jamais ete validees (`validated_at = NULL`). Le trigger `update_community_role_on_participation` ne met a jour `marches_count` et le role que lorsque `validated_at` passe de NULL a une valeur. C'est pourquoi les compteurs sont a 0.

Note supplementaire : le nom de Laurence Karki semble inverse dans la base (prenom=Karki, nom=Laurence).

## Donnees actuelles

| Marcheur | Participations | Validees | marches_count affiché | Role |
|---|---|---|---|---|
| Gaspard Boreal | 2 (Transhumance, Reveil de la Terre) | 0 | 0 | marcheur_en_devenir |
| Laurence Karki | 1 (Transhumance) | 0 | 0 | marcheur_en_devenir |
| Zephyrine Elhage | 2 (Reveil de la Terre, NOUAILLE) | 1 | 1 | marcheur |

## Corrections a appliquer

### 1. Valider les participations manquantes

Utiliser l'outil d'insertion pour mettre a jour `validated_at` et `validation_method` sur toutes les participations non validees :

```sql
UPDATE marche_participations 
SET validated_at = now(), validation_method = 'admin_retroactif'
WHERE validated_at IS NULL;
```

Cela declenchera le trigger `update_community_role_on_participation` qui recalculera automatiquement `marches_count` et le role pour chaque marcheur.

### 2. Mettre a jour le profil de Gaspard Boreal en Sentinelle

Apres validation des participations, le trigger lui attribuera le role `marcheur` (2 participations). Mais Gaspard etant le createur de la demarche, il doit etre `sentinelle`. Il faut donc :

```sql
UPDATE community_profiles 
SET role = 'sentinelle', formation_validee = true, certification_validee = true
WHERE prenom = 'Gaspard' AND nom = 'Boreal';
```

### 3. Corriger le nom inverse de Laurence Karki (a confirmer)

Si `prenom` devrait etre "Laurence" et `nom` devrait etre "Karki" :

```sql
UPDATE community_profiles 
SET prenom = 'Laurence', nom = 'Karki'
WHERE user_id = '0c9a3fbe-20d0-4989-bde9-24678768e85f';
```

### 4. Valider aussi la participation de Zephyrine au Reveil de la Terre

Sa participation a cet evenement est aussi non validee.

## Resultat attendu

| Marcheur | marches_count | Role |
|---|---|---|
| Gaspard Boreal | 2 | sentinelle (force) |
| Laurence Karki | 1 | marcheur |
| Zephyrine Elhage | 2 | marcheur |

## Fichiers impactes

Aucun fichier code a modifier — uniquement des mises a jour de donnees en base via l'outil d'insertion SQL.

