

# Changer le tri par defaut en "Ancien" (ascendant)

## Probleme

Les trois onglets de contributions (Voir, Ecouter, Lire) dans `MarcheDetailModal.tsx` initialisent leur tri a `'desc'` (plus recent en premier). L'utilisateur souhaite que le tri par defaut soit `'asc'` (plus ancien en premier).

## Fichier : `src/components/community/MarcheDetailModal.tsx`

3 modifications identiques — changer la valeur initiale du `useState` :

| Ligne | Actuel | Corrige |
|-------|--------|---------|
| ~62 (VoirTab) | `useState<'desc' \| 'asc'>('desc')` | `useState<'desc' \| 'asc'>('asc')` |
| ~235 (EcouterTab) | `useState<'desc' \| 'asc'>('desc')` | `useState<'desc' \| 'asc'>('asc')` |
| ~367 (LireTab) | `useState<'desc' \| 'asc'>('desc')` | `useState<'desc' \| 'asc'>('asc')` |

Aucun autre fichier impacte. Le mode sombre reste inchange.

