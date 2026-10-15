# Recherche par nom dans le filtre « Utilisateur » (Admin → Propriétés)

## Cause (vérifiée en base)
Le chargement des noms demandait une colonne `full_name` qui n'existe pas sur les profils. Le nom y est rangé en deux champs : `prenom` et `nom` (ex. Laurent / Tripied pour lt@bziiit.com, rattaché à 1 propriété). La requête échouait sans rien dire, aucun nom n'était chargé, et seule la recherche par e-mail marchait. Taper « laurent » ne trouvait donc rien.

## Correction
1. Dans `src/pages/AdminProprietes.tsx`, la requête des noms lit `user_id, prenom, nom` et construit le nom complet `prenom + ' ' + nom`, sans les espaces en trop (ex. « Laurent Tripied »).
2. Si cette requête échoue, l'erreur s'affiche dans la console : on la voit tout de suite au lieu d'avoir une liste vide sans explication.
3. Rien à changer dans le filtre lui-même : il cherche déjà dans le nom et l'e-mail, sans tenir compte des accents.

## Vérification
- Requête testée en base : elle doit renvoyer « Laurent Tripied » pour lt@bziiit.com.
- Dans le filtre « Utilisateur », taper « laurent », « tripied » ou « lt@ » doit faire apparaître Laurent Tripied, avec son e-mail et « 1 propriété ».
