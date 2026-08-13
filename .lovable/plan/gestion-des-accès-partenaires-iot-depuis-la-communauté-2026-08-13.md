# Gestion des accès partenaires IoT depuis la communauté

## Principe retenu (simple et robuste)

Aucune nouvelle table. On garde `iot_partner_users` (user_id + fournisseur + actif) comme unique
table de rattachement, exactement comme le CRM garde `team_members` : le compte reste un marcheur
de la communauté, on lui ajoute juste une habilitation « partenaire fabricant ».

Le parcours d'ajout copie celui du CRM (capture d'écran) : on choisit un marcheur existant dans la
communauté, puis on choisit le fabricant (BRAD Technology…) et l'état actif/inactif.

## 1. Nouvel onglet « Partenaires » dans /admin/iot

À côté de Poste de contrôle / Carte des sondes / Catalogue :

- Tableau des habilitations : marcheur (avatar, nom, ville, rôle communauté), fabricant, actif,
  date d'ajout.
- Bouton « Habiliter un marcheur » → même dialogue en deux temps que le CRM :
  1. sélection du marcheur (recherche par nom / ville / rôle, réutilise le picker communauté),
  2. sélection du fabricant + interrupteur « accès actif ».
- Actions par ligne : activer / désactiver (interrupteur), retirer l'habilitation.
- Filtre en tête : par fabricant et par état (actif / inactif).

Les marcheurs déjà habilités pour le fabricant choisi sont grisés dans le sélecteur, comme pour
l'équipe CRM.

## 2. Repérage et filtre dans l'interface des marcheurs

Dans l'administration de la communauté (liste des profils) :

- Une pastille « Partenaire · BRAD » s'affiche sur les marcheurs habilités (grisée si inactif).
- Un filtre « Accès partenaire » s'ajoute à la barre de filtres existante : Tous / Partenaires /
  un fabricant précis.
- Dans la fiche marcheur (panneau latéral), une ligne « Accès partenaire IoT » permet d'ajouter ou
  de retirer un fabricant sans passer par /admin/iot — même source de données, deux points d'entrée.

## 3. Sécurité

- Lecture/écriture de `iot_partner_users` réservée aux administrateurs (policy admin) ; chaque
  utilisateur continue de lire uniquement ses propres lignes.
- Aucun email exposé : l'affichage s'appuie sur `community_profiles` (prénom, nom, ville, rôle).

## Détails techniques

- Migration : policies admin (`check_is_admin_user`) en lecture/insertion/mise à jour/suppression
  sur `public.iot_partner_users`, plus les GRANT correspondants ; ajout d'un index
  `(fournisseur_id, actif)` et unicité `(user_id, fournisseur_id)` si absente.
- Hooks : `useIotPartnerAdmin` (liste jointe `community_profiles` + `iot_fournisseurs`, mutations
  add / toggle / remove) et `useIotPartnerBadges` (map `user_id -> fabricants`) pour l'affichage
  communauté.
- Composants : `IotPartnersTab.tsx` + `AddIotPartnerDialog.tsx` (réutilise `MarcheurPicker` du CRM),
  montés dans `src/pages/AdminIot.tsx` ; badge et filtre ajoutés dans
  `src/components/admin/community/ProfilsPanel.tsx` et `MarcheurEditSheet.tsx`.
- Invalidation de `['iot-partner-access']` après mutation pour que la console partenaire
  (`useIotPartnerAccess`) se débloque immédiatement.
