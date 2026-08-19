# Ne plus ouvrir les espaces partenaires IoT aux administrateurs par défaut

## Ce qui se passe

Victor Boixeda n'a **aucune habilitation partenaire** (sa fiche l'indique bien : « Aucune habilitation »), mais il est **administrateur**. La fonction serveur qui calcule les espaces disponibles à la connexion renvoie *tous* les fabricants dès que l'utilisateur est admin, sans regarder la table des habilitations. D'où la carte « BRAD TECHNOLOGY » dans son écran d'accueil.

Vérifié : 0 ligne d'habilitation pour ce compte, 1 ligne administrateur.

## Correction

La liste des espaces partenaires proposée à la connexion sera calculée **uniquement** à partir des habilitations actives (marcheur + fabricant + accès actif). Le statut administrateur ne donnera plus d'accès implicite.

Conséquence assumée : un administrateur qui veut réellement une console fabricant doit être habilité comme les autres (depuis l'onglet Partenaires de /admin/iot ou la fiche marcheur). Le pilotage IoT global reste accessible via /admin/iot, qui ne dépend pas de cette liste.

Aucun autre écran, aucune autre règle d'accès n'est modifiée.

## Détail technique

- Migration : redéfinir `public.get_user_apps_access()` en retirant la branche `v_is_admin OR` du filtre sur `iot_fournisseurs` ; le reste du corps (propriétés accessibles, propriété principale, comptages capteurs) est inchangé.
- Aucun changement front : `useUserAppsAccess` / `AppChoiceDialog` consomment simplement la liste corrigée.
