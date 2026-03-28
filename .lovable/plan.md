

# Corriger l'ecart de donnees entre site web et web app

## Diagnostic

Le rayon est bien aligne a 500m. L'ecart restant (42 especes vs 254) vient du **filtre temporel** :

- **Page bioacoustique** (site web) : `dateFilter: 'recent'` = observations des **2 dernieres annees**
- **Carnet Vivant** (web app) : `dateFilter: 'medium'` = observations des **5 dernieres annees**

5 ans de donnees ramenent naturellement beaucoup plus d'especes que 2 ans, d'ou le x6.

## Solution

Aligner le `dateFilter` du Carnet Vivant sur `'recent'` pour que les deux interfaces affichent exactement les memes chiffres.

## Fichier modifie

| Fichier | Changement |
|---------|-----------|
| `src/components/community/MarcheDetailModal.tsx` | Ligne 185 : changer `dateFilter: 'medium'` en `dateFilter: 'recent'` |

