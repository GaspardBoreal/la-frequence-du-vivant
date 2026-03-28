

# Fix : Bouton "Rejoignez la communauté" qui déborde

## Problème

Le bouton de connexion affiche le texte long "Rejoignez la communauté des marcheurs du vivant" qui déborde horizontalement du conteneur sur mobile (390px). Ce texte est trop long pour un bouton de soumission de formulaire de connexion.

## Solution

Deux corrections combinées :

1. **Raccourcir le texte du bouton connexion** : remplacer par "Se connecter" — c'est un formulaire de connexion, pas d'inscription. Le texte actuel est confus en plus d'être trop long.

2. **Ajouter `whitespace-nowrap` → `whitespace-normal` et `text-center`** sur le bouton comme filet de sécurité pour tout texte long futur, avec un `text-sm` pour réduire la taille si nécessaire.

## Fichier modifié

| Fichier | Changement |
|---------|-----------|
| `src/pages/MarchesDuVivantConnexion.tsx` | Ligne 210 : changer le label du bouton connexion en "Se connecter" |

