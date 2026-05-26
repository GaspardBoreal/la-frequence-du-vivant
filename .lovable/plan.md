# Plan de correction

## Diagnostic
Le problème est désormais clair : **la fonction active `public.admin_orphan_activity_logs()` en base référence encore `public.has_role(auth.uid(), 'admin'::app_role)`**, alors que :
- **le type `app_role` n’existe pas** dans cette base ;
- **la fonction `has_role` n’existe pas non plus** parmi les fonctions actives relevées ;
- seule la fonction de suppression `admin_delete_orphan_activity_logs(uuid[])` a été corrigée pour utiliser `public.check_is_admin_user(auth.uid())`.

Donc l’écran ne casse pas à cause du composant React lui-même : **il affiche simplement l’erreur renvoyée par le RPC de chargement**.

## Correction proposée

### 1. Corriger la fonction de chargement côté base
Créer une **nouvelle migration corrective** qui remplace la fonction active `public.admin_orphan_activity_logs()` par une version utilisant :
- `public.check_is_admin_user(auth.uid())`
- le même résultat métier qu’aujourd’hui (liste des comptes orphelins, nombre de logs, dates, types d’événements)

Objectif : **supprimer toute dépendance à `app_role`** sur le chargement des activités orphelines.

### 2. Vérifier qu’aucune autre fonction active de ce flux ne référence encore `app_role`
Dans la même passe de validation, contrôler les fonctions réellement présentes en base pour confirmer qu’il ne reste plus de référence active à :
- `app_role`
- `has_role(...)`

Objectif : éviter un **4e faux correctif** où seule une moitié du flux est réparée.

### 3. Laisser le frontend inchangé sauf si un ajustement de robustesse est nécessaire
Le composant `OrphanActivityLogsPanel.tsx` semble correct pour ce bug précis :
- il appelle `admin_orphan_activity_logs`
- il affiche le message d’erreur renvoyé par Supabase

Je ne toucherai donc pas l’UI **que si nécessaire**, pour rester strictement dans le périmètre du bug.

### 4. Validation après correction
Après migration, valider que :
- le panneau ne renvoie plus `Erreur de chargement : type "app_role" does not exist` ;
- les lignes orphelines remontent bien dans l’interface ;
- le message `Aucune activité orpheline. ✨` n’apparaît que lorsque le RPC retourne réellement zéro ligne.

## Détail technique
- **Objet fautif identifié** : `public.admin_orphan_activity_logs()`
- **Cause exacte** : cast vers un enum absent (`'admin'::app_role`) dans une fonction active
- **Garde admin correcte déjà existante dans le projet** : `public.check_is_admin_user(auth.uid())`
- **Approche sûre** : créer une nouvelle migration qui remplace la fonction active, sans bricoler le type `app_role`

## Résultat attendu
Le panneau “Activités orphelines” recharge normalement et affiche les 3 comptes orphelins au lieu du message d’erreur.