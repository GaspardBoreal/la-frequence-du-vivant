

# Ajustements fins de la page Accueil

## 4 corrections ciblées

### 1. "MA FRÉQUENCE DU JOUR" — remonter le titre
**Fichier** : `src/components/community/FrequenceWave.tsx` (ligne 228)
- Réduire le `mb-1.5` du conteneur titre à `mb-1` pour gagner quelques pixels en haut

### 2. "Votre rôle actuel" — remonter le texte
**Fichier** : `src/components/community/ProgressionCard.tsx` (ligne 62)
- Réduire le `mb-1` à `mb-0.5` pour resserrer le texte "Votre rôle actuel" vers le badge

### 3. Chiffre marchesCount — aligner verticalement avec le badge "Marcheur"
**Fichier** : `src/components/community/ProgressionCard.tsx` (lignes 60-68)
- Le `flex items-center` aligne sur le centre du bloc gauche (texte + badge), mais le chiffre paraît trop haut car le texte "Votre rôle actuel" décale le centre
- Changer `items-center` en `items-end` sur le flex parent pour que le chiffre s'aligne avec la baseline du badge "Marcheur"

### 4. Bordure des cercles de rôle actif plus épaisse
**Fichier** : `src/components/community/ProgressionCard.tsx` (ligne 110)
- Remplacer `border` par `border-2` uniquement pour les cercles actifs (`isActive`)
- Les inactifs gardent `border` simple

## Fichiers modifiés

| Fichier | Lignes | Changement |
|---------|--------|-----------|
| `FrequenceWave.tsx` | 228 | `mb-1.5` → `mb-1` |
| `ProgressionCard.tsx` | 60 | `items-center` → `items-end` |
| `ProgressionCard.tsx` | 62 | `mb-1` → `mb-0.5` |
| `ProgressionCard.tsx` | 110 | `border` → `border-2` pour les actifs, `border` pour les inactifs |

Aucun changement de couleur, contenu ou structure.

