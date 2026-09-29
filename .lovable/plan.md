# Correctif : erreur « Cannot read properties of undefined (reading 'rest') »

## Cause
Sur la page « Attribuer les œuvres », les appels au serveur passent par une copie détachée de la fonction d'appel. Cette copie a perdu le lien avec le client qui la porte, donc aucun appel n'aboutit : la liste reste vide (« 0 à attribuer »). En plus, la page affiche à tort « Toutes les œuvres ont un auteur. » alors qu'il s'agit d'une erreur.

## Correctif
1. Rattacher la fonction d'appel au client (`supabase.rpc.bind(supabase)`) dans `src/pages/AdminAttributionOeuvres.tsx`. Cela corrige les trois appels : chargement des œuvres, liste des marcheurs et attribution.
2. N'afficher le message « Toutes les œuvres ont un auteur. » que lorsque le chargement a réussi. En cas d'erreur, afficher un message clair avec un bouton « Réessayer ».

## Vérification
Recharger la page : le compteur doit afficher 292 à attribuer (241 photos et 51 sons), et les vignettes doivent apparaître, rangées par marche.
