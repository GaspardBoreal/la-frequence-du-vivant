## Diagnostic confirmé

J’ai vérifié la base avant de retester le bouton **Enregistrer la fusion**.

### Ce qui est déjà en base
- La table `species_taxonomy_aliases` existe.
- Les index uniques partiels existent bien :
  - alias global : `alias_key` quand `marche_id IS NULL`
  - alias par marche : `(marche_id, alias_key)` quand `marche_id IS NOT NULL`
- Les triggers de propagation existent sur :
  - `marcheur_observations`
  - `biodiversity_snapshots`
  - `species_taxonomy_aliases`

### Ce que montrent les données DEVIAT / Jardin Monde
L’événement **DEVIAT "Jardin Monde du 11.03.26 à aujourd'hui"** est lié à 5 marches :
- DEVIAT C 0867
- DEVIAT C 863
- DEVIAT C 865
- DEVIAT Point 00 une maison pour vivre (C 362)
- DEVIAT Point POTAGER sur sols vivants

Les données Lantana sont encore séparées :
- Dans `marcheur_observations` :
  - `Lantana` sur 2 marches
  - `Lantana camara` sur 1 marche
- Dans `biodiversity_snapshots` :
  - `Lantana` encore présent sur les 5 marches de l’événement

Donc la fusion n’a pas été enregistrée : le message d’erreur est cohérent avec ton écran.

## Cause probable du message actuel

Même si les index existent, le code frontend utilise encore `.upsert(..., { onConflict: 'marche_id,alias_key' })` et `.upsert(..., { onConflict: 'alias_key' })` directement depuis Supabase JS.

Avec des **index uniques partiels**, PostgREST/Supabase ne résout pas toujours correctement ces cibles `ON CONFLICT` depuis l’API REST, surtout pour le cas :
- `marche_id IS NOT NULL`
- ou `marche_id IS NULL`

Résultat : Postgres répond encore :
`there is no unique or exclusion constraint matching the ON CONFLICT specification`

Le problème n’est donc plus seulement “index manquant” : c’est le choix de faire l’upsert côté client avec `onConflict` sur des index partiels.

## Correction proposée

### 1. Remplacer l’upsert frontend par une RPC serveur
Créer une fonction SQL sécurisée :

`public.upsert_species_taxonomy_alias(...)`

Elle fera l’enregistrement côté base sans utiliser le `ON CONFLICT` REST fragile.

Comportement :
- normalise `alias_key`
- cherche d’abord si une ligne existe pour :
  - même `alias_key`
  - même `marche_id`, y compris le cas `NULL`
- si elle existe : met à jour la ligne
- sinon : insère une nouvelle ligne
- retourne l’id de l’alias

Cela supprime définitivement l’erreur `ON CONFLICT` côté bouton.

### 2. Adapter le code admin pour utiliser cette RPC
Modifier :
- `src/hooks/useTaxonomyAliases.ts`
- `src/pages/AdminTaxonomyCuration.tsx`

Le bouton **Enregistrer la fusion** appellera désormais la RPC pour :
- fusion globale
- fusion par marche
- fusion par événement avec fan-out sur toutes les marches liées

### 3. Forcer la propagation sur snapshots aussi à l’enregistrement de l’alias
Le trigger actuel propage déjà vers `marcheur_observations`, mais il ne réécrit pas encore rétroactivement les lignes `biodiversity_snapshots` existantes dans la fonction de propagation que j’ai lue.

Je vais étendre la propagation pour que, dès qu’on crée l’alias `Lantana → Lantana camara`, les snapshots existants des marches concernées soient aussi réécrits.

Ainsi :
- `marcheur_observations` sera fusionné
- `biodiversity_snapshots.species_data` sera fusionné
- les futurs imports iNaturalist / Pl@ntNet seront normalisés par trigger

### 4. Contrôle post-correction sur les données DEVIAT
Après migration et adaptation du code, contrôler par requêtes que :
- les 5 marches de l’événement ont bien l’alias `lantana → Lantana camara`
- `marcheur_observations` ne contient plus `Lantana` sur ces marches
- `biodiversity_snapshots.species_data` ne contient plus `Lantana` sur ces marches
- l’UI ne peut plus afficher deux cartes séparées pour Lantana / Lantana camara après refresh

## Résultat attendu

Après correction, tu pourras cliquer **Enregistrer la fusion** sans erreur, et la fusion sera durable :
- visible dans Taxons observés
- prise en compte dans les compteurs
- prise en compte dans la fiche espèce / drawer
- prise en compte par les analyses, jeux pédagogiques, chaîne trophique et exports, car les données seront normalisées côté serveur.