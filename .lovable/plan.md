# Correctif recherche entreprises — paramètre `commune`

## Diagnostic

L'API `recherche-entreprises.api.gouv.fr` attend pour le paramètre `commune` un **code INSEE** (ex. `33290`), pas un nom de ville. Quand l'utilisateur tape `MONTAGNE`, l'edge function `search-french-companies` transmet la chaîne telle quelle → l'API répond `400 — "Au moins une valeur du paramètre commune est non valide."`.

Le champ `code_postal` (`33570`), lui, est accepté tel quel par l'API.

## Correction (edge function uniquement)

Dans `supabase/functions/search-french-companies/index.ts`, avant `buildUrl()` :

1. Si `commune` est fourni **et n'est pas** un code INSEE (5 chiffres) :
   - Appeler `https://geo.api.gouv.fr/communes?nom=<commune>&fields=code,nom,codesPostaux&boost=population&limit=5`
   - Si `code_postal` est fourni, ajouter `&codePostal=<code_postal>` pour désambiguïser (cas « La Montagne 44 » vs « Montagne 33 »).
   - Prendre le 1ᵉʳ résultat exact (nom normalisé NFD/casse) ou le mieux classé, et remplacer `payload.commune` par son `code` INSEE.
2. Si aucun match :
   - Supprimer `commune` du payload.
   - Concaténer le nom saisi dans `payload.q` (`[q, communeName].filter(Boolean).join(' ')`) pour conserver l'intention de l'utilisateur.
3. Logger la résolution (`[search-french-companies] commune "MONTAGNE" + CP 33570 → INSEE 33290`).
4. Petit cache mémoire (`Map<string, string>`) sur clé `nom|cp` pour éviter de retaper geo.api à chaque frappe.

## Hors périmètre

- UI du drawer inchangée (le label « Ville / commune » reste, le user continue à taper un nom).
- Aucune migration DB, aucun nouveau secret.

## Vérification

- `MONTAGNE` + `33570` → doit retourner les entreprises de la commune INSEE 33290.
- `Bordeaux` seul → INSEE 33063, résultats OK.
- `XyzInexistant` → fallback `q`, pas d'erreur 400.
