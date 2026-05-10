# Comptes sciences participatives des marcheurs

Aujourd'hui un marcheur n'a aucun champ pour ses identifiants iNaturalist / eBird / GBIF. On va lui permettre d'en avoir **plusieurs**, sur plusieurs **réseaux**, avec un rendu visuel inspirant et des filtres clairs dans `/admin/community`.

## 1. Modèle de données (extensible)

Nouvelle table normalisée (1 marcheur → N comptes), plutôt que des colonnes figées. On pourra ajouter Pl@ntNet, Tela Botanica, Faune-France, BirdNET, etc. sans migration.

```text
community_profile_science_accounts
  id            uuid pk
  profile_id    uuid → community_profiles.id (cascade)
  network       enum  (inaturalist | ebird | gbif | plantnet | faune_france | other)
  username      text  (login public)
  display_name  text? (libellé affiché)
  profile_url   text? (URL publique calculée ou saisie)
  external_id   text? (id technique si connu)
  verified      bool  default false  (badge "Vérifié")
  created_at, updated_at
  unique (profile_id, network, username)
```

RLS : lecture par le marcheur lui‑même + admins ; écriture par le marcheur + admins.

## 2. Présentation : badges réseaux

Chaque réseau a un **jeton visuel** (couleur + initiale + icône Lucide) cohérent avec le design system, en HSL via `--network-{key}` ou variantes Tailwind sémantiques.


| Réseau       | Couleur | Icône      | Initiale |
| ------------ | ------- | ---------- | -------- |
| iNaturalist  | emerald | Leaf       | iN       |
| eBird        | sky     | Bird       | eB       |
| GBIF         | violet  | Database   | G        |
| Pl@ntNet     | lime    | Sprout     | P@       |
| Faune-France | amber   | Binoculars | FF       |
| Autre        | slate   | Link       | •        |


Un composant réutilisable `<NetworkBadge network size />` (puce ronde 20/24/28 px, tooltip avec @username + lien externe). Utilisé partout (carte profil, sheet, fiches publiques).

## 3. UI carte profil (`ProfilCard.tsx`)

Sous le nom + rôle, une **rangée de pastilles** des réseaux liés :

```text
[Pierre Dupont]                    [iN][eB][G]
Marcheur · Sarlat                  3 réseaux
```

- Pastilles cliquables → ouvre l'URL publique du compte dans un nouvel onglet (stopPropagation pour ne pas déclencher l'éditeur).
- Si aucun compte : petite mention discrète "Pas de compte science participative" + bouton subtil "+ Ajouter" (ouvre la sheet sur l'onglet dédié).
- Animation `motion` au survol : pastilles s'écartent légèrement (effet « éventail »).

## 4. Filtres (`ProfilsMosaique.tsx`)

Au-dessus de la grille, **nouvelle ligne de filtres** dédiée aux réseaux, sobre et lisible :

```text
Comptes :  [ ⦿ Tous ]  [ iN iNaturalist · 42 ]  [ eB eBird · 17 ]  [ G GBIF · 9 ]  …  [ Avec ≥ 1 ]  [ Sans aucun ]
```

- **Multi-sélection** (OR par défaut) : afficher les marcheurs ayant **au moins un** compte parmi ceux cochés.
- Toggle secondaire **ET/OU** discret pour basculer en intersection (utile pour repérer les multi-comptes).
- Deux raccourcis : `Avec ≥ 1 compte` et `Sans aucun compte`.
- Compteurs en temps réel sur chaque pastille.
- État reflété dans l'URL (`?networks=inaturalist,ebird&mode=or`) pour partage.

Compteur global déjà existant (`{filtered.length} profils`) reste affiché.

## 5. Édition (`MarcheurEditSheet.tsx`)

Nouvelle section **« Comptes sciences participatives »** :

- Liste des comptes existants en lignes : `[badge]  @username  [lien ↗]  [✓ vérifié]  [✎] [🗑]`
- Bouton `+ Ajouter un compte` ouvre une mini‑popover :
  - Select réseau, input username, auto‑génération de `profile_url` (templates : `https://www.inaturalist.org/people/{u}`, `https://ebird.org/profile/{u}`, `https://www.gbif.org/user/{u}`).
  - Validation : username non vide, unicité (network, username) par profil.
- Sauvegarde via mutation dédiée + invalidation `community-profiles-admin`.

## 6. Hook & requête

`useCommunityProfilesAdmin` (existant) enrichi : jointure `community_profile_science_accounts` agrégée en `science_accounts: NetworkAccount[]` par profil. Filtrage côté client (volumes faibles), pré-comptes par réseau calculés en `useMemo` pour les pastilles.

## Détails techniques

- Migration : enum `science_network`, table + index sur `(profile_id)` et `(network)`, trigger `updated_at`, RLS (`profile.user_id = auth.uid()` OR `has_role(auth.uid(),'admin')`).
- Types : nouveau `src/types/scienceAccounts.ts` avec `NETWORK_META` (label, color HSL token, icon, urlTemplate).
- Composants nouveaux : `src/components/admin/community/NetworkBadge.tsx`, `NetworkFilters.tsx`, `ScienceAccountsEditor.tsx`.
- Composants modifiés : `ProfilCard.tsx`, `ProfilsMosaique.tsx`, `MarcheurEditSheet.tsx`, hook de listing.
- Aucune rupture des URLs publiques ; aucune dépendance ajoutée (icônes Lucide déjà disponibles).

## Questions pour sécuriser

1. **Réseaux à la V1** : on part sur **iNaturalist + eBird + GBIF** uniquement, et on garde l'enum extensible ? Inclus aussi Pl@ntNet et Faune-France dès le départ
2. **Édition** : seuls les **admins** éditent depuis cette page (status quo), on prévoit aussi un éditeur côté marcheur dans son espace perso (« Mon profil ») 
3. **Vérification** : flag `verified` simple manuel par admin suffit