# Fix : recherche de profil "Rattacher la demande"

## Problème

Dans `/admin/adhesions`, le dialogue "Rattacher la demande à un profil" est pré-rempli avec `"{prenom} {nom}"` (ex. `Gaspard Boréal`). La requête envoyée à Supabase est :

```
prenom.ilike.%Gaspard Boréal%
OR nom.ilike.%Gaspard Boréal%
OR ville.ilike.%Gaspard Boréal%
```

Aucun profil ne contient la chaîne entière dans **un seul** champ → "Aucun profil trouvé", alors que le profil Gaspard Boréal existe bien (prenom=`Gaspard`, nom=`Boréal`, ville=`CEVA (Italie)`).

## Correction

Dans `src/pages/AdhesionAdmin.tsx`, fonction `searchProfiles(q)` :

1. **Tokeniser** la saisie sur les espaces, filtrer les tokens < 2 caractères.
2. Pour chaque token, construire un `.or(prenom.ilike.%t%,nom.ilike.%t%,ville.ilike.%t%)`.
3. Combiner en chaînant les `.or()` (AND implicite entre clauses) → chaque token doit matcher au moins un champ. Cela permet de trouver `Gaspard` (prenom) + `Boréal` (nom) sur le même profil.
4. Limiter à 20 résultats, trier par `nom, prenom`.

### Variante simple si un seul token

Conserver le comportement actuel pour une saisie d'un seul mot (ex. `gaspard` seul ou `bordeaux`).

### Bonus UX (mineur, même fichier)

- Afficher l'email/user_id en plus du nom/ville dans la liste des résultats pour lever toute ambiguïté (ajouter `user_id` au SELECT et l'afficher en petit gris).
- Si `linkingRequest.email` correspond à un `auth.users.email` connu (déjà résolu côté edge `submit-adhesion` → `matched_profile_id`), pré-sélectionner ce profil — mais ici la demande est `pending` donc pas de match : on garde juste la tokenisation.

## Fichiers modifiés

- `src/pages/AdhesionAdmin.tsx` (fonction `searchProfiles` uniquement, ~15 lignes)

Aucune migration DB, aucun changement RLS.
