# Plan de correction

## Diagnostic
L’erreur vient bien de la fonction SQL `public.attach_pratique_to_marcheur` actuellement déployée.

- La fonction contient `public.has_role(v_caller, 'admin'::app_role)`.
- Dans cette base, le type `public.app_role` n’existe pas.
- Le seul enum trouvé est `public.crm_role`.
- Résultat : l’appel RPC échoue avant même de créer/réutiliser la ligne marcheur de Jean‑François Servant.

## Ce que je vais corriger

### 1) Corriger la vérification d’autorisation dans la RPC
Créer une migration qui remplace le cast invalide par le pattern compatible avec ce projet.

Approche prévue :
- remplacer `app_role` par la logique réellement utilisée dans cette base ;
- privilégier un check admin robuste et cohérent avec les autres fonctions récentes ;
- conserver l’accès pour `ambassadeur` et `sentinelle` via `community_profiles.role`.

### 2) Préserver la logique déjà ajoutée pour les participants non éditoriaux
Je garde le comportement déjà prévu pour Jean‑François Servant :
- si un `exploration_marcheurs` existe déjà pour lui, il est réutilisé ;
- sinon la RPC crée automatiquement une ligne “shadow” liée à son `user_id` ;
- l’association à la pratique est ensuite créée normalement.

### 3) Vérifier la compatibilité des signatures et permissions
Je vérifierai que la fonction corrigée reste compatible avec le frontend actuel :
- `p_curation_id`
- `p_marcheur_id`
- `p_user_id`
- `p_role_label`

Et je conserverai les droits d’exécution pour les utilisateurs authentifiés autorisés.

## Validation prévue
Après application de la migration, je validerai que :
- Jean‑François Servant peut être associé sans erreur ;
- les autres participants communautaires de l’exploration peuvent aussi être associés ;
- les associations existantes ne sont pas cassées ;
- l’erreur `type "app_role" does not exist` ne réapparaît plus.

## Détails techniques
- **Base concernée :** fonction `public.attach_pratique_to_marcheur`
- **Cause racine :** cast vers un enum inexistant (`app_role`)
- **Enum réellement présent :** `public.crm_role`
- **Impact attendu :** correction backend uniquement, sans refonte UI

```text
UI picker
  -> RPC attach_pratique_to_marcheur
      -> check autorisation admin/curateur
      -> resolve marcheur existant ou shadow row
      -> insert/update curation_marcheurs
```

## Livrable
- une migration SQL ciblée pour corriger la RPC ;
- puis la vérification fonctionnelle du flux d’association dans L’Oeil.